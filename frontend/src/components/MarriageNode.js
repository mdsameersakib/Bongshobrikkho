import React from 'react';

// This simple component renders the small circle between spouses.
export default function MarriageNode({ style }) {
  return (
    <div 
      style={style} 
      className="absolute w-5 h-5 bg-gray-500 rounded-full border-2 border-white shadow-md z-0"
      title="Marriage"
    >
    </div>
  );
}