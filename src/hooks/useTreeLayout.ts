import { Person, Marriage, ParentChild } from '@/types/database';
import { getRelationshipToUser } from '@/utils/relationships';

// 1. INCREASED SPACING FOR THE SUPER-HIGHWAY
const NODE_WIDTH = 240;
const NODE_HEIGHT = 100;
const H_SPACING = 180; // Increased for more horizontal breathing room
const V_SPACING = 280; // Massively increased to prevent lines from ever crashing into nodes

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
  parentChild: ParentChild[] = [],
  verticalSpacing = V_SPACING
): TreeLayout => {
  if (!userPerson || !allPersons?.length) return { nodes: [], edges: [], width: 0, height: 0 };

  const personMap = new Map(allPersons.map((p) => [p.id, p]));
  
  // Step 0: Identify the Main Trunk (Direct Ancestors)
  const directAncestors = new Set<string>();
  const userSpouses = marriages
    .filter(m => m.person1_id === userPerson.id || m.person2_id === userPerson.id)
    .map(m => m.person1_id === userPerson.id ? m.person2_id : m.person1_id);
    
  let currentTrunkIds = [userPerson.id, ...userSpouses];
  
  while (currentTrunkIds.length > 0) {
    const nextIds: string[] = [];
    currentTrunkIds.forEach(id => {
      if (!directAncestors.has(id)) {
        directAncestors.add(id);
        const parents = parentChild
          .filter(pc => pc.child_id === id)
          .map(pc => pc.parent_id);
        nextIds.push(...parents);
      }
    });
    currentTrunkIds = nextIds;
  }

  // Step 1: Binary Side Partitioning (Left vs Right)
  const familySide = new Map<string, number>();
  familySide.set(userPerson.id, 1); 
  userSpouses.forEach(id => familySide.set(id, -1)); 

  const queueSide = [userPerson.id, ...userSpouses];
  const visitedSide = new Set(queueSide);

  while (queueSide.length > 0) {
    const id = queueSide.shift()!;
    const side = familySide.get(id)!;

    const parents = parentChild.filter(pc => pc.child_id === id).map(pc => pc.parent_id);
    const children = parentChild.filter(pc => pc.parent_id === id).map(pc => pc.child_id);
    const spouses = marriages.filter(m => m.person1_id === id || m.person2_id === id)
      .map(m => m.person1_id === id ? m.person2_id : m.person1_id);

    const relatives = [...parents, ...children, ...spouses];

    relatives.forEach(relId => {
      if ((id === userPerson.id && userSpouses.includes(relId)) ||
          (userSpouses.includes(id) && relId === userPerson.id)) {
        return;
      }

      if (!visitedSide.has(relId)) {
        visitedSide.add(relId);
        familySide.set(relId, side);
        queueSide.push(relId);
      }
    });
  }

  // Step 2: Assign Vertical Depths
  const depths = new Map<string, number>();
  const visitedDepth = new Set<string>();
  const queueDepth: { id: string; depth: number }[] = [{ id: userPerson.id, depth: 0 }];
  visitedDepth.add(userPerson.id);

  while (queueDepth.length > 0) {
    const { id, depth } = queueDepth.shift()!;
    depths.set(id, depth);

    const parents = parentChild
      .filter(pc => pc.child_id === id && personMap.has(pc.parent_id))
      .map(pc => pc.parent_id);

    const children = parentChild
      .filter(pc => pc.parent_id === id && personMap.has(pc.child_id))
      .map(pc => pc.child_id);
    
    [...parents, ...children].forEach(relId => {
      if (!visitedDepth.has(relId)) {
        visitedDepth.add(relId);
        queueDepth.push({ id: relId, depth: depth + (parents.includes(relId) ? -1 : 1) });
      }
    });

    const spouses = marriages
      .filter(m => (m.person1_id === id || m.person2_id === id))
      .map(m => m.person1_id === id ? m.person2_id : m.person1_id)
      .filter(sId => personMap.has(sId));
    
    spouses.forEach(sId => {
      if (!visitedDepth.has(sId)) {
        visitedDepth.add(sId);
        queueDepth.push({ id: sId, depth });
      }
    });
  }

  // Step 3: Horizontal Grouping
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
          if (spouseGroup[0] === userPerson.id) spouseGroup.reverse();
        } else if (spouses.length === 2) {
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

// Step 4: Top-Down Position Calculation
  const nodePositions = new Map<string, { x: number; y: number }>();
  let minX = 0, maxX = 0, minY = 0, maxY = 0;

  const sortedDepths = [...allDepths].sort((a, b) => a - b);

  sortedDepths.forEach(depth => {
    const groups = groupsByDepth.get(depth) || [];
    const y = depth * (NODE_HEIGHT + verticalSpacing);

    const groupTargets = groups.map(group => {
      let side = 0;
      for (const id of group) {
        if (familySide.has(id)) {
          side = familySide.get(id)!;
          if (side !== 0) break;
        }
      }
      
      const parentPos = parentChild
        .filter(pc => group.includes(pc.child_id))
        .map(pc => nodePositions.get(pc.parent_id))
        .filter(pos => pos !== undefined);

      let targetX = 0;
      if (parentPos.length > 0) {
        targetX = parentPos.reduce((sum, pos) => sum + pos!.x, 0) / parentPos.length;
      }
      
      const hasChildren = parentChild.some(pc => group.includes(pc.parent_id));
      const isMarried = group.length > 1;
      const isBranch = hasChildren || isMarried;
      
      return { group, targetX, hasParents: parentPos.length > 0, isBranch, side };
    });

    groupTargets.sort((a, b) => {
      // RULE 1: Strict Lineage Alignment
      if (a.hasParents && b.hasParents) {
        if (Math.abs(a.targetX - b.targetX) > 5) {
          return a.targetX - b.targetX;
        }
      }
      
      // RULE 2: Families with targets go first
      if (a.hasParents && !b.hasParents) return -1;
      if (!a.hasParents && b.hasParents) return 1;

      // RULE 3: Binary Side Partitioning
      if (a.side !== b.side) {
        return a.side - b.side; 
      }

      // RULE 4: Main Trunk Gravity (Center priority)
      const aIsDirect = a.group.some(id => directAncestors.has(id)) ? 1 : 0;
      const bIsDirect = b.group.some(id => directAncestors.has(id)) ? 1 : 0;
      
      if (aIsDirect !== bIsDirect) {
        return a.side < 0 ? (aIsDirect - bIsDirect) : (bIsDirect - aIsDirect);
      }

      // RULE 5: Centrifugal Island Force (NEW)
      // Push siblings with spouses/children to the OUTSIDE edges so their lines drop safely
      const aBranch = a.isBranch ? 1 : 0;
      const bBranch = b.isBranch ? 1 : 0;
      
      if (aBranch !== bBranch) {
        // Left side pushes outward to the Left. Right side pushes outward to the Right.
        return a.side < 0 ? (bBranch - aBranch) : (aBranch - bBranch);
      }

      return 0;
    });

    let currentX = Number.NEGATIVE_INFINITY;

    groupTargets.forEach(({ group, targetX, isBranch }) => {
      // NEW: Add a "Moat" of empty space around families to create the Island effect
      const islandPadding = isBranch ? H_SPACING * 1.5 : 0;
      
      const groupWidth = (group.length * NODE_WIDTH) + ((group.length - 1) * H_SPACING);
      const groupStartX = Math.max(currentX + islandPadding, targetX - (groupWidth / 2));

      group.forEach((id, index) => {
        const x = groupStartX + index * (NODE_WIDTH + H_SPACING);
        nodePositions.set(id, { x, y });
        
        maxX = Math.max(maxX, x + NODE_WIDTH);
        maxY = Math.max(maxY, y + NODE_HEIGHT);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
      });

      // Apply padding to the trailing edge as well
      currentX = groupStartX + groupWidth + H_SPACING + islandPadding;
    });
  });

  // Step 5: Bottom-Up Re-centering
  const bottomUpDepths = [...allDepths].sort((a, b) => b - a);

  bottomUpDepths.forEach(depth => {
    const groups = groupsByDepth.get(depth) || [];
    let currentX = Number.NEGATIVE_INFINITY;

    const orderedGroups = groups.map(group => {
      const firstNode = nodePositions.get(group[0])!;
      return { group, currentStartX: firstNode.x };
    }).sort((a, b) => a.currentStartX - b.currentStartX);

    orderedGroups.forEach(({ group, currentStartX }) => {
      const groupWidth = (group.length * NODE_WIDTH) + ((group.length - 1) * H_SPACING);
      
      // Determine if this group is an Island so we can respect its padding moving bottom-up
      const isBranch = group.length > 1 || parentChild.some(pc => group.includes(pc.parent_id));
      const islandPadding = isBranch ? H_SPACING * 1.5 : 0;

      const childrenPos = parentChild
        .filter(pc => group.includes(pc.parent_id))
        .map(pc => nodePositions.get(pc.child_id))
        .filter(pos => pos !== undefined);

      let newStartX = currentStartX;

      if (childrenPos.length > 0) {
        const targetX = childrenPos.reduce((sum, pos) => sum + pos!.x, 0) / childrenPos.length;
        newStartX = targetX - (groupWidth / 2);
      }

      // Respect the padding of the previous group so Islands don't collapse inward
      newStartX = Math.max(currentX + islandPadding, newStartX);

      group.forEach((id, index) => {
        const x = newStartX + index * (NODE_WIDTH + H_SPACING);
        const pos = nodePositions.get(id)!;
        pos.x = x;

        maxX = Math.max(maxX, x + NODE_WIDTH);
        minX = Math.min(minX, x);
      });

      currentX = newStartX + groupWidth + H_SPACING + islandPadding;
    });
  });

  // Step 6: Normalization Pass
  const shiftX = minX < 0 ? Math.abs(minX) + 50 : 50; 
  
  nodePositions.forEach(pos => {
    pos.x += shiftX;
  });
  
  maxX += shiftX;
  minX = 0;

  // Step 7: Build Nodes
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

  // Step 8: Build Edges and Junctions (THE LANE FIX)
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
    
    // NEW MATH: Standardize the true midpoint between rows regardless of marriage status.
    const parentRowBottom = pPos.y + NODE_HEIGHT;
    const baseMidY = (parentRowBottom + endY) / 2;

    if (!familyMidY.has(familyId)) {
      const familyCount = rowOffsets.get(baseMidY) || 0;
      
      // Alternate lanes outward symmetrically: 0px, -25px, +25px, -50px, +50px
      const direction = familyCount % 2 === 0 ? -1 : 1;
      const step = Math.ceil(familyCount / 2);
      const offset = step * 25 * direction;
      
      familyMidY.set(familyId, baseMidY + offset);
      rowOffsets.set(baseMidY, familyCount + 1);
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
