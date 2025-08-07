import React from 'react';

export default function PersonNode({ person, style }) {
  // Use gender to apply a specific border color to the avatar
  const genderClass = person.gender === 'Male' 
    ? 'shadow-blue-400' 
    : person.gender === 'Female' 
    ? 'shadow-pink-400' 
    : 'shadow-gray-400';

  return (
    <div style={style} className="absolute flex flex-col items-center w-40">
      <div className="relative bg-white rounded-lg shadow-lg border border-slate-200 p-4 text-center z-10">
        <img 
          src={`https://placehold.co/64x64/ffffff/000000?text=${person.firstName?.[0] || '?'}`} 
          alt={`${person.firstName} ${person.lastName}`}
          className={`w-16 h-16 rounded-full mx-auto -mt-12 border-4 border-white shadow-md ${genderClass}`}
        />
        <p className="font-bold text-slate-800 mt-2">{person.firstName} {person.lastName}</p>
        <p className="text-xs text-slate-500">{person.birthDate || ' '}</p>
      </div>
    </div>
  );
}