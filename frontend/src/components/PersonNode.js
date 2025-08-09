import React from 'react';
import { formatDateDMY } from '../utils/date';

export default function PersonNode({ person, relationship, style }) {
  const genderColor =
    person.gender === 'Male'
      ? 'border-blue-500 bg-blue-50'
      : person.gender === 'Female'
      ? 'border-pink-500 bg-pink-50'
      : 'border-gray-500 bg-gray-50';

  const avatarLetter = person.firstName?.[0]?.toUpperCase() || '?';

  return (
    <div
      id={person.id} // Add ID for the centering function to find the element
      data-x={style.x}
      data-y={style.y}
      className="absolute bg-white rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
      style={{
        width: 220, // New width
        height: 90,  // New height
        transform: `translate(${style.x}px, ${style.y}px)`,
      }}
    >
      <div className={`h-full w-full p-3 flex items-center border-2 ${genderColor} rounded-xl`}>
        {/* Avatar */}
        <div className="flex-shrink-0 h-16 w-16 bg-white rounded-full flex items-center justify-center border-2 border-inherit">
          <span className="text-3xl font-thin text-gray-600">{avatarLetter}</span>
        </div>
        
        {/* Details */}
        <div className="ml-4 overflow-hidden">
          <p className="font-bold text-gray-900 text-lg truncate" title={`${person.firstName} ${person.lastName}`}>
            {person.firstName} {person.lastName}
          </p>
          {relationship && (
            <p className="text-sm font-semibold text-teal-600">
              {relationship}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">Born: {person.birthDate ? formatDateDMY(person.birthDate) : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}