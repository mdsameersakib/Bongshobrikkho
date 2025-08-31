import React from 'react';
import PersonNode from './PersonNode';
import useTreeControls from '../hooks/useTreeControls';

// Heart icon component for the marriage node
const MarriageIcon = ({ x, y }) => (
  <svg x={x - 8} y={y - 8} width="16" height="16" viewBox="0 0 24 24" fill="#475569" className="pointer-events-none">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

export default function TreeCanvas({ layout }) {
  const { nodes, edges, width, height } = layout;
  const containerRef = React.useRef(null);
  
  const userNodeId = nodes.find(n => n.relationship === 'You')?.id;

  // The hook now returns the transform state AND the event handlers
  const { zoom, centerOnNode, transform, eventHandlers } = useTreeControls(
    containerRef,
    userNodeId
  );

  return (
    // The event handlers are now attached to this container div
  <div
      ref={containerRef}
      className="tree-viewport-container"
      style={{ backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`, cursor: 'grab' }}
      {...eventHandlers}
    >
      <div
        className="tree-canvas"
        style={{ 
            width, 
            height,
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        <svg
          className="absolute top-0 left-0 w-full h-full"
          style={{ overflow: 'visible' }}
        >
          {edges.map((edge) => {
            if (edge.type === 'marriage') {
              return (
                <g key={edge.id}>
                    <line
                      x1={edge.x1} y1={edge.y1}
                      x2={edge.x2} y2={edge.y2}
                      className="edge-path marriage"
                    />
                    <MarriageIcon x={(edge.x1 + edge.x2) / 2} y={(edge.y1 + edge.y2) / 2} />
                </g>
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
      <div className="absolute top-3 right-3 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 flex gap-1">
        <button
          onClick={() => zoom('in')}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-black dark:text-white transition-colors"
          title="Zoom In"
          disabled={transform.scale >= 2}
        >
          <span className="text-lg font-bold">+</span>
        </button>
        <button
          onClick={() => zoom('out')}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-black dark:text-white transition-colors"
          title="Zoom Out"
          disabled={transform.scale <= 0.3}
        >
          <span className="text-lg font-bold">−</span>
        </button>
        <button
          onClick={centerOnNode}
          className="h-8 px-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-black dark:text-white transition-colors"
          title="Center on Me"
        >
          Center
        </button>
      </div>

      {/* Tree info overlay */}
      <div className="absolute top-3 left-3 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {nodes.length} people • {edges.length} connections
        </div>
      </div>
    </div>
  );
}