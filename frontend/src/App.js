import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from './services/firebase';
import { useAuth } from './context/AuthContext'; // <-- Import the useAuth hook

// Core Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { LoadingPage } from './components/Skeletons';
import PerformanceMonitor from './components/PerformanceMonitor';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const FamilyListPage = lazy(() => import('./pages/FamilyListPage'));
const FamilyTreePage = lazy(() => import('./pages/FamilyTreePage'));
const FamilyWallPage = lazy(() => import('./pages/FamilyWallPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function App() {
  // Get user and loading state from our new context
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <LoadingPage message="Initializing app..." />;
  }

  return (
    <Suspense fallback={<LoadingPage message="Loading page..." />}>
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
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
      <PerformanceMonitor />
    </Suspense>
  );
}

export default App;