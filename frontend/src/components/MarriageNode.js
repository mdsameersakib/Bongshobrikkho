import React from 'react';
import { Handle, Position } from 'reactflow';

export default function MarriageNode() {
  return (
    <>
      {/* Target handles for the spouses to connect to */}
      <Handle type="target" position={Position.Left} id="left" className="!bg-transparent !border-none" />
      <Handle type="target" position={Position.Right} id="right" className="!bg-transparent !border-none" />
      {/* Source handle for the children to connect from */}
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-gray-500" />

      <div 
        className="w-6 h-6 bg-gray-500 rounded-full border-2 border-white shadow-md"
        title="Marriage"
      >
      </div>
    </>
  );
}