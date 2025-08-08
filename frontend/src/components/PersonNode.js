import React from 'react';

export default function PersonNode({ person, relationship, style }) {
  const genderColor =
    person.gender === 'Male'
      ? 'border-blue-500'
      : person.gender === 'Female'
      ? 'border-pink-500'
      : 'border-gray-500';

  return (
    <div
      className="absolute bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
      style={{
        width: 180,
        height: 80,
        transform: `translate(${style.x}px, ${style.y}px)`,
      }}
    >
      <div className={`h-full w-full p-3 flex items-center border-2 ${genderColor} rounded-lg`}>
        <div className="ml-3">
          <p className="font-bold text-gray-800 truncate">
            {person.firstName} {person.lastName}
          </p>
          {relationship && (
            <p className="text-xs font-semibold text-teal-600">
              {relationship}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Born: {person.birthDate || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}