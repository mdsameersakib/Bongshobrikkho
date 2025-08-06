import React, { useContext, useState, useEffect, createContext } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from "firebase/auth";

// 1. Create the context
const AuthContext = createContext();

// 2. Create a custom hook to make it easy to use the context
export function useAuth() {
  return useContext(AuthContext);
}

// 3. Create the Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener is moved from App.js to here.
    // It listens for changes in authentication state.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  // The value object holds what we want to share globally
  const value = {
    user,
    loading,
  };

  // We don't render the rest of the app until the initial auth check is complete
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}