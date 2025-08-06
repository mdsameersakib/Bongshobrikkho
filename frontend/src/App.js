import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from './services/firebase';
import { useAuth } from './context/AuthContext'; // <-- Import the useAuth hook

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
  // Get user and loading state from our new context
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><h1 className="text-2xl font-bold">Loading...</h1></div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute user={user} />}>
        <Route path="/" element={<Layout handleLogout={handleLogout} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="family-list" element={<FamilyListPage />} />
          <Route path="family-tree" element={<FamilyTreePage />} />
          <Route path="family-wall" element={<FamilyWallPage />} />
          <Route path="events" element={<EventsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default App;