import React from 'react';
import { formatDateDMY } from '@/utils/date';
import { Person } from '@/types/database';
import { getFullName } from '@/utils/name';
import Image from 'next/image';

interface PersonNodeProps {
  person: Person & { profileImageUrl?: string };
  relationship?: string;
  style: { x: number; y: number };
}

export default function PersonNode({ person, relationship, style }: PersonNodeProps) {
  // Safety check: if person is undefined, don't crash the whole tree
  if (!person) return null;

  const deceasedStyles = person.is_deceased
    ? 'border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-900/40 grayscale'
    : '';

  const genderColor = person.is_deceased 
    ? deceasedStyles
    : person.gender === 'male'
      ? 'border-forest/40 bg-forest/5 dark:border-forest/60 dark:bg-forest/20'
      : person.gender === 'female'
      ? 'border-sage/40 bg-sage/5 dark:border-sage/60 dark:bg-sage/20'
      : 'border-sand/40 bg-sand/5 dark:border-sand/60 dark:bg-sand/20';

  const avatarLetter = person.first_name?.[0]?.toUpperCase() || '?';

  return (
    <div
      id={person.id}
      className="absolute bg-surface rounded-2xl shadow-lg transition-all duration-300 border border-sand/20 dark:border-sand/10 group hover:ring-4 hover:ring-forest/10 dark:hover:ring-sage/20 hover:border-forest/40 dark:hover:border-sage/40"
      style={{
        width: 240,
        height: 100,
        transform: `translate(${style.x}px, ${style.y}px)`,
      }}
    >
      <div className={`h-full w-full p-4 flex items-center border-2 ${genderColor} rounded-2xl backdrop-blur-sm`}>
        {/* Avatar */}
        <div className="flex-shrink-0 h-14 w-14 bg-white dark:bg-sand/10 rounded-full flex items-center justify-center border-2 border-inherit overflow-hidden shadow-inner group-hover:rotate-6 transition-transform">
          {person.profileImageUrl ? (
            <Image 
              src={person.profileImageUrl} 
              alt="Profile" 
              width={56}
              height={56}
              className="h-full w-full object-cover rounded-full" 
            />
          ) : (
            <span className="text-2xl font-black text-forest dark:text-sage">{avatarLetter}</span>
          )}
        </div>

        {/* Details */}
        <div className="ml-4 overflow-hidden">
          <p className="font-black text-forest dark:text-sage text-base truncate leading-tight" title={getFullName(person)}>
            {getFullName(person)}
          </p>
          {relationship && (
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-0.5">
              {relationship}
            </p>
          )}
          <p className="text-[11px] font-bold text-slate-400 dark:text-white/40 mt-1">
            {person.birth_date ? formatDateDMY(person.birth_date) : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}
