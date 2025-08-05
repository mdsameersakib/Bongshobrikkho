import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from './services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  doc,
  Timestamp,
  getDocs,
  query,
  where,
  collection,
  writeBatch,
  or,
  and // Import 'and'
} from "firebase/firestore";

import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleRegister = async (email, password, invitationCode) => {
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      if (invitationCode) {
        // Find the person profile being claimed
        const q = query(collection(db, "persons"), where("invitationCode", "==", invitationCode.toUpperCase()));
        const personSnapshot = await getDocs(q);

        if (personSnapshot.empty) {
          throw new Error("Invalid invitation code.");
        }
        
        const personDoc = personSnapshot.docs[0];
        const personData = personDoc.data();

        if (personData.claimedByUid) {
          throw new Error("This invitation has already been used.");
        }
        
        // --- NEW LOGIC: Find the creator's network (this will now work) ---
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
        
        const networkUids = new Set([creatorUid]); // Start the network with the creator
        connectionsSnapshot.forEach(doc => {
            const data = doc.data();
            networkUids.add(data.requesterUid);
            networkUids.add(data.recipientUid);
        });
        // --- END OF NEW LOGIC ---

        const batch = writeBatch(db);
        
        // 1. Update the person document
        const personRef = doc(db, "persons", personDoc.id);
        batch.update(personRef, { claimedByUid: newUser.uid, email: newUser.email }); 
        
        // 2. Create the user document
        const userRef = doc(db, "users", newUser.uid);
        batch.set(userRef, {
          uid: newUser.uid,
          email: newUser.email,
          displayName: personData.firstName || newUser.email,
          personId: personDoc.id,
          createdAt: Timestamp.now(),
        });

        // 3. Create connections to the entire network
        networkUids.forEach(uid => {
            if (uid !== newUser.uid) { // Don't connect a user to themselves
                const connectionRef = doc(collection(db, "connections"));
                batch.set(connectionRef, {
                    requesterUid: uid,
                    recipientUid: newUser.uid,
                    status: 'accepted',
                    createdAt: Timestamp.now(),
                });
            }
        });
        
        await batch.commit();

      } else {
        // Standard registration logic (no changes needed here)
        const personRef = doc(collection(db, "persons"));
        const userRef = doc(db, "users", newUser.uid);
        const batch = writeBatch(db);
        
        batch.set(personRef, {
          firstName: newUser.email.split('@')[0], lastName: '', gender: 'Other',
          creatorUid: newUser.uid, claimedByUid: newUser.uid, invitationCode: null,
          parents: [], children: [], spouse: null,
        });
        batch.set(userRef, {
          uid: newUser.uid, email: newUser.email, displayName: newUser.email.split('@')[0],
          personId: personRef.id, createdAt: Timestamp.now(),
        });
        
        await batch.commit();
      }
    } catch (err) {
      setError(err.message);
      if (auth.currentUser && auth.currentUser.email === email) {
        await auth.currentUser.delete().catch(e => console.error("Failed to cleanup user:", e));
      }
      console.error("Registration failed:", err);
    }
  };
  
  // handleLogin and handleLogout functions remain the same...

  const handleLogin = async (email, password) => {
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    setError('');
    try {
      await signOut(auth);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="App-container"><h1>Loading...</h1></div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>BongshoBrikkho</h1>
        {user ? (
          <Dashboard user={user} handleLogout={handleLogout} />
        ) : (
          <Auth
            handleLogin={handleLogin}
            handleRegister={handleRegister}
            error={error}
          />
        )}
      </header>
    </div>
  );
}

export default App;