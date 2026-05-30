import { Person, Marriage, ParentChild } from '@/types/database';
import { getRelationshipToUser } from '@/utils/relationships';

const NODE_WIDTH = 240;
const NODE_HEIGHT = 100;
const H_SPACING = 150;
const V_SPACING = 160;

export interface TreeNode {
  id: string;
  x: number;
  y: number;
  person: Person;
  relationship?: string;
}

export interface TreeEdge {
  id: string;
  type: 'marriage' | 'parent-child' | 'junction-ball';
  status?: string;
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

export const calculateTreeLayout = (
  allPersons: Person[],
  userPerson: Person | null,
  marriages: Marriage[] = [],
  parentChild: ParentChild[] = []
): TreeLayout => {
  if (!userPerson || !allPersons?.length) return { nodes: [], edges: [], width: 0, height: 0 };

  const personMap = new Map(allPersons.map((p) => [p.id, p]));
  
  // 1. Assign Depths
  const depths = new Map<string, number>();
  const visited = new Set<string>();
  const queue: { id: string; depth: number }[] = [{ id: userPerson.id, depth: 0 }];
  visited.add(userPerson.id);

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    depths.set(id, depth);

    // Neighbors: Parents (up)
    const parents = parentChild
      .filter(pc => pc.child_id === id && personMap.has(pc.parent_id))
      .map(pc => pc.parent_id);

    parents.forEach(pId => {
      if (!visited.has(pId)) {
        visited.add(pId);
        queue.push({ id: pId, depth: depth - 1 });
      }
    });

    // Neighbors: Children (down)
    const children = parentChild
      .filter(pc => pc.parent_id === id && personMap.has(pc.child_id))
      .map(pc => pc.child_id);

    children.forEach(cId => {
      if (!visited.has(cId)) {
        visited.add(cId);
        queue.push({ id: cId, depth: depth + 1 });
      }
    });

    // Neighbors: Spouses (same level)
    const spouses = marriages
      .filter(m => (m.person1_id === id || m.person2_id === id))
      .map(m => m.person1_id === id ? m.person2_id : m.person1_id)
      .filter(sId => personMap.has(sId));
    
    spouses.forEach(sId => {
      if (!visited.has(sId)) {
        visited.add(sId);
        queue.push({ id: sId, depth: depth });
      }
    });
  }

  // 2. Horizontal Ordering
  const orderedIdsByDepth = new Map<number, string[]>();
  const allDepths = Array.from(new Set(depths.values())).sort((a, b) => a - b);

  allDepths.forEach(depth => {
    const levelIds = Array.from(depths.entries())
      .filter(([, d]) => d === depth)
      .map(([id]) => id);
    
    const sortedLevelIds: string[] = [];
    const levelVisited = new Set<string>();

    levelIds.forEach(id => {
      if (levelVisited.has(id)) return;
      const spouses = marriages
        .filter(m => m.person1_id === id || m.person2_id === id)
        .map(m => m.person1_id === id ? m.person2_id : m.person1_id)
        .filter(sId => depths.get(sId) === depth);

      if (spouses.length > 0) {
        if (spouses.length >= 2) {
          sortedLevelIds.push(spouses[0], id, ...spouses.slice(1));
          spouses.forEach(sId => levelVisited.add(sId));
        } else {
          sortedLevelIds.push(id, spouses[0]);
          levelVisited.add(spouses[0]);
        }
      } else {
        sortedLevelIds.push(id);
      }
      levelVisited.add(id);
    });
    orderedIdsByDepth.set(depth, sortedLevelIds);
  });

  // 3. Position Calculation
  const nodePositions = new Map<string, { x: number; y: number }>();
  let minX = 0, maxX = 0, minY = 0, maxY = 0;

  allDepths.forEach(depth => {
    const ids = orderedIdsByDepth.get(depth) || [];
    const y = depth * (NODE_HEIGHT + V_SPACING);
    ids.forEach((id, index) => {
      const x = index * (NODE_WIDTH + H_SPACING);
      nodePositions.set(id, { x, y });
      maxX = Math.max(maxX, x + NODE_WIDTH);
      maxY = Math.max(maxY, y + NODE_HEIGHT);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
    });
  });

  // 4. Build Nodes
  const nodes: TreeNode[] = [];
  nodePositions.forEach((pos, id) => {
    const person = personMap.get(id);
    if (person) {
      nodes.push({
        id, x: pos.x, y: pos.y,
        person,
        relationship: getRelationshipToUser(person, userPerson, allPersons, marriages, parentChild)
      });
    }
  });

  // 5. Build Edges
  const edges: TreeEdge[] = [];

  marriages.forEach(m => {
    const p1 = nodePositions.get(m.person1_id);
    const p2 = nodePositions.get(m.person2_id);
    if (p1 && p2) {
      edges.push({
        id: `marriage_${m.id}`,
        type: 'marriage',
        status: m.status || 'married',
        x1: p1.x + NODE_WIDTH / 2,
        y1: p1.y + NODE_HEIGHT / 2,
        x2: p2.x + NODE_WIDTH / 2,
        y2: p2.y + NODE_HEIGHT / 2
      });
    }
  });

  // Track unique parent connection points to create staggered horizontal lines
  const depthOffsets = new Map<number, number>();
  const familyChannels = new Map<string, number>();

  parentChild.forEach(pc => {
    const pPos = nodePositions.get(pc.parent_id);
    const cPos = nodePositions.get(pc.child_id);
    
    if (pPos && cPos) {
      const marriage = marriages.find(m => 
        (m.person1_id === pc.parent_id || m.person2_id === pc.parent_id) &&
        (parentChild.some(pc2 => pc2.child_id === pc.child_id && (pc2.parent_id === m.person1_id || pc2.parent_id === m.person2_id) && pc2.parent_id !== pc.parent_id))
      );

      let startX: number;
      let startY: number;

      if (marriage) {
        const sp1 = nodePositions.get(marriage.person1_id)!;
        const sp2 = nodePositions.get(marriage.person2_id)!;
        startX = (sp1.x + sp2.x) / 2 + NODE_WIDTH / 2;
        startY = sp1.y + NODE_HEIGHT / 2;
        
        edges.push({
          id: `junction_${pc.id}`,
          type: 'junction-ball',
          x1: startX,
          y1: startY
        });
      } else {
        startX = pPos.x + NODE_WIDTH / 2;
        startY = pPos.y + NODE_HEIGHT;
      }

      const endX = cPos.x + NODE_WIDTH / 2;
      const endY = cPos.y;
      
      // Create a unique channel key based on the parent's starting coordinates
      const familyKey = `${startX}-${startY}`;

      if (!familyChannels.has(familyKey)) {
        // Find the current offset for this row, default to 0 if it is empty
        const currentOffset = depthOffsets.get(startY) || 0;
        familyChannels.set(familyKey, currentOffset);
        // Add 25 pixels of vertical space so the next family on this row draws lower
        depthOffsets.set(startY, currentOffset + 25);
      }

      // Calculate the standard middle point, then add the specific family's offset
      const baseMidY = (startY + endY) / 2;
      const midY = baseMidY + familyChannels.get(familyKey)!;
      
      edges.push({
        id: `pc_${pc.id}`,
        type: 'parent-child',
        path: `M ${startX} ${startY} V ${midY} H ${endX} V ${endY}`
      });
    }
  });

  return { nodes, edges, width: maxX - minX, height: maxY - minY };
};
