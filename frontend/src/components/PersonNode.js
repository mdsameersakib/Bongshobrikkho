import React from 'react';
import { formatDateDMY } from '../utils/date';

export default function PersonNode({ person, relationship, style }) {
  const genderColor =
    person.gender === 'Male'
      ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      : person.gender === 'Female'
      ? 'border-pink-400 dark:border-pink-500 bg-pink-50 dark:bg-pink-900/20'
      : 'border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-800/40';

  const avatarLetter = person.firstName?.[0]?.toUpperCase() || '?';

  return (
    <div
      id={person.id}
      data-x={style.x}
      data-y={style.y}
      className="absolute bg-white dark:bg-slate-900 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 border border-slate-200 dark:border-slate-700/80"
      style={{
        width: 220,
        height: 90,
        transform: `translate(${style.x}px, ${style.y}px)`,
      }}
    >
      <div className={`h-full w-full p-3 flex items-center border-2 ${genderColor} rounded-xl backdrop-blur-sm`}>
        {/* Avatar */}
        <div className="flex-shrink-0 h-16 w-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border-2 border-inherit overflow-hidden">
          {person.profileImageUrl ? (
            <img src={person.profileImageUrl} alt="Profile" className="h-full w-full object-cover rounded-full" />
          ) : (
            <span className="text-3xl font-thin text-black/70 dark:text-white/70">{avatarLetter}</span>
          )}
        </div>

        {/* Details */}
        <div className="ml-4 overflow-hidden">
          <p className="font-bold text-black dark:text-white text-lg truncate" title={`${person.firstName} ${person.lastName}`}>
            {person.firstName} {person.lastName}
          </p>
          {relationship && (
            <p className="text-sm font-semibold text-accent">
              {relationship}
            </p>
          )}
          <p className="text-xs text-black/70 dark:text-white/60 mt-1">Born: {person.birthDate ? formatDateDMY(person.birthDate) : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}