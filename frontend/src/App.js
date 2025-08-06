import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";

// Core Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FamilyListPage from './pages/FamilyListPage';
import FamilyTreePage from './pages/FamilyTreePage';
import FamilyWallPage from './pages/FamilyWallPage';
import EventsPage from './pages/EventsPage';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener now ONLY handles setting the user state. No more navigation!
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><h1 className="text-2xl font-bold">Loading...</h1></div>;
  }

  return (
    <Routes>
      {/* Public Route: Login Page */}
      <Route path="/login" element={<LoginPage user={user} />} />

      {/* Protected Routes: Main Application */}
      <Route element={<ProtectedRoute user={user} />}>
        <Route path="/" element={<Layout user={user} handleLogout={handleLogout} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="family-list" element={<FamilyListPage />} />
          <Route path="family-tree" element={<FamilyTreePage />} />
          <Route path="family-wall" element={<FamilyWallPage />} />
          <Route path="events" element={<EventsPage />} />
        </Route>
      </Route>
      
      {/* Catch-all to redirect to the correct starting page */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default App;