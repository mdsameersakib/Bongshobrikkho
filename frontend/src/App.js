import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from './services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";

// Import our new components
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Authentication Listener ---
  // This hook runs once and listens for changes in the user's login state.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    // Cleanup the listener when the component is no longer on the screen
    return () => unsubscribe();
  }, []);

  // --- Core Authentication Functions ---
  // These functions are kept in App.js because they control the main user state.
  const handleRegister = async (email, password) => {
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      // Create the user's profile document in Firestore after registration
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.email,
        createdAt: Timestamp.now(),
      });
    } catch (err) { 
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
  // While we're checking for a user, show a loading message.
  if (loading) {
    return <div className="App-container"><h1>Loading...</h1></div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>BongshoBrikkho</h1>
        {user ? (
          // If a user is logged in, show the Dashboard component.
          <Dashboard user={user} handleLogout={handleLogout} />
        ) : (
          // If no user is logged in, show the Auth component for login/registration.
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
