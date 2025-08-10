import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Auth from '../components/Auth';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser } from '../services/authService';
// Accent & dark mode not used on auth page anymore

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
    <div className="min-h-screen flex items-center justify-center px-6 py-10 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/Logo512.png" alt="BongshoBrikkho" className="h-40 w-40 object-contain mb-4 drop-shadow-sm" />
          <h1 className="text-3xl font-semibold tracking-tight text-slate-800">BongshoBrikkho</h1>
          <p className="mt-2 text-sm text-slate-600 text-center max-w-xs">Build and preserve your family connections in one simple place.</p>
        </div>
        <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl shadow-sm px-6 py-7">
          <Auth
            handleLogin={handleLogin}
            handleRegister={handleRegister}
            error={error}
            loading={loading}
          />
        </div>
        <p className="mt-8 text-[10px] text-center text-slate-400">© {new Date().getFullYear()} BongshoBrikkho</p>
      </div>
    </div>
  );
}