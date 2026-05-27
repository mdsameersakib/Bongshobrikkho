import { Person, Couple, Lineage } from '@/types/database';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 90;
const H_SPACING = 40;
const V_SPACING = 120;
const COUPLE_SPACING = 80;

export interface TreeNode {
  id: string;
  x: number;
  y: number;
  person: Person;
  relationship?: string;
}

export interface TreeEdge {
  id: string;
  type: 'marriage' | 'parent-child';
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  path?: string;
}

export interface TreeLayout {
  nodes: TreeNode[];
  edges: TreeEdge[];
  width: number;
  height: number;
}

interface FamilyUnit {
  id: string;
  type: 'single' | 'couple';
  members: Person[];
  memberIds: string[];
  parentUnitIds: Set<string>;
  childUnitIds: Set<string>;
  depth?: number;
}

export const calculateTreeLayout = (
  allPersons: Person[],
  userPerson: Person | null,
  couples: Couple[] = [],
  lineages: Lineage[] = []
): TreeLayout => {
  if (!userPerson || !allPersons?.length) return { nodes: [], edges: [], width: 0, height: 0 };

  const personMap = new Map(allPersons.map((p) => [p.id, p]));
  
  // 1. Build Family Units
  const units: FamilyUnit[] = [];
  const personToUnit = new Map<string, FamilyUnit>();
  const processedPersons = new Set<string>();

  const makeUnit = (id: string, type: 'single' | 'couple', memberIds: string[]) => {
    const members = memberIds.map(id => personMap.get(id)).filter((p): p is Person => !!p);
    if (members.length === 0) return null;
    
    const unit: FamilyUnit = {
      id,
      type,
      members,
      memberIds: members.map(m => m.id),
      parentUnitIds: new Set(),
      childUnitIds: new Set()
    };
    
    units.push(unit);
    members.forEach(m => {
      personToUnit.set(m.id, unit);
      processedPersons.add(m.id);
    });
    return unit;
  };

  // Create couple units
  couples.forEach(c => {
    makeUnit(`couple_${c.id}`, 'couple', [c.person1_id, c.person2_id]);
  });

  // Create single units for remaining persons
  allPersons.forEach(p => {
    if (!processedPersons.has(p.id)) {
      makeUnit(`single_${p.id}`, 'single', [p.id]);
    }
  });

  // 2. Link Units via Lineage
  lineages.forEach(l => {
    const childUnit = personToUnit.get(l.child_id);
    const parentUnit = units.find(u => u.id === `couple_${l.couple_id}`);
    
    if (childUnit && parentUnit && childUnit !== parentUnit) {
      parentUnit.childUnitIds.add(childUnit.id);
      childUnit.parentUnitIds.add(parentUnit.id);
    }
  });

  // 3. Assign Depths (BFS from User)
  const userUnit = personToUnit.get(userPerson.id);
  if (!userUnit) return { nodes: [], edges: [], width: 0, height: 0 };

  userUnit.depth = 0;
  const queue = [userUnit];
  const connectedUnits = new Set<string>([userUnit.id]);

  while (queue.length > 0) {
    const u = queue.shift()!;
    const d = u.depth!;

    [...u.parentUnitIds, ...u.childUnitIds].forEach(unitId => {
      const neighbor = units.find(unit => unit.id === unitId);
      if (neighbor && neighbor.depth === undefined) {
        neighbor.depth = u.parentUnitIds.has(unitId) ? d - 1 : d + 1;
        connectedUnits.add(neighbor.id);
        queue.push(neighbor);
      }
    });
  }

  const activeUnits = units.filter(u => u.depth !== undefined);
  if (activeUnits.length === 0) return { nodes: [], edges: [], width: 0, height: 0 };

  // 4. Simple Layout (Horizontal positioning by depth)
  const depthGroups = new Map<number, FamilyUnit[]>();
  activeUnits.forEach(u => {
    const group = depthGroups.get(u.depth!) || [];
    group.push(u);
    depthGroups.set(u.depth!, group);
  });

  const nodes: TreeNode[] = [];
  const edges: TreeEdge[] = [];
  const unitPositions = new Map<string, { x: number, y: number }>();

  let minX = 0, maxX = 0, minY = 0, maxY = 0;

  Array.from(depthGroups.keys()).sort((a, b) => a - b).forEach(depth => {
    const levelUnits = depthGroups.get(depth)!;
    let cursorX = 0;
    const y = depth * (NODE_HEIGHT + V_SPACING);

    levelUnits.forEach(u => {
      const uWidth = u.type === 'couple' ? NODE_WIDTH * 2 + COUPLE_SPACING : NODE_WIDTH;
      unitPositions.set(u.id, { x: cursorX, y });

      u.members.forEach((m, i) => {
        const x = cursorX + (u.type === 'couple' ? i * (NODE_WIDTH + COUPLE_SPACING) : 0);
        nodes.push({
          id: m.id,
          x,
          y,
          person: m,
          relationship: m.id === userPerson.id ? 'You' : undefined
        });
        maxX = Math.max(maxX, x + NODE_WIDTH);
        maxY = Math.max(maxY, y + NODE_HEIGHT);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
      });

      cursorX += uWidth + H_SPACING;
    });
  });

  // 5. Build Edges
  activeUnits.forEach(u => {
    const uPos = unitPositions.get(u.id);
    if (!uPos) return;

    // Marriage edges
    if (u.type === 'couple' && u.memberIds.length === 2) {
      edges.push({
        id: `marriage_${u.id}`,
        type: 'marriage',
        x1: uPos.x + NODE_WIDTH,
        y1: uPos.y + NODE_HEIGHT / 2,
        x2: uPos.x + NODE_WIDTH + COUPLE_SPACING,
        y2: uPos.y + NODE_HEIGHT / 2
      });
    }

    // Parent-Child edges
    u.childUnitIds.forEach(childUnitId => {
      const cUnit = units.find(unit => unit.id === childUnitId);
      const cPos = unitPositions.get(childUnitId);
      if (!cUnit || !cPos) return;

      const startX = u.type === 'couple' 
        ? uPos.x + NODE_WIDTH + COUPLE_SPACING / 2 
        : uPos.x + NODE_WIDTH / 2;
      const startY = u.type === 'couple' ? uPos.y + NODE_HEIGHT / 2 : uPos.y + NODE_HEIGHT;

      cUnit.members.forEach((child, i) => {
        const endX = cPos.x + (cUnit.type === 'couple' ? i * (NODE_WIDTH + COUPLE_SPACING) : 0) + NODE_WIDTH / 2;
        const endY = cPos.y;
        
        const midY = (startY + endY) / 2;
        edges.push({
          id: `pc_${u.id}_${child.id}`,
          type: 'parent-child',
          path: `M ${startX} ${startY} V ${midY} H ${endX} V ${endY}`
        });
      });
    });
  });

  return { nodes, edges, width: maxX - minX, height: maxY - minY };
};
