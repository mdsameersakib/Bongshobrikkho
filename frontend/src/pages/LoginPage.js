import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Auth from '../components/Auth';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser } from '../services/authService';

export default function LoginPage() {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // --- UPDATED: Accepts userDetails object ---
  const handleRegister = async (email, password, invitationCode, userDetails) => {
    setError('');
    setLoading(true);
    try {
      // Pass the new details to the service function
      await registerUser(email, password, invitationCode, userDetails);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      await loginUser(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 w-full max-w-md">
        <h1 className="text-4xl font-bold text-teal-700 text-center mb-8">
          BongshoBrikkho
        </h1>
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <Auth
            handleLogin={handleLogin}
            handleRegister={handleRegister}
            error={error}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}