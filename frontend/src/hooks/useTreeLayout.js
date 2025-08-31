// NOTE: Node dimensions are updated to match the new PersonNode design.
const NODE_WIDTH = 220;
const NODE_HEIGHT = 90; // align with PersonNode height for precise geometry
const H_SPACING = 40; // horizontal gap between units (reduced from 60)
const V_SPACING = 120; // vertical gap between generations (reduced from 180)
const COUPLE_SPACING = 80; // gap between spouses in a couple unit

// Helper function to calculate spacing between clusters based on family relationships
const calculateClusterSpacing = (clusterA, clusterB, allUnits, allPersons, userId) => {
  // Check if clusters have related family members
  const aConnections = getFamilyConnections(clusterA.units[0], allUnits, allPersons);
  const bConnections = getFamilyConnections(clusterB.units[0], allUnits, allPersons);

  // If clusters share family connections, reduce spacing
  const sharedConnections = new Set([...aConnections].filter(x => bConnections.has(x)));
  if (sharedConnections.size > 0) {
    return H_SPACING * 0.5; // Less spacing for related clusters
  }

  // If one cluster is much closer to user than the other, add more spacing
  const aAvgDepth = clusterA.units.reduce((sum, u) => sum + (u.depth || 0), 0) / clusterA.units.length;
  const bAvgDepth = clusterB.units.reduce((sum, u) => sum + (u.depth || 0), 0) / clusterB.units.length;
  const userDepth = allUnits.find(u => u.memberIds.includes(userId))?.depth || 0;

  const aDistance = Math.abs(aAvgDepth - userDepth);
  const bDistance = Math.abs(bAvgDepth - userDepth);

  if (Math.abs(aDistance - bDistance) > 1) {
    return H_SPACING * 1.5; // More spacing between distant generations
  }

  return H_SPACING; // Normal spacing
};
// Helper function to get family connections for a unit
const getFamilyConnections = (unit, allUnits, allPersons) => {
  const connections = new Set();

  // Add direct parent connections
  unit.parentUnitIds.forEach(parentId => {
    const parent = allUnits.find(u => u.id === parentId);
    if (parent) {
      parent.memberIds.forEach(memberId => connections.add(memberId));
    }
  });

  // Add direct child connections
  unit.childUnitIds.forEach(childId => {
    const child = allUnits.find(u => u.id === childId);
    if (child) {
      child.memberIds.forEach(memberId => connections.add(memberId));
    }
  });

  // Add sibling connections (units with same parents)
  allUnits.forEach(otherUnit => {
    if (otherUnit.id !== unit.id &&
        otherUnit.parentUnitIds.size === unit.parentUnitIds.size &&
        [...otherUnit.parentUnitIds].every(id => unit.parentUnitIds.has(id))) {
      otherUnit.memberIds.forEach(memberId => connections.add(memberId));
    }
  });

  return connections;
};

// Helper function to calculate connection score to user
const calculateConnectionScore = (connections, userId, allPersons) => {
  let score = 0;

  // Direct connection to user
  if (connections.has(userId)) {
    score += 100;
  }

  // Connection through user's parents
  const userPerson = allPersons.find(p => p.id === userId);
  const userParents = userPerson?.parents || [];
  userParents.forEach(parentId => {
    if (connections.has(parentId)) {
      score += 50;
    }
  });

  // Connection through user's children
  const userChildren = allPersons.filter(p => p.parents?.includes(userId)).map(p => p.id);
  userChildren.forEach(childId => {
    if (connections.has(childId)) {
      score += 30;
    }
  });

  // General family connections
  score += connections.size * 2;

  return score;
};

export const calculateTreeLayout = (allPersons, userPerson, couples = []) => {
  if (!userPerson || !allPersons?.length) return empty();

  // Build lookups
  const personMap = new Map(allPersons.map((p) => [p.id, p]));

  // Step 1 & 2: Build and link family units (No changes)
  const units = [];
  const personToUnit = new Map();
  const processed = new Set();
  const makeUnit = (id, type, memberIds) => {
    const members = memberIds.map((mid) => personMap.get(mid)).filter(Boolean);
    if (!members.length) return null;
    const u = { id, type, members, memberIds: members.map((m) => m.id), parentUnitIds: new Set(), childUnitIds: new Set(), depth: undefined };
    units.push(u);
    members.forEach((m) => { personToUnit.set(m.id, u); processed.add(m.id); });
    return u;
  };
  for (const c of couples) { if (personMap.has(c.husbandId) && personMap.has(c.wifeId)) makeUnit(`couple_${c.id}`, 'couple', [c.husbandId, c.wifeId]); }
  for (const p of allPersons) { if (!p.spouse || !personMap.has(p.spouse) || (personToUnit.has(p.id) && personToUnit.has(p.spouse))) continue; const pair = [p.id, p.spouse].sort(); const sid = `synthetic_${pair.join('_')}`; if (!units.some(u => u.id === sid)) makeUnit(sid, 'couple', pair); }
  for (const p of allPersons) { if (!processed.has(p.id)) makeUnit(`single_${p.id}`, 'single', [p.id]); }
  for (const person of allPersons) {
    const childUnit = personToUnit.get(person.id);
    (person.parents || []).forEach((pid) => { const parentUnit = personToUnit.get(pid); if (parentUnit && childUnit && parentUnit !== childUnit) { parentUnit.childUnitIds.add(childUnit.id); childUnit.parentUnitIds.add(parentUnit.id); } });
    (person.children || []).forEach((cid) => { const cUnit = personToUnit.get(cid); if (cUnit && childUnit && cUnit !== childUnit) { childUnit.childUnitIds.add(cUnit.id); cUnit.parentUnitIds.add(childUnit.id); } });
  }

  // Step 3: Assign depths centered on the user (No changes)
  const userUnit = personToUnit.get(userPerson.id);
  if (!userUnit) return empty();
  userUnit.depth = 0;
  const bfs = [userUnit];
  while (bfs.length) {
    const u = bfs.shift(); const d = u.depth || 0;
    u.parentUnitIds.forEach((pid) => { const pu = units.find((x) => x.id === pid); if (pu && pu.depth === undefined) { pu.depth = d - 1; bfs.push(pu); } });
    u.childUnitIds.forEach((cid) => { const cu = units.find((x) => x.id === cid); if (cu && cu.depth === undefined) { cu.depth = d + 1; bfs.push(cu); } });
  }
  const connected = units.filter((u) => u.depth !== undefined);
  if (!connected.length) return empty();

  // Step 4: Position units with sibling clustering to prevent overlap and reduce edge crossings
  const unitWidth = (u) => u.type === 'couple' ? NODE_WIDTH * 2 + COUPLE_SPACING : NODE_WIDTH;
  const positions = new Map();
  const depths = [...new Set(connected.map((u) => u.depth))].sort((a, b) => a - b);


  depths.forEach((depth) => {
    const levelUnits = connected.filter(u => u.depth === depth);

    // Build clusters: siblings (same parent set) stay together, but separate different family branches
    const clusterMap = new Map();
    for (const u of levelUnits) {
      const parentIds = [...u.parentUnitIds];
      let key;

      if (parentIds.length === 0) {
        // Root level units (like grandparents) - cluster by their own relationships
        key = `__root_${u.id}`;
      } else if (parentIds.length === 1) {
        // Single parent - use that parent's ID
        key = parentIds[0];
      } else {
        // Multiple parents (shouldn't happen in family trees, but handle it)
        key = parentIds.sort().join('|');
      }

      if (!clusterMap.has(key)) clusterMap.set(key, []);
      clusterMap.get(key).push(u);
    }

    const clusters = [];
    clusterMap.forEach((unitsArr, key) => {
      // Anchor for cluster: average of parent centers if parents exist; else undefined
      let anchor;
      const first = unitsArr[0];
      if (first.parentUnitIds.size) {
        const centers = [...first.parentUnitIds].map(pid => {
          const pu = connected.find(x => x.id === pid);
          const pPos = positions.get(pid);
          return (pu && pPos) ? pPos.x + unitWidth(pu)/2 : undefined;
        }).filter(v => v != null);
        if (centers.length) anchor = centers.reduce((a,c)=>a+c,0)/centers.length;
      }
      clusters.push({ key, units: unitsArr, anchor });
    });

    // Sort clusters by family relationships and position
    clusters.sort((a,b) => {
      // First: clusters with anchors (positioned relative to parents)
      if (a.anchor != null && b.anchor != null) {
        return a.anchor - b.anchor;
      }
      if (a.anchor != null) return -1;
      if (b.anchor != null) return 1;

      // Second: sort by family relationship strength
      const aConnections = getFamilyConnections(a.units[0], connected, allPersons);
      const bConnections = getFamilyConnections(b.units[0], connected, allPersons);
      const aScore = calculateConnectionScore(aConnections, userPerson.id, allPersons);
      const bScore = calculateConnectionScore(bConnections, userPerson.id, allPersons);

      if (aScore !== bScore) {
        return bScore - aScore;
      }

      // Third: sort by depth (closer generations first)
      const aAvgDepth = a.units.reduce((sum, u) => sum + (u.depth || 0), 0) / a.units.length;
      const bAvgDepth = b.units.reduce((sum, u) => sum + (u.depth || 0), 0) / b.units.length;

      if (aAvgDepth !== bAvgDepth) {
        return Math.abs(aAvgDepth - userUnit.depth) - Math.abs(bAvgDepth - userUnit.depth);
      }

      // Finally: sort by key for consistency
      return a.key.localeCompare(b.key);
    });

    // Within each cluster, sort units by relationship type and family connections
    clusters.forEach(cl => {
      cl.units.sort((a,b) => {
        // First priority: couples before singles
        if (a.type !== b.type) {
          if (a.type === 'couple') return -1;
          if (b.type === 'couple') return 1;
        }

        // Second priority: sort by family relationships
        // Check if units share common ancestors or descendants
        const aConnections = getFamilyConnections(a, connected, allPersons);
        const bConnections = getFamilyConnections(b, connected, allPersons);

        // Prefer units that are more connected to the main family line
        const aScore = calculateConnectionScore(aConnections, userPerson.id, allPersons);
        const bScore = calculateConnectionScore(bConnections, userPerson.id, allPersons);

        if (aScore !== bScore) {
          return bScore - aScore; // Higher score first
        }

        // Third priority: sort by position relative to user
        const aDepth = Math.abs(a.depth - userUnit.depth);
        const bDepth = Math.abs(b.depth - userUnit.depth);

        if (aDepth !== bDepth) {
          return aDepth - bDepth; // Closer to user first
        }

        // Finally: sort by id for consistency
        return a.id.localeCompare(b.id);
      });
    });

    let cursorX = 0;
    clusters.forEach((cl, clusterIndex) => {
      const widths = cl.units.map(u => unitWidth(u));
      const clusterWidth = widths.reduce((a,c)=>a+c,0) + H_SPACING * (cl.units.length - 1);
      let startX;
      if (cl.anchor != null) {
        startX = cl.anchor - clusterWidth/2;
      } else {
        startX = cursorX;
      }

      // Prevent overlap with previous cluster and add smart spacing
      const prevCluster = clusterIndex > 0 ? clusters[clusterIndex - 1] : null;
      const extraSpacing = prevCluster ? calculateClusterSpacing(cl, prevCluster, connected, allPersons, userPerson.id) : 0;

      if (startX < cursorX + extraSpacing) startX = cursorX + extraSpacing;

      // Place units
      let xPos = startX;
      cl.units.forEach((u,i) => {
        positions.set(u.id, { x: xPos, y: depth * (NODE_HEIGHT + V_SPACING) });
        xPos += widths[i] + H_SPACING;
      });

      cursorX = startX + clusterWidth + H_SPACING + extraSpacing;
    });
  });

  // Step 5: Expand units into person nodes (No changes)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const nodes = [];
  // Helper to compute average horizontal center of a person's parents (if available)
  const computeParentAnchor = (person) => {
    if (!person.parents || !person.parents.length) return undefined;
    const centers = person.parents.map(pid => {
      const pu = personToUnit.get(pid);
      if (!pu) return undefined;
      const pPos = positions.get(pu.id);
      if (!pPos) return undefined;
      const width = pu.type === 'couple' ? (NODE_WIDTH * 2 + COUPLE_SPACING) : NODE_WIDTH;
      return pPos.x + width / 2;
    }).filter(v => v != null);
    if (!centers.length) return undefined;
    return centers.reduce((a,c)=>a+c,0)/centers.length;
  };

  for (const u of connected) {
    const pos = positions.get(u.id); if (!pos) continue;
    let ordered = u.members;
    if (u.type === 'couple' && u.members.length === 2) {
      const [A, B] = u.members;
      const anchorA = computeParentAnchor(A);
      const anchorB = computeParentAnchor(B);
      const leftCenter = pos.x + NODE_WIDTH / 2;
      const rightCenter = pos.x + NODE_WIDTH + COUPLE_SPACING + NODE_WIDTH / 2;
      if (anchorA != null || anchorB != null) {
        // Evaluate both assignments
        const costAB = (anchorA!=null?Math.abs(anchorA-leftCenter):0) + (anchorB!=null?Math.abs(anchorB-rightCenter):0);
        const costBA = (anchorA!=null?Math.abs(anchorA-rightCenter):0) + (anchorB!=null?Math.abs(anchorB-leftCenter):0);
        if (costBA < costAB) ordered = [B, A]; else ordered = [A, B];
      } else {
        // fallback gender-based (original)
        ordered = [...u.members].sort((a,b)=> { if (a.gender !== b.gender) { if (a.gender === 'Male') return -1; if (b.gender === 'Male') return 1; } return a.id.localeCompare(b.id); });
      }
    } else if (u.type === 'couple') {
      ordered = [...u.members].sort((a,b)=> { if (a.gender !== b.gender) { if (a.gender === 'Male') return -1; if (b.gender === 'Male') return 1; } return a.id.localeCompare(b.id); });
    }
    for (let i = 0; i < ordered.length; i++) {
      const p = ordered[i];
      const x = pos.x + (u.type === 'couple' ? i * (NODE_WIDTH + COUPLE_SPACING) : 0);
      const y = pos.y;
      nodes.push({ id: p.id, x, y, person: p, relationship: p.relationship });
      if (x < minX) minX = x;
      if (x + NODE_WIDTH > maxX) maxX = x + NODE_WIDTH;
      if (y < minY) minY = y;
      if (y + NODE_HEIGHT > maxY) maxY = y + NODE_HEIGHT;
    }
  }

  // --- Step 6: Build edges with improved curved routing ---
  const edges = [];

  // Precompute couple children from docs (for real couples); fallback to member children
  const coupleChildrenMap = new Map(); // key: sorted(husbandId,wifeId)
  couples.forEach(c => {
    coupleChildrenMap.set([c.husbandId, c.wifeId].sort().join('|'), new Set(c.childrenIds || []));
  });

  const nodeByPersonId = new Map(nodes.map(n => [n.id, n]));
  const unitChildEdgeSeen = new Set();

  connected.forEach(unit => {
    // Marriage line + heart icon
    if (unit.type === 'couple') {
      const spouseNodes = nodes.filter(n => unit.memberIds.includes(n.id)).sort((a,b)=>a.x-b.x);
      if (spouseNodes.length === 2) {
        const [left,right] = spouseNodes;
        const yMid = left.y + NODE_HEIGHT/2;
        edges.push({ id:`marriage_${unit.id}`, type:'marriage', x1:left.x+NODE_WIDTH, y1:yMid, x2:right.x, y2:yMid });
      }
    }

    // Determine children set for this unit
    const children = new Set();
    if (unit.type === 'couple') {
      const key = [...unit.memberIds].sort().join('|');
      const docKids = coupleChildrenMap.get(key);
      if (docKids && docKids.size) {
        docKids.forEach(id => children.add(id));
      } else {
        unit.members.forEach(m => (m.children || []).forEach(cId => children.add(cId)));
      }
    } else { // single
      unit.members.forEach(m => (m.children || []).forEach(cId => children.add(cId)));
    }
    if (!children.size) return;

    const pos = positions.get(unit.id);
    if (!pos) return;

    let startX, startY;
    if (unit.type === 'couple') {
      // Heart (marriage midpoint) coordinates
      startX = pos.x + NODE_WIDTH + COUPLE_SPACING/2;
      startY = pos.y + NODE_HEIGHT/2; // heart vertical center
    } else {
      // Single parent bottom center
      startX = pos.x + NODE_WIDTH/2;
      startY = pos.y + NODE_HEIGHT;
    }

    children.forEach(childId => {
      const childNode = nodeByPersonId.get(childId);
      if (!childNode) return;
      const key = unit.id + '|' + childId;
      if (unitChildEdgeSeen.has(key)) return;
      unitChildEdgeSeen.add(key);
      const cTopX = childNode.x + NODE_WIDTH/2;
      const cTopY = childNode.y;
      const midY = (startY + cTopY) / 2;
      const path = `M ${startX} ${startY} V ${midY} H ${cTopX} V ${cTopY}`;
      edges.push({ id:`pc_${unit.id}_${childId}`, type:'parent-child', path });
    });
  });

  // Step 7: Normalize coordinates (No changes)
  if (!isFinite(minX)) return empty();
  const padX = H_SPACING * 2;
  const padY = V_SPACING;
  const shiftX = -minX + padX;
  const shiftY = -minY + padY;
  nodes.forEach((n) => { n.x += shiftX; n.y += shiftY; });
  edges.forEach((e) => {
    if (e.type === 'marriage') { e.x1 += shiftX; e.x2 += shiftX; e.y1 += shiftY; e.y2 += shiftY; }
    else if (e.path) {
      e.path = e.path.replace(/([MVH])\s+(-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?))?/g, (match, cmd, a, b) => {
          if (cmd === 'M') return `M ${parseFloat(a) + shiftX} ${parseFloat(b) + shiftY}`;
          if (cmd === 'H') return `H ${parseFloat(a) + shiftX}`;
          if (cmd === 'V') return `V ${parseFloat(a) + shiftY}`;
          return match;
        }
      );
    }
  });

  return { nodes, edges, width: maxX - minX + padX * 2, height: maxY - minY + padY * 2 };
};

function empty() {
  return { nodes: [], edges: [], width: 0, height: 0 };
}