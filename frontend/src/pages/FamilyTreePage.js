import React, { useMemo, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  addEdge
} from 'reactflow';
import 'reactflow/dist/style.css';

import usePersons from '../hooks/usePersons';
import useFamilyList from '../hooks/useFamilyList';
import CustomNode from '../components/CustomNode';
import MarriageNode from '../components/MarriageNode'; // <-- Import the new component

const nodeTypes = {
  custom: CustomNode,
};

// --- UPGRADED LAYOUT ENGINE with Marriage Node Logic ---
const getLayoutedElements = (allPersons, getRelationshipToUser) => {
    if (!allPersons || allPersons.length === 0) return { initialNodes: [], initialEdges: [] };
    
    const personMap = new Map(allPersons.map(p => [p.id, p]));
    const initialNodes = [];
    const initialEdges = [];
    
    const horizontalSpacing = 270;
    const verticalSpacing = 180;
    const levels = new Map();
    const visited = new Set();
    
    const rootNodes = allPersons.filter(p => !p.parents || p.parents.length === 0 || p.parents.every(id => !personMap.has(id)));
    if (rootNodes.length === 0 && allPersons.length > 0) rootNodes.push(allPersons[0]);

    let queue = rootNodes.map(node => ({ id: node.id, level: 0 }));
    queue.forEach(item => { levels.set(item.id, 0); visited.add(item.id); });

    let head = 0;
    while(head < queue.length) {
        const { id, level } = queue[head++];
        const person = personMap.get(id);
        person?.children?.forEach(childId => {
            if (personMap.has(childId) && !visited.has(childId)) {
                visited.add(childId);
                levels.set(childId, level + 1);
                queue.push({ id: childId, level: level + 1 });
            }
        });
    }

    const nodesByLevel = new Map();
    allPersons.forEach(p => {
        if(levels.has(p.id)) {
            const level = levels.get(p.id);
            if(!nodesByLevel.has(level)) nodesByLevel.set(level, []);
            nodesByLevel.get(level).push(p);
        }
    });

    nodesByLevel.forEach((levelNodes, level) => {
        const y = level * verticalSpacing;
        const levelWidth = (levelNodes.length - 1) * horizontalSpacing;
        const startX = -levelWidth / 2;
        levelNodes.forEach((person, index) => {
            // Create the main person node
            initialNodes.push({
                id: person.id,
                type: 'custom',
                position: { x: startX + index * horizontalSpacing, y },
                data: { label: `${person.firstName} ${person.lastName}`, relationship: getRelationshipToUser(person), gender: person.gender },
            });

            // If this person has a spouse, create a marriage node and edges
            if (person.spouse && personMap.has(person.spouse) && person.id < person.spouse) {
                const spouse = personMap.get(person.spouse);
                const spouseIndex = levelNodes.findIndex(p => p.id === spouse.id);
                if (spouseIndex !== -1) {
                    const personX = startX + index * horizontalSpacing;
                    const spouseX = startX + spouseIndex * horizontalSpacing;
                    
                    const marriageNodeId = `m-${person.id}-${spouse.id}`;
                    const marriageNodeX = (personX + spouseX) / 2;

                    // Add the marriage node
                    initialNodes.push({
                        id: marriageNodeId,
                        type: 'default', // Using a default node for the small circle
                        position: { x: marriageNodeX + 115, y: y + 25 },
                        className: 'w-5 h-5 bg-gray-500 rounded-full border-2 border-white shadow-md',
                    });

                    // Edges from spouses to marriage node
                    initialEdges.push({ id: `e-${person.id}-${marriageNodeId}`, source: person.id, target: marriageNodeId, type: 'straight', style: { stroke: '#a0aec0', strokeWidth: 2 }});
                    initialEdges.push({ id: `e-${spouse.id}-${marriageNodeId}`, source: spouse.id, target: marriageNodeId, type: 'straight', style: { stroke: '#a0aec0', strokeWidth: 2 }});

                    // Edges from marriage node to children
                    const children = [...new Set([...(person.children || []), ...(spouse.children || [])])];
                    children.forEach(childId => {
                        if (personMap.has(childId)) {
                             initialEdges.push({ id: `e-${marriageNodeId}-${childId}`, source: marriageNodeId, target: childId, type: 'smoothstep', style: { stroke: '#a0aec0', strokeWidth: 2 } });
                        }
                    });
                }
            }
        });
    });

    return { initialNodes, initialEdges };
};


export default function FamilyTreePage() {
    const { allPersons } = usePersons();
    const { getRelationshipToUser } = useFamilyList();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useMemo(() => {
        const { initialNodes, initialEdges } = getLayoutedElements(allPersons, getRelationshipToUser);
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [allPersons, getRelationshipToUser, setNodes, setEdges]);
  
    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
    
    // The rest of the component JSX is unchanged
    return (
        <>
            <header className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Family Tree</h2>
                <p className="text-gray-500 mt-1">Visualize your family connections. You can drag, pan, and zoom.</p>
            </header>
            <div className="w-full h-[75vh] bg-gray-50 rounded-lg shadow-inner border">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                >
                    <Background />
                    <Controls />
                    <MiniMap />
                </ReactFlow>
            </div>
        </>
    );
}