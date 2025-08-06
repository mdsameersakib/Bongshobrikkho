import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Auth from '../components/Auth';
import { auth, db } from '../services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword
} from "firebase/auth";
import { doc, collection, writeBatch, Timestamp } from 'firebase/firestore';

export default function LoginPage({ user }) {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // This useEffect hook will redirect the user to the dashboard
  // if they are already logged in and somehow land on the login page.
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

      // Note: This uses the simple registration logic. We will upgrade this
      // to handle invitation codes again once the core pages are built.
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
      
      await batch.commit();
      // After a successful registration, the listener in App.js will detect the new user
      // and automatically navigate to the dashboard.
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = async (email, password) => {
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // After a successful login, the listener in App.js will detect the user
      // and automatically navigate to the dashboard.
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