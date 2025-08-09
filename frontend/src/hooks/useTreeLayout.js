// NOTE: Node dimensions are updated to match the new PersonNode design.
const NODE_WIDTH = 220;
const NODE_HEIGHT = 90; // align with PersonNode height for precise geometry
const H_SPACING = 48; // horizontal gap between units
const V_SPACING = 150; // vertical gap between generations
const COUPLE_SPACING = 80; // gap between spouses in a couple unit

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

  // Step 4: Position units level-by-level (No changes)
  const unitWidth = (u) => u.type === 'couple' ? NODE_WIDTH * 2 + COUPLE_SPACING : NODE_WIDTH;
  const positions = new Map();
  const depths = [...new Set(connected.map((u) => u.depth))].sort((a, b) => a - b);
  depths.forEach((depth) => {
    const levelUnits = connected.filter((u) => u.depth === depth).sort((a, b) => a.id.localeCompare(b.id));
    let cursorX = 0;
    levelUnits.forEach((u) => {
      let anchors = [];
      if (depth > depths[0]) { anchors = [...u.parentUnitIds].map((pid) => { const pos = positions.get(pid); const pu = connected.find((x) => x.id === pid); return pos ? pos.x + unitWidth(pu) / 2 : null; }).filter((v) => v != null); } 
      else if (depth < depths[depths.length - 1]) { anchors = [...u.childUnitIds].map((cid) => { const pos = positions.get(cid); const cu = connected.find((x) => x.id === cid); return pos ? pos.x + unitWidth(cu) / 2 : null; }).filter((v) => v != null); }
      const w = unitWidth(u);
      let x = anchors.length ? (Math.min(...anchors) + Math.max(...anchors)) / 2 - w / 2 : cursorX;
      const prevPlacedUnits = levelUnits.filter(p => positions.has(p.id));
      if (prevPlacedUnits.length) { const lastUnit = prevPlacedUnits[prevPlacedUnits.length - 1]; const lastPos = positions.get(lastUnit.id); const neededX = lastPos.x + unitWidth(lastUnit) + H_SPACING; if (x < neededX) x = neededX; }
      positions.set(u.id, { x, y: depth * (NODE_HEIGHT + V_SPACING) });
      cursorX = x + w + H_SPACING;
    });
  });

  // Step 5: Expand units into person nodes (No changes)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const nodes = [];
  for (const u of connected) {
    const pos = positions.get(u.id); if (!pos) continue;
    let ordered = u.members;
    if (u.type === 'couple' && u.members.length === 2) {
      const [A, B] = u.members;
      const parentAnchor = (person) => {
        if (!person.parents || !person.parents.length) return undefined;
        const centers = person.parents.map(pid => {
          const pu = personToUnit.get(pid);
            if (!pu) return undefined;
            const pPos = positions.get(pu.id);
            return pPos ? pPos.x + (pu.type === 'couple' ? (NODE_WIDTH * 2 + COUPLE_SPACING) / 2 : NODE_WIDTH / 2) : undefined;
        }).filter(v => v != null);
        if (!centers.length) return undefined;
        return centers.reduce((a,c)=>a+c,0)/centers.length;
      };
      const anchorA = parentAnchor(A);
      const anchorB = parentAnchor(B);
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
    ordered.forEach((p,i)=> {
      const x = pos.x + (u.type === 'couple' ? i * (NODE_WIDTH + COUPLE_SPACING) : 0);
      const y = pos.y;
      nodes.push({ id:p.id, x, y, person:p, relationship:p.relationship });
      minX = Math.min(minX, x); maxX = Math.max(maxX, x + NODE_WIDTH); minY = Math.min(minY, y); maxY = Math.max(maxY, y + NODE_HEIGHT);
    });
  }

  // --- Step 6: Build edges ---
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