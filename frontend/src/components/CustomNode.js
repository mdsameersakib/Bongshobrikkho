import React from 'react';
import { Handle, Position } from 'reactflow';

// This component defines the visual appearance of each person in the tree.
export default function CustomNode({ data }) {
  const genderClass = data.gender === 'Male' 
    ? 'border-blue-500' 
    : data.gender === 'Female' 
    ? 'border-pink-500' 
    : 'border-gray-500';

  return (
    <div className={`bg-white rounded-lg shadow-lg border-2 ${genderClass} p-3 w-52`}>
      {/* These "Handles" are the connection points for the lines (edges) */}
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />

      <div className="flex items-center">
        <img 
          src={`https://placehold.co/48x48/ffffff/000000?text=${data.label?.[0].toUpperCase()}`} 
          alt={data.label} 
          className="h-12 w-12 rounded-full mr-3"
        />
        <div>
          <div className="font-bold text-gray-800">{data.label}</div>
          {data.relationship && (
            <div className="text-sm text-teal-600 font-semibold">{data.relationship}</div>
          )}
        </div>
      </div>
    </div>
  );
}