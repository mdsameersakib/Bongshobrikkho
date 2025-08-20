import { auth, db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { getDisplayName } from '../utils/displayName';

/**
 * Fetches the user's profile from both 'users' and 'persons' collections.
 * This is needed to load the profile data on the Settings page.
 */
export const getProfile = async (uid) => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userData = userSnap.data();
        const personId = userData.personId;
        if (personId) {
            const personRef = doc(db, 'persons', personId);
            const personSnap = await getDoc(personRef);
            if (personSnap.exists()) {
                const personData = { id: personSnap.id, ...personSnap.data() };
                const displayName = getDisplayName(uid, userData.email, [personData]);
                return { person: personData, profileData: userData, displayName };
            }
        }
        return { person: null, profileData: userData, displayName: userData.email };
    }
    return { person: null, profileData: null, displayName: '' };
};


/**
 * --- THIS IS THE CORRECTED FUNCTION ---
 * It now accepts any profile data (including profileImageUrl) and saves it.
 * It also keeps your original logic for updating the Firebase Auth displayName.
 * @param {Object} profileData An object containing the data to update.
 * @param {string} profileData.personId Firestore persons document id.
 * @param {string} [profileData.firstName]
 * @param {string} [profileData.lastName]
 * @param {string} [profileData.birthDate]
 * @param {string} [profileData.profileImageUrl]
 */
export async function updateUserProfile(profileData) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    
    const { personId, ...dataToUpdate } = profileData;
    if (!personId) throw new Error('Missing personId');

    // Update the 'persons' document in Firestore with all provided data
    const personRef = doc(db, 'persons', personId);
    await updateDoc(personRef, dataToUpdate);

    // If a new first name was provided, update the auth profile displayName
    if (dataToUpdate.firstName) {
        try {
            await updateProfile(auth.currentUser, { 
                displayName: dataToUpdate.firstName || auth.currentUser.displayName || auth.currentUser.email 
            });
        } catch (e) {
            console.warn('Display name update failed', e);
        }
    }
    
    return true;
}