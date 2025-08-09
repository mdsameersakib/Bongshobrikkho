import { auth, db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

/**
 * Update core person profile fields and keep Firebase Auth displayName in sync.
 * @param {Object} params
 * @param {string} params.personId Firestore persons document id
 * @param {string} [params.firstName]
 * @param {string} [params.lastName]
 * @param {string} [params.birthDate]
 */
export async function updateUserProfile({ personId, firstName, lastName, birthDate }) {
  if (!auth.currentUser) throw new Error('Not authenticated');
  if (!personId) throw new Error('Missing personId');
  const personRef = doc(db, 'persons', personId);
  await updateDoc(personRef, {
    firstName: firstName || '',
    lastName: lastName || '',
    birthDate: birthDate || ''
  });
  try {
    await updateProfile(auth.currentUser, { displayName: firstName || auth.currentUser.displayName || auth.currentUser.email });
  } catch (e) {
    console.warn('Display name update failed', e);
  }
  return true;
}
