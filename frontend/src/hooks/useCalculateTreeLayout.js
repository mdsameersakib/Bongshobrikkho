export default function calculateTreeLayout(allPersons, getRelationshipToUser) {
  if (!Array.isArray(allPersons) || allPersons.length === 0) {
    return { nodes: [], edges: [], marriageLines: [], width: 0, height: 0 };
  }

  const NODE_WIDTH = 170;
  const NODE_HEIGHT = 110;
  const H_SPACING = 40;
  const V_SPACING = 110;
  const PADDING = 120;

  const personMap = new Map(allPersons.map(p => [p.id, p]));

  // Determine generations via BFS from root persons (no known parents)
  const roots = allPersons.filter(
    p => !p.parents || p.parents.length === 0 || p.parents.every(pid => !personMap.has(pid))
  );
  const genOf = new Map();
  const visited = new Set();
  const queue = [];

  if (roots.length === 0 && allPersons.length > 0) roots.push(allPersons[0]);
  roots.forEach(r => {
    genOf.set(r.id, 0);
    visited.add(r.id);
    queue.push(r.id);
  });

  while (queue.length) {
    const pid = queue.shift();
    const g = genOf.get(pid) ?? 0;
    const p = personMap.get(pid);
    (p?.children || []).forEach(cid => {
      if (personMap.has(cid) && !visited.has(cid)) {
        visited.add(cid);
        genOf.set(cid, g + 1);
        queue.push(cid);
      }
    });
  }

  // Group people by generation
  const genGroups = new Map();
  allPersons.forEach(p => {
    const g = genOf.get(p.id);
    if (g === undefined) return;
    if (!genGroups.has(g)) genGroups.set(g, []);
    genGroups.get(g).push(p);
  });

  const gens = [...genGroups.keys()].sort((a, b) => a - b);

  function sortKeepingSpousesTogether(list) {
    const used = new Set();
    const out = [];
    list
      .slice()
      .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''))
      .forEach(p => {
        if (used.has(p.id)) return;
        used.add(p.id);
        out.push(p);
        if (p.spouse && personMap.has(p.spouse)) {
          const s = personMap.get(p.spouse);
          if (!used.has(s.id) && list.find(x => x.id === s.id)) {
            used.add(s.id);
            out.push(s);
          }
        }
      });
    return out;
  }

  // Layout rows
  const nodes = [];
  const edges = []; // parent -> child connectors (step lines)
  const marriageLines = []; // spouse horizontal lines

  let maxRowWidth = 0;
  const totalRowsHeight = gens.length * (NODE_HEIGHT + V_SPACING) - V_SPACING;
  const pointsById = new Map(); // id -> {x,y}

  gens.forEach((g, gi) => {
    const people = sortKeepingSpousesTogether(genGroups.get(g));
    const rowWidth = people.length * NODE_WIDTH + Math.max(people.length - 1, 0) * H_SPACING;
    maxRowWidth = Math.max(maxRowWidth, rowWidth);

    // center row around 0; shift later
    const startX = -rowWidth / 2;
    const y = gi * (NODE_HEIGHT + V_SPACING);

    people.forEach((p, idx) => {
      const x = startX + idx * (NODE_WIDTH + H_SPACING);
      pointsById.set(p.id, { x, y });
      nodes.push({
        id: p.id,
        x,
        y,
        w: NODE_WIDTH,
        h: NODE_HEIGHT,
        person: p,
        relationship: getRelationshipToUser ? getRelationshipToUser(p) : '',
      });
    });
  });

  // Create spouse lines and prepare parent-child edges starting from marriage midpoints
  const emittedMarriage = new Set();
  const marriageMidByKey = new Map(); // 'minId-maxId' -> { xMid, yMid }

  // Spouse lines (same row only)
  nodes.forEach(n => {
    const p = n.person;
    if (p.spouse && pointsById.has(p.spouse)) {
      const key = [String(p.id), String(p.spouse)].sort().join('-');
      if (emittedMarriage.has(key)) return;
      const a = pointsById.get(p.id);
      const b = pointsById.get(p.spouse);
      if (!a || !b) return;
      if (a.y !== b.y) return; // only same generation
      const left = a.x <= b.x ? a : b;
      const right = a.x <= b.x ? b : a;

      marriageLines.push({
        id: `m-${key}`,
        x1: left.x + NODE_WIDTH,
        y1: left.y + NODE_HEIGHT / 2,
        x2: right.x,
        y2: right.y + NODE_HEIGHT / 2,
      });

      const xMid = (left.x + NODE_WIDTH + right.x) / 2;
      const yMid = left.y + NODE_HEIGHT / 2;
      marriageMidByKey.set(key, { xMid, yMid });
      emittedMarriage.add(key);
    }
  });

  // Build parent-child edges
  nodes.forEach(n => {
    const p = n.person;
    const children = p.children || [];
    if (children.length === 0) return;

    // Prefer using the marriage midpoint when spouse exists in same gen
    let origin = null;
    if (p.spouse && pointsById.has(p.spouse)) {
      const a = pointsById.get(p.id);
      const b = pointsById.get(p.spouse);
      if (a && b && a.y === b.y) {
        const key = [String(p.id), String(p.spouse)].sort().join('-');
        const mid = marriageMidByKey.get(key);
        if (mid) origin = { x: mid.xMid, y: mid.yMid };
      }
    }

    children.forEach(cid => {
      const c = pointsById.get(cid);
      if (!c) return;
      if (origin) {
        // From marriage midpoint to child top-center
        edges.push({
          id: `e-${p.id}-${cid}`,
          x1: origin.x,
          y1: origin.y,
          x2: c.x + NODE_WIDTH / 2,
          y2: c.y,
        });
      } else {
        // Single parent: from bottom-center of the node
        edges.push({
          id: `e-${p.id}-${cid}`,
          x1: n.x + NODE_WIDTH / 2,
          y1: n.y + NODE_HEIGHT,
          x2: c.x + NODE_WIDTH / 2,
          y2: c.y,
        });
      }
    });
  });

  // Normalize to positive coords and compute canvas size
  let minX = 0;
  nodes.forEach(n => {
    minX = Math.min(minX, n.x);
  });
  const shiftX = -minX + PADDING / 2;
  const width = Math.max(maxRowWidth + PADDING, 320);
  const height = Math.max(totalRowsHeight + PADDING, 240);

  nodes.forEach(n => (n.x = n.x + shiftX));
  edges.forEach(e => {
    e.x1 += shiftX;
    e.x2 += shiftX;
  });
  marriageLines.forEach(m => {
    m.x1 += shiftX;
    m.x2 += shiftX;
  });

  return { nodes, edges, marriageLines, width, height };
}