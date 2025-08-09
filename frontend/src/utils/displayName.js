// Utility to derive a human-friendly display name for a user UID/email
// persons: array of person docs containing claimedByUid, firstName, lastName
export function getDisplayName(uid, email, persons = []) {
  if (persons && persons.length) {
    const person = persons.find(p => p.claimedByUid === uid) || persons.find(p => p.creatorUid === uid);
    if (person) {
      const first = person.firstName?.trim() || '';
      const last = person.lastName?.trim() || '';
      const full = `${first} ${last}`.trim();
      if (full) return full;
    }
  }
  if (email) {
    const prefix = email.split('@')[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return 'Unknown';
}
