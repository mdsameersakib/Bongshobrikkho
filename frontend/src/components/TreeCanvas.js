import React from 'react';
import PersonNode from './PersonNode';
import useTreeControls from '../hooks/useTreeControls'; // Using our existing controls hook

export default function TreeCanvas({ layout }) {
  const { nodes, edges, width, height } = layout;
  const containerRef = React.useRef(null);
  const viewportRef = React.useRef(null);

  // Use the existing hook for pan and zoom controls
  const { zoom, centerOnNode, transform, setTransform } = useTreeControls(
    containerRef,
    viewportRef,
    nodes.find(n => n.relationship === 'You')?.id
  );

  return (
    <div
      ref={containerRef}
      className="tree-viewport-container" // Using styles from index.css
    >
      <div
        ref={viewportRef}
        className="tree-canvas"
        style={{ width, height }}
      >
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        >
          {edges.map((edge) => {
            if (edge.type === 'marriage') {
              return (
                <line
                  key={edge.id}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  className="edge-path marriage"
                />
              );
            }
            return (
              <path key={edge.id} d={edge.path} className="edge-path" />
            );
          })}
        </svg>

        {nodes.map((node) => (
          <PersonNode
            key={node.id}
            person={node.person}
            relationship={node.relationship}
            style={{ x: node.x, y: node.y }}
          />
        ))}
      </div>

      {/* UI Controls */}
      <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur p-1 rounded-lg shadow flex gap-1">
        <button onClick={() => zoom('in')} className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-gray-100" title="Zoom In">+</button>
        <button onClick={() => zoom('out')} className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-gray-100" title="Zoom Out">−</button>
        <button onClick={centerOnNode} className="h-9 px-3 rounded-md hover:bg-gray-100 text-sm" title="Center on Me">Center</button>
      </div>
    </div>
  );
}