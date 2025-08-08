import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  doc,
  collection,
  writeBatch,
  Timestamp,
  query,
  where,
  getDocs,
  or,
  and,
} from 'firebase/firestore';

export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// --- UPDATED: Accepts userDetails object ---
export const registerUser = async (email, password, invitationCode, userDetails) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const newUser = userCredential.user;

  try {
    if (invitationCode) {
      await claimProfile(newUser, invitationCode);
    } else {
      // Pass the new details to the profile creation function
      await createNewUserProfile(newUser, userDetails);
    }
  } catch (error) {
    if (auth.currentUser && auth.currentUser.uid === newUser.uid) {
      await auth.currentUser.delete();
    }
    throw error;
  }
};

// --- UPDATED: Accepts and uses userDetails ---
const createNewUserProfile = async (newUser, userDetails) => {
  const personRef = doc(collection(db, 'persons'));
  const userRef = doc(db, 'users', newUser.uid);
  const batch = writeBatch(db);

  batch.set(personRef, {
    // Use the provided details instead of defaults
    firstName: userDetails.firstName || newUser.email.split('@')[0],
    lastName: userDetails.lastName || '',
    gender: 'Other', // You could add a gender field to the form as well
    birthDate: userDetails.birthDate || '',
    creatorUid: newUser.uid,
    claimedByUid: newUser.uid,
    invitationCode: null,
    parents: [],
    children: [],
    spouse: null,
  });
  batch.set(userRef, {
    uid: newUser.uid,
    email: newUser.email,
    // Use the new first name for the display name
    displayName: userDetails.firstName || newUser.email.split('@')[0],
    personId: personRef.id,
    createdAt: Timestamp.now(),
  });

  await batch.commit();
};

const claimProfile = async (newUser, invitationCode) => {
  const q = query(
    collection(db, 'persons'),
    where('invitationCode', '==', invitationCode.toUpperCase())
  );
  const personSnapshot = await getDocs(q);

  if (personSnapshot.empty) {
    throw new Error('Invalid invitation code.');
  }

  const personDoc = personSnapshot.docs[0];
  const personData = personDoc.data();

  if (personData.claimedByUid) {
    throw new Error('This invitation has already been used.');
  }

  const creatorUid = personData.creatorUid;
  const connectionsQuery = query(
    collection(db, 'connections'),
    and(
      or(
        where('requesterUid', '==', creatorUid),
        where('recipientUid', '==', creatorUid)
      ),
      where('status', '==', 'accepted')
    )
  );
  const connectionsSnapshot = await getDocs(connectionsQuery);

  const networkUids = new Set([creatorUid]);
  connectionsSnapshot.forEach((doc) => {
    const data = doc.data();
    networkUids.add(data.requesterUid);
    networkUids.add(data.recipientUid);
  });

  const batch = writeBatch(db);

  const personRef = doc(db, 'persons', personDoc.id);
  batch.update(personRef, { claimedByUid: newUser.uid, email: newUser.email });

  const userRef = doc(db, 'users', newUser.uid);
  batch.set(userRef, {
    uid: newUser.uid,
    email: newUser.email,
    displayName: personData.firstName || newUser.email,
    personId: personDoc.id,
    createdAt: Timestamp.now(),
  });

  networkUids.forEach((uid) => {
    if (uid !== newUser.uid) {
      const connectionRef = doc(collection(db, 'connections'));
      batch.set(connectionRef, {
        requesterUid: uid,
        recipientUid: newUser.uid,
        status: 'accepted',
        createdAt: Timestamp.now(),
      });
    }
  });

  await batch.commit();
};