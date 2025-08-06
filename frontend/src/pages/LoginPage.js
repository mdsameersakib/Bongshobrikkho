import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Auth from '../components/Auth';
import { auth, db } from '../services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword
} from "firebase/auth";
import { 
  doc, 
  collection, 
  writeBatch, 
  Timestamp,
  query,
  where,
  getDocs,
  or,
  and
} from 'firebase/firestore';

import { useAuth } from '../context/AuthContext'; // Import useAuth

export default function LoginPage() { // user prop removed
  const { user } = useAuth(); // Get user from context
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleRegister = async (email, password, invitationCode) => {
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      if (invitationCode) {
        // --- RESTORED: Advanced "Claim Profile" and "Web of Trust" Logic ---
        const q = query(collection(db, "persons"), where("invitationCode", "==", invitationCode.toUpperCase()));
        const personSnapshot = await getDocs(q);

        if (personSnapshot.empty) throw new Error("Invalid invitation code.");
        
        const personDoc = personSnapshot.docs[0];
        const personData = personDoc.data();

        if (personData.claimedByUid) throw new Error("This invitation has already been used.");
        
        const creatorUid = personData.creatorUid;
        const connectionsQuery = query(
          collection(db, "connections"),
          and(
            or(
              where("requesterUid", "==", creatorUid),
              where("recipientUid", "==", creatorUid)
            ),
            where("status", "==", "accepted")
          )
        );
        const connectionsSnapshot = await getDocs(connectionsQuery);
        
        const networkUids = new Set([creatorUid]);
        connectionsSnapshot.forEach(doc => {
            const data = doc.data();
            networkUids.add(data.requesterUid);
            networkUids.add(data.recipientUid);
        });

        const batch = writeBatch(db);
        
        const personRef = doc(db, "persons", personDoc.id);
        batch.update(personRef, { claimedByUid: newUser.uid, email: newUser.email }); 
        
        const userRef = doc(db, "users", newUser.uid);
        batch.set(userRef, {
          uid: newUser.uid, email: newUser.email,
          displayName: personData.firstName || newUser.email,
          personId: personDoc.id, createdAt: Timestamp.now(),
        });

        networkUids.forEach(uid => {
            if (uid !== newUser.uid) {
                const connectionRef = doc(collection(db, "connections"));
                batch.set(connectionRef, {
                    requesterUid: uid, recipientUid: newUser.uid,
                    status: 'accepted', createdAt: Timestamp.now(),
                });
            }
        });
        
        await batch.commit();

      } else {
        // Standard registration for a new user creating their own tree
        const personRef = doc(collection(db, "persons"));
        const userRef = doc(db, "users", newUser.uid);
        const batch = writeBatch(db);
        
        batch.set(personRef, {
          firstName: newUser.email.split('@')[0], lastName: '', gender: 'Other', birthDate: '',
          creatorUid: newUser.uid, claimedByUid: newUser.uid, invitationCode: null,
          parents: [], children: [], spouse: null,
        });
        batch.set(userRef, {
          uid: newUser.uid, email: newUser.email,
          displayName: newUser.email.split('@')[0],
          personId: personRef.id, createdAt: Timestamp.now(),
        });
        
        await batch.commit();
      }
    } catch (err) {
      setError(err.message);
      if (auth.currentUser && auth.currentUser.email === email) {
        await auth.currentUser.delete().catch(e => console.error("Failed to cleanup user:", e));
      }
    }
  };

  const handleLogin = async (email, password) => {
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 w-full max-w-md">
        <h1 className="text-4xl font-bold text-teal-700 text-center mb-8">BongshoBrikkho</h1>
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <Auth 
              handleLogin={handleLogin}
              handleRegister={handleRegister}
              error={error}
            />
        </div>
      </div>
    </div>
  );
}