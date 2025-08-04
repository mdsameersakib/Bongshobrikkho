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
  writeBatch
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
    console.log("--- Starting Registration ---");
    try {
      console.log("Step 1: Creating user in Firebase Auth...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      console.log("SUCCESS: User created with UID:", newUser.uid);

      if (invitationCode) {
        console.log(`Step 2: Claiming profile with code: ${invitationCode.toUpperCase()}`);
        const q = query(collection(db, "persons"), where("invitationCode", "==", invitationCode.toUpperCase()));
        
        console.log("Step 3: Searching for person with that code...");
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.error("ERROR: No person found with that code.");
          throw new Error("Invalid invitation code. A standard profile has been created for you.");
        }
        
        const personDoc = querySnapshot.docs[0];
        const personData = personDoc.data();
        console.log("SUCCESS: Found person to claim:", personDoc.id, personData);

        if (personData.claimedByUid) {
          console.error("ERROR: This invitation has already been used.");
          throw new Error("This invitation has already been used. A standard profile has been created for you.");
        }

        console.log("Step 4: Preparing to update documents in a batch...");
        const personRef = doc(db, "persons", personDoc.id);
        const userRef = doc(db, "users", newUser.uid);
        const connectionRef = doc(collection(db, "connections"));
        const batch = writeBatch(db);
        
        console.log("Updating person doc:", personDoc.id);
        batch.update(personRef, { claimedByUid: newUser.uid, email: newUser.email }); 
        
        console.log("Creating user doc:", newUser.uid);
        batch.set(userRef, {
          uid: newUser.uid,
          email: newUser.email,
          displayName: personData.firstName || newUser.email,
          personId: personDoc.id,
          createdAt: Timestamp.now(),
        });

        console.log("Creating automatic connection with creator:", personData.creatorUid);
        batch.set(connectionRef, {
            requesterUid: personData.creatorUid,
            recipientUid: newUser.uid,
            status: 'accepted',
            createdAt: Timestamp.now(),
        });

        console.log("Step 5: Committing all changes to Firestore...");
        await batch.commit();
        console.log("--- Registration Complete ---");

      } else {
        console.log("Step 2: Standard registration (no code).");
        console.log("Step 3: Preparing to create new person and user docs...");
        const personRef = doc(collection(db, "persons"));
        const userRef = doc(db, "users", newUser.uid);
        const batch = writeBatch(db);
        
        batch.set(personRef, {
          firstName: newUser.email.split('@')[0],
          lastName: '',
          gender: 'Other',
          birthDate: '',
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
          displayName: newUser.email.split('@')[0],
          personId: personRef.id,
          createdAt: Timestamp.now(),
        });
        
        console.log("Step 4: Committing all changes to Firestore...");
        await batch.commit();
        console.log("--- Registration Complete ---");
      }
    } catch (err) { 
      console.error("!!! REGISTRATION FAILED !!!", err);
      // If registration fails, we should delete the user to allow them to try again
      if (auth.currentUser) {
        console.log("Cleaning up failed user creation...");
        await auth.currentUser.delete();
      }
      setError(err.message); 
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

  const handleLogout = async () => {
    setError('');
    try { 
      await signOut(auth); 
    } catch (err) { 
      setError(err.message); 
    }
  };

  // --- Render Logic ---
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
