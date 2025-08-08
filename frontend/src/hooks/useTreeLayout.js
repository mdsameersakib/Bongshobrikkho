// --- Constants for Tree Layout ---
const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const H_SPACING = 40; // Horizontal spacing between units
const V_SPACING = 80; // Vertical spacing between generations
const COUPLE_SPACING = 10; // spacing between spouses within a unit

// This is now a pure function, not a hook.
export const calculateTreeLayout = (allPersons, userPerson) => {
  if (!userPerson || !allPersons.length) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  const personMap = new Map(allPersons.map((p) => [p.id, p]));

  // --- 1. User-Centric Leveling ---
  const levels = new Map();
  const queue = [{ personId: userPerson.id, level: 0 }];
  const visited = new Set([userPerson.id]);
  levels.set(userPerson.id, 0);

  while (queue.length > 0) {
    const { personId, level } = queue.shift();
    const person = personMap.get(personId);
    if (!person) continue;

    // Go up to parents
    (person.parents || []).forEach((parentId) => {
      if (personMap.has(parentId) && !visited.has(parentId)) {
        visited.add(parentId);
        levels.set(parentId, level - 1);
        queue.push({ personId: parentId, level: level - 1 });
      }
    });

    // Go down to children
    (person.children || []).forEach((childId) => {
      if (personMap.has(childId) && !visited.has(childId)) {
        visited.add(childId);
        levels.set(childId, level + 1);
        queue.push({ personId: childId, level: level + 1 });
      }
    });

    // Go sideways to spouse to ensure they are on the same level
    if (person.spouse && personMap.has(person.spouse) && !visited.has(person.spouse)) {
      const spouseId = person.spouse;
      visited.add(spouseId);
      levels.set(spouseId, level);
      const spouse = personMap.get(spouseId);
      (spouse.parents || []).forEach((parentId) => {
        if (personMap.has(parentId) && !visited.has(parentId)) {
          visited.add(parentId);
          levels.set(parentId, level - 1);
          queue.push({ personId: parentId, level: level - 1 });
        }
      });
    }
  }

    // --- 2. Group by Family Unit ---
    const generationLevels = {};
    for (const person of allPersons) {
      const level = levels.get(person.id);
      if (level === undefined) continue;
      if (!generationLevels[level]) generationLevels[level] = [];
      generationLevels[level].push(person);
    }
    
    const familyUnitsByLevel = {};
    const processedPersons = new Set();

    Object.keys(generationLevels).sort((a,b) => a-b).forEach(level => {
        familyUnitsByLevel[level] = [];
        const personsOnLevel = generationLevels[level];

        for(const person of personsOnLevel){
            if(processedPersons.has(person.id)) continue;

            const spouseId = person.spouse;
            const spouse = spouseId ? personMap.get(spouseId) : null;
            
            if(spouse && levels.get(spouse.id) === parseInt(level)){
                familyUnitsByLevel[level].push({
                    id: [person.id, spouse.id].sort().join('-'),
                    type: 'couple', p1: person, p2: spouse,
                    children: [...new Set([...(person.children || []), ...(spouse.children || [])])]
                });
                processedPersons.add(person.id);
                processedPersons.add(spouse.id);
            } else {
                familyUnitsByLevel[level].push({
                    id: person.id, type: 'single', p1: person,
                    children: person.children || []
                });
                processedPersons.add(person.id);
            }
        }
    });

    // --- 3. Bottom-Up Positioning ---
    const positions = new Map();
    const nodes = [];
    const edges = [];
    let minX = 0, maxX = 0, minY = 0, maxY = 0;

    const sortedLevels = Object.keys(familyUnitsByLevel).map(Number).sort((a, b) => b - a);

    sortedLevels.forEach(level => {
        const units = familyUnitsByLevel[level];
        let currentX = 0;
        
        const lastPlacedNodeOnLevel = [...positions.values()].filter(p => p.level === level).sort((a,b) => b.x - a.x)[0];
        if(lastPlacedNodeOnLevel) {
            currentX = lastPlacedNodeOnLevel.x + NODE_WIDTH + H_SPACING;
        }

        units.forEach(unit => {
            if(positions.has(unit.id)) return;

            const y = level * (NODE_HEIGHT + V_SPACING);
            let x;

            const childUnits = (unit.children || []).map(childId => {
                const levelUnits = familyUnitsByLevel[level + 1] || [];
                return levelUnits.find(u => u.id.includes(childId));
            }).filter(Boolean);

            if (childUnits.length > 0) {
                const childPositions = childUnits.map(cu => positions.get(cu.id)).filter(Boolean);
                if (childPositions.length > 0) {
                    const firstChildX = Math.min(...childPositions.map(p => p.x));
                    const lastChildX = Math.max(...childPositions.map(p => p.x));
                    const childrenMidpoint = (firstChildX + lastChildX) / 2;
                    x = childrenMidpoint;
                } else {
                    x = currentX;
                }
            } else {
                x = currentX;
            }

            const lastUnitOnLevel = familyUnitsByLevel[level].map(u => positions.get(u.id)).filter(Boolean).sort((a,b) => a.x - b.x).pop();
            const unitWidth = unit.type === 'couple' ? NODE_WIDTH * 2 + COUPLE_SPACING : NODE_WIDTH;
            if(lastUnitOnLevel && x < lastUnitOnLevel.x + unitWidth + H_SPACING) {
                x = lastUnitOnLevel.x + unitWidth + H_SPACING;
            }

            positions.set(unit.id, { x, y, level });
            currentX = x + unitWidth + H_SPACING;
        });
    });

    // --- 4. Create Nodes and Edges from Positions ---
    for(const level of sortedLevels.reverse()){
        const units = familyUnitsByLevel[level];
        for(const unit of units){
            const pos = positions.get(unit.id);
            if(!pos) continue;

            const { x, y } = pos;
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);

            if (unit.type === 'single') {
                nodes.push({ id: unit.p1.id, x: x - NODE_WIDTH / 2, y, person: unit.p1 });
                minX = Math.min(minX, x - NODE_WIDTH / 2);
                maxX = Math.max(maxX, x + NODE_WIDTH / 2);
            } else {
                const x1 = x - (NODE_WIDTH + COUPLE_SPACING / 2);
                const x2 = x + (COUPLE_SPACING / 2);
                nodes.push({ id: unit.p1.id, x: x1, y, person: unit.p1 });
                nodes.push({ id: unit.p2.id, x: x2, y, person: unit.p2 });
                edges.push({ id: `m-${unit.id}`, type: 'marriage', x1: x1 + NODE_WIDTH, y1: y + NODE_HEIGHT/2, x2: x2, y2: y + NODE_HEIGHT/2 });
                minX = Math.min(minX, x1);
                maxX = Math.max(maxX, x2 + NODE_WIDTH);
            }
            
            const childUnits = (unit.children || []).map(childId => familyUnitsByLevel[level+1]?.find(u => u.id.includes(childId))).filter((v,i,a) => v && a.findIndex(t => t.id === v.id) === i);
            childUnits.forEach(childUnit => {
                const childPos = positions.get(childUnit.id);
                if (!childPos) return;

                const parentMidpointY = y + NODE_HEIGHT / 2;
                const parentConnectorX = x;
                const parentConnectorY = y + NODE_HEIGHT;
                const childMidpointY = childPos.y - 30;

                edges.push({ id: `e-${unit.id}-${childUnit.id}-1`, type: 'parental', path: `M ${parentConnectorX} ${parentMidpointY} V ${childMidpointY}` });
                edges.push({ id: `e-${unit.id}-${childUnit.id}-2`, type: 'parental', path: `M ${parentConnectorX} ${childMidpointY} H ${childPos.x}` });
                edges.push({ id: `e-${unit.id}-${childUnit.id}-3`, type: 'parental', path: `M ${childPos.x} ${childMidpointY} V ${childPos.y}` });
            });
        }
    }

    // Normalize coordinates
    const shiftX = -minX + H_SPACING;
    const shiftY = -minY + V_SPACING;
    nodes.forEach(n => { n.x += shiftX; n.y += shiftY; });
    edges.forEach(e => {
        if (e.type === 'marriage') {
            e.x1 += shiftX; e.y1 += shiftY; e.x2 += shiftX; e.y2 += shiftY;
        } else {
            e.path = e.path.replace(/([LMHV])\s*([\d.-]+)\s*([\d.-]+)?/g, (match, command, p1, p2) => {
                const n1 = parseFloat(p1) + (command === 'H' ? shiftX : command === 'V' ? shiftY : shiftX);
                if (p2 !== undefined) {
                    const n2 = parseFloat(p2) + shiftY;
                    return `${command} ${n1} ${n2}`;
                }
                return `${command} ${n1}`;
            });
        }
    });

    return { nodes, edges, width: (maxX - minX) + H_SPACING * 2, height: (maxY - minY) + V_SPACING * 2 };
};