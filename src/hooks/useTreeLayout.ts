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
  
// 1. Assign Depths and Islands (Family Clusters)
  const depths = new Map<string, number>();
  const islands = new Map<string, number>();
  const visited = new Set<string>();
  
  // queue stores: { id, depth, island }
  const queue: { id: string; depth: number; island: number }[] = [{ id: userPerson.id, depth: 0, island: 0 }];
  visited.add(userPerson.id);

  while (queue.length > 0) {
    const { id, depth, island } = queue.shift()!;
    depths.set(id, depth);
    islands.set(id, island);

    // Blood relatives (Parents and Children) share the exact same Island
    const parents = parentChild
      .filter(pc => pc.child_id === id && personMap.has(pc.parent_id))
      .map(pc => pc.parent_id);

    const children = parentChild
      .filter(pc => pc.parent_id === id && personMap.has(pc.child_id))
      .map(pc => pc.child_id);

    const bloodRelatives = [...parents, ...children];
    
    bloodRelatives.forEach(relId => {
      if (!visited.has(relId)) {
        visited.add(relId);
        // Parents go up a level (-1), children go down a level (+1)
        const isParent = parents.includes(relId);
        queue.push({ id: relId, depth: depth + (isParent ? -1 : 1), island });
      }
    });

    // Spouses get a different Island number so they cluster completely separately
    const spouses = marriages
      .filter(m => (m.person1_id === id || m.person2_id === id))
      .map(m => m.person1_id === id ? m.person2_id : m.person1_id)
      .filter(sId => personMap.has(sId));
    
    spouses.forEach(sId => {
      if (!visited.has(sId)) {
        visited.add(sId);
        queue.push({ id: sId, depth, island: island + 1 });
      }
    });
  }

// 2. Horizontal Grouping
  const groupsByDepth = new Map<number, string[][]>();
  const allDepths = Array.from(new Set(depths.values())).sort((a, b) => a - b);

  allDepths.forEach(depth => {
    const levelIds = Array.from(depths.entries())
      .filter(([, d]) => d === depth)
      .map(([id]) => id);
    
    const groups: string[][] = [];
    const levelVisited = new Set<string>();

    levelIds.forEach(id => {
      if (levelVisited.has(id)) return;
      
      const spouses = marriages
        .filter(m => m.person1_id === id || m.person2_id === id)
        .map(m => m.person1_id === id ? m.person2_id : m.person1_id)
        .filter(sId => depths.get(sId) === depth);

      if (spouses.length > 0) {
        let spouseGroup: string[] = [];
        
        if (spouses.length === 1) {
          spouseGroup = [id, spouses[0]];
          // Keep user on the right of their spouse
          if (spouseGroup[0] === userPerson.id) spouseGroup.reverse();
        } else if (spouses.length === 2) {
          // Force shared spouses into the middle
          spouseGroup = [spouses[0], id, spouses[1]];
        } else {
          spouseGroup = [id, ...spouses];
        }

        groups.push(spouseGroup);
        spouseGroup.forEach(gId => levelVisited.add(gId));
      } else {
        groups.push([id]);
        levelVisited.add(id);
      }
    });

    groupsByDepth.set(depth, groups);
  });

// 3. Position Calculation (Top-Down First Pass)
  const nodePositions = new Map<string, { x: number; y: number }>();
  let minX = 0, maxX = 0, minY = 0, maxY = 0;

  const sortedDepths = [...allDepths].sort((a, b) => a - b);

  sortedDepths.forEach(depth => {
    const groups = groupsByDepth.get(depth) || [];
    const y = depth * (NODE_HEIGHT + V_SPACING);

    const groupTargets = groups.map(group => {
      const island = Math.min(...group.map(id => islands.get(id) || 0));
      
      const parentPos = parentChild
        .filter(pc => group.includes(pc.child_id))
        .map(pc => nodePositions.get(pc.parent_id))
        .filter(pos => pos !== undefined);

      let targetX = 0;
      if (parentPos.length > 0) {
        targetX = parentPos.reduce((sum, pos) => sum + pos!.x, 0) / parentPos.length;
      }
      
      // NEW: Check if this group has children to identify the active bloodline
      const hasChildren = parentChild.some(pc => group.includes(pc.parent_id));
      
      return { group, targetX, hasParents: parentPos.length > 0, hasChildren, island };
    });

    groupTargets.sort((a, b) => {
      // Primary Sort: In-laws to the left, Main family to the right
      if (a.island !== b.island) return b.island - a.island; 
      
      // Secondary Sort: Align perfectly underneath parents
      if (a.hasParents && b.hasParents) {
        // If they have different parents, sort by parent location
        if (a.targetX !== b.targetX) return a.targetX - b.targetX;
      } else if (a.hasParents && !b.hasParents) {
        return -1;
      } else if (!a.hasParents && b.hasParents) {
        return 1;
      }

      // Tertiary Sort (Tie-Breaker): Center of Gravity
      // Push groups with children toward the middle of the canvas
      const aLineage = a.hasChildren ? 1 : 0;
      const bLineage = b.hasChildren ? 1 : 0;

      if (aLineage !== bLineage) {
        if (a.island > 0) {
          // Left Island (In-laws): Push active lineage to the right (+ return)
          return aLineage - bLineage;
        } else {
          // Right Island (Main): Push active lineage to the left (- return)
          return bLineage - aLineage;
        }
      }

      return 0; // Final fallback
    });

    let currentX = Number.NEGATIVE_INFINITY;

    groupTargets.forEach(({ group, targetX }) => {
      const groupWidth = (group.length * NODE_WIDTH) + ((group.length - 1) * H_SPACING);
      const groupStartX = Math.max(currentX, targetX - (groupWidth / 2));

      group.forEach((id, index) => {
        const x = groupStartX + index * (NODE_WIDTH + H_SPACING);
        nodePositions.set(id, { x, y });
        
        maxX = Math.max(maxX, x + NODE_WIDTH);
        maxY = Math.max(maxY, y + NODE_HEIGHT);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
      });

      currentX = groupStartX + groupWidth + H_SPACING;
    });
  });

  // 3.5. Bottom-Up Re-centering (Second Pass)
  // Pull parents to center directly over their children's final positions
  const bottomUpDepths = [...allDepths].sort((a, b) => b - a);

  bottomUpDepths.forEach(depth => {
    const groups = groupsByDepth.get(depth) || [];
    let currentX = Number.NEGATIVE_INFINITY;

    // Sort groups left-to-right based on their current Top-Down positions
    const orderedGroups = groups.map(group => {
      const firstNode = nodePositions.get(group[0])!;
      return { group, currentStartX: firstNode.x };
    }).sort((a, b) => a.currentStartX - b.currentStartX);

    orderedGroups.forEach(({ group, currentStartX }) => {
      const groupWidth = (group.length * NODE_WIDTH) + ((group.length - 1) * H_SPACING);

      // Find the children connected to this specific parent group
      const childrenPos = parentChild
        .filter(pc => group.includes(pc.parent_id))
        .map(pc => nodePositions.get(pc.child_id))
        .filter(pos => pos !== undefined);

      let newStartX = currentStartX;

      // If they have children, calculate the perfect center point above them
      if (childrenPos.length > 0) {
        const targetX = childrenPos.reduce((sum, pos) => sum + pos!.x, 0) / childrenPos.length;
        newStartX = targetX - (groupWidth / 2);
      }

      // Prevent overlapping if a parent group shifts into another parent group
      newStartX = Math.max(currentX, newStartX);

      // Apply the new centered X coordinates
      group.forEach((id, index) => {
        const x = newStartX + index * (NODE_WIDTH + H_SPACING);
        const pos = nodePositions.get(id)!;
        pos.x = x;

        maxX = Math.max(maxX, x + NODE_WIDTH);
        minX = Math.min(minX, x);
      });

      currentX = newStartX + groupWidth + H_SPACING;
    });
  });

  // 3.8. Normalization Pass (Shift away from negative numbers)
  const shiftX = minX < 0 ? Math.abs(minX) + 50 : 50; 
  
  nodePositions.forEach(pos => {
    pos.x += shiftX;
  });
  
  maxX += shiftX;
  minX = 0;

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

  // 5. Build Edges (Lines and Connections)
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

  const rowOffsets = new Map<number, number>();
  const familyMidY = new Map<string, number>();

  parentChild.forEach(pc => {
    const pPos = nodePositions.get(pc.parent_id);
    const cPos = nodePositions.get(pc.child_id);
    
    if (!pPos || !cPos) return;

    const marriage = marriages.find(m => 
      (m.person1_id === pc.parent_id || m.person2_id === pc.parent_id) &&
      parentChild.some(pc2 => pc2.child_id === pc.child_id && (pc2.parent_id === m.person1_id || pc2.parent_id === m.person2_id) && pc2.parent_id !== pc.parent_id)
    );

    let startX = pPos.x + NODE_WIDTH / 2;
    let startY = pPos.y + NODE_HEIGHT;
    let familyId = `single_${pc.parent_id}`;

    if (marriage) {
      const sp1 = nodePositions.get(marriage.person1_id)!;
      const sp2 = nodePositions.get(marriage.person2_id)!;
      startX = (sp1.x + sp2.x) / 2 + NODE_WIDTH / 2;
      startY = sp1.y + NODE_HEIGHT / 2;
      
      const spouses = [marriage.person1_id, marriage.person2_id].sort();
      familyId = `marriage_${spouses[0]}_${spouses[1]}`;
    }

    const endX = cPos.x + NODE_WIDTH / 2;
    const endY = cPos.y;
    const baseMidY = (startY + endY) / 2;

    if (!familyMidY.has(familyId)) {
      const currentOffset = rowOffsets.get(baseMidY) || 0;
      familyMidY.set(familyId, baseMidY + currentOffset);
      rowOffsets.set(baseMidY, currentOffset + 30);
    }

    const midY = familyMidY.get(familyId)!;
    const edgeId = marriage ? `pc_m_${marriage.id}_${pc.child_id}` : `pc_s_${pc.parent_id}_${pc.child_id}`;
    
    if (!edges.some(e => e.id === edgeId)) {
      if (marriage) {
        edges.push({
          id: `junction_${edgeId}`,
          type: 'junction-ball',
          x1: startX,
          y1: startY
        });
      }
      edges.push({
        id: edgeId,
        type: 'parent-child',
        path: `M ${startX} ${startY} V ${midY} H ${endX} V ${endY}`
      });
    }
  });

  return { nodes, edges, width: maxX - minX, height: maxY - minY };
};