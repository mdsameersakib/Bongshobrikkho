import { Person } from '@/types/database';

/**
 * Returns the full name of a person by joining first, middle, and last names.
 * Filters out null/undefined/empty parts.
 */
export function getFullName(person?: Partial<Person> | null): string {
  if (!person) return 'Unknown';
  
  const parts = [
    person.first_name,
    person.middle_name,
    person.last_name
  ].filter(Boolean);
  
  return parts.join(' ') || 'Unnamed Member';
}
