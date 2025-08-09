// Fresh tree layout implementation (from scratch) using family units and top-centered edges.
// NOTE: Keep NODE_WIDTH / NODE_HEIGHT synced with PersonNode component styling.

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const H_SPACING = 48;    // horizontal gap between units
const V_SPACING = 140;   // vertical gap between generations
const COUPLE_SPACING = 16; // gap between spouses in a couple unit

/**
 * calculateTreeLayout
 * @param {Array} allPersons - list of person objects (id, parents[], children[], spouse, gender ...)
 * @param {Object} userPerson - focal person object
 * @param {Array} couples - list of couple docs { id, husbandId, wifeId, childrenIds? }
 * @returns {{nodes: Array, edges: Array, width: number, height: number}}
 */
export const calculateTreeLayout = (allPersons, userPerson, couples = []) => {
    if (!userPerson || !allPersons?.length) return empty();

    // Build lookups
    const personMap = new Map(allPersons.map(p => [p.id, p]));

    // Step 1: Build family units (couple or single)
    const units = []; // { id, type:'couple'|'single', members:Person[], memberIds:string[], parentUnitIds:Set, childUnitIds:Set, depth?:number }
    const personToUnit = new Map();
    const processed = new Set();

    const makeUnit = (id, type, memberIds) => {
        const members = memberIds.map(mid => personMap.get(mid)).filter(Boolean);
        if (!members.length) return null;
        const u = { id, type, members, memberIds: members.map(m=>m.id), parentUnitIds:new Set(), childUnitIds:new Set(), depth: undefined };
        units.push(u);
        members.forEach(m => { personToUnit.set(m.id, u); processed.add(m.id); });
        return u;
    };

    // Real couples from collection
    for (const c of couples) {
        if (personMap.has(c.husbandId) && personMap.has(c.wifeId)) makeUnit(`couple_${c.id}`,'couple',[c.husbandId, c.wifeId]);
    }
    // Synthetic couples (spouse pointer present but no couple unit yet)
    for (const p of allPersons) {
        if (!p.spouse) continue;
        if (!personMap.has(p.spouse)) continue;
        if (personToUnit.has(p.id) && personToUnit.has(p.spouse)) continue;
        const pair = [p.id, p.spouse].sort();
        const sid = `synthetic_${pair.join('_')}`;
        if (!units.some(u=>u.id===sid)) makeUnit(sid,'couple',pair);
    }
    // Singles for remaining persons
    for (const p of allPersons) if(!processed.has(p.id)) makeUnit(`single_${p.id}`,'single',[p.id]);

    // Step 2: Link parent/child unit relationships (bidirectional using persons' parents/children)
    for (const person of allPersons) {
        const childUnit = personToUnit.get(person.id);
        // Link via parents
        (person.parents||[]).forEach(pid => {
            const parentUnit = personToUnit.get(pid);
            if(parentUnit && childUnit && parentUnit!==childUnit) {
                parentUnit.childUnitIds.add(childUnit.id);
                childUnit.parentUnitIds.add(parentUnit.id);
            }
        });
        // Link via children
        (person.children||[]).forEach(cid => {
            const cUnit = personToUnit.get(cid);
            if(cUnit && childUnit && cUnit!==childUnit) {
                childUnit.childUnitIds.add(cUnit.id);
                cUnit.parentUnitIds.add(childUnit.id);
            }
        });
    }

    // Step 3: Assign depths centered on user
    const userUnit = personToUnit.get(userPerson.id);
    if(!userUnit) return empty();
    userUnit.depth = 0;
    const bfs = [userUnit];
    while (bfs.length) {
        const u = bfs.shift();
        const d = u.depth||0;
        u.parentUnitIds.forEach(pid=>{
            const pu = units.find(x=>x.id===pid);
            if(pu && pu.depth===undefined){ pu.depth = d - 1; bfs.push(pu); }
        });
        u.childUnitIds.forEach(cid=>{
            const cu = units.find(x=>x.id===cid);
            if(cu && cu.depth===undefined){ cu.depth = d + 1; bfs.push(cu); }
        });
    }

    const connected = units.filter(u=>u.depth!==undefined);
    if(!connected.length) return empty();

    // Step 4: Position units level-by-level.
    const unitWidth = u => u.type==='couple' ? NODE_WIDTH*2 + COUPLE_SPACING : NODE_WIDTH;
    const positions = new Map(); // unitId -> {x,y}
    const depths = [...new Set(connected.map(u=>u.depth))].sort((a,b)=>a-b); // ascending (ancestors .. descendants)

    depths.forEach(depth => {
        const levelUnits = connected.filter(u=>u.depth===depth).sort((a,b)=>a.id.localeCompare(b.id));
        let cursorX = 0;
        levelUnits.forEach(u => {
            let anchors = [];
            if (depth > 0) { // descendants anchored to parents one level up
                anchors = [...u.parentUnitIds].map(pid => {
                    const pos = positions.get(pid); const pu = connected.find(x=>x.id===pid); return pos? pos.x + unitWidth(pu)/2 : null;
                }).filter(v=>v!=null);
            } else if (depth < 0) { // ancestors anchored to children one level down
                anchors = [...u.childUnitIds].map(cid => { const pos=positions.get(cid); const cu=connected.find(x=>x.id===cid); return pos? pos.x + unitWidth(cu)/2 : null; }).filter(v=>v!=null);
            } else { // depth 0 (user)
                anchors = [...u.childUnitIds].map(cid => { const pos=positions.get(cid); const cu=connected.find(x=>x.id===cid); return pos? pos.x + unitWidth(cu)/2 : null; });
            }
            const w = unitWidth(u);
            let x = anchors.length ? ((Math.min(...anchors)+Math.max(...anchors))/2) - w/2 : cursorX;
            // prevent overlap with last unit
            const prevPlaced = levelUnits.filter(p=>positions.has(p.id));
            if(prevPlaced.length){
                const last = prevPlaced[prevPlaced.length-1];
                const lastPos = positions.get(last.id);
                const needed = lastPos.x + unitWidth(last) + H_SPACING;
                if (x < needed) x = needed;
            }
            positions.set(u.id, { x, y: depth * (NODE_HEIGHT + V_SPACING) });
            cursorX = x + w + H_SPACING;
        });
    });

    // Step 5: Expand units into person nodes
    let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
    const nodes = [];
    for (const u of connected) {
        const pos = positions.get(u.id); if(!pos) continue;
        const ordered = u.type==='couple'
            ? [...u.members].sort((a,b)=>{ if(a.gender!==b.gender){ if(a.gender==='Female') return -1; if(b.gender==='Female') return 1;} return a.id.localeCompare(b.id); })
            : u.members;
        ordered.forEach((p,i)=>{
            const x = pos.x + (u.type==='couple' ? (i===0?0: NODE_WIDTH + COUPLE_SPACING) : 0);
            const y = pos.y;
            nodes.push({ id:p.id, x, y, person:p, relationship:p.relationship });
            minX = Math.min(minX, x); maxX = Math.max(maxX, x + NODE_WIDTH); minY = Math.min(minY, y); maxY = Math.max(maxY, y + NODE_HEIGHT);
        });
    }

    // Step 6: Build edges (marriage + parent-child to top center of child)
    const edges = [];
    // Marriage edges
    connected.filter(u=>u.type==='couple').forEach(u => {
        const spouseNodes = nodes.filter(n=>u.memberIds.includes(n.id)).sort((a,b)=>a.x-b.x);
        if (spouseNodes.length===2) {
            const [left,right] = spouseNodes;
            edges.push({ id:`marriage_${u.id}`, type:'marriage', x1:left.x+NODE_WIDTH, y1:left.y+NODE_HEIGHT/2, x2:right.x, y2:right.y+NODE_HEIGHT/2 });
        }
    });
    // Parent-child edges (orthogonal path; connects to child top center)
    const pairDone = new Set();
    connected.forEach(parent => {
        const pPos = positions.get(parent.id); if(!pPos) return;
        const pCenterX = pPos.x + (parent.type==='couple'? (unitWidth(parent)/2) : NODE_WIDTH/2);
        const pBottom = pPos.y + NODE_HEIGHT;
        parent.childUnitIds.forEach(cid => {
            const child = connected.find(u=>u.id===cid); if(!child) return;
            const key = parent.id + '>' + child.id; if(pairDone.has(key)) return; pairDone.add(key);
            const cPos = positions.get(child.id); if(!cPos) return;
            const cCenterX = cPos.x + (child.type==='couple'? (unitWidth(child)/2) : NODE_WIDTH/2);
            const cTop = cPos.y; // top of child unit
            const midY = (pBottom + cTop)/2;
            const path = `M ${pCenterX} ${pBottom} V ${midY} H ${cCenterX} V ${cTop}`;
            edges.push({ id:`pc_${parent.id}_${child.id}`, type:'parent-child', path });
        });
    });

    // Step 7: Normalize coordinates to positive space with padding
    if(!isFinite(minX)) return empty();
    const padX = H_SPACING; const padY = V_SPACING;
    const shiftX = -minX + padX; const shiftY = -minY + padY;
    nodes.forEach(n=>{ n.x += shiftX; n.y += shiftY; });
    edges.forEach(e=>{
        if(e.type==='marriage') { e.x1+=shiftX; e.x2+=shiftX; e.y1+=shiftY; e.y2+=shiftY; }
        else if(e.path) {
            e.path = e.path.replace(/([MVH])\s+(-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?))?/g,(match,cmd,a,b)=>{
                if(cmd==='M') return `M ${parseFloat(a)+shiftX} ${parseFloat(b)+shiftY}`;
                if(cmd==='H') return `H ${parseFloat(a)+shiftX}`;
                if(cmd==='V') return `V ${parseFloat(a)+shiftY}`;
                return match;
            });
        }
    });

    return { nodes, edges, width:(maxX-minX)+padX*2, height:(maxY-minY)+padY*2 };
};

function empty(){ return { nodes:[], edges:[], width:0, height:0 }; }
