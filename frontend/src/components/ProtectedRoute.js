import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ user }) => {
  if (!user) {
    // If no user is logged in, redirect to the /login page
    return <Navigate to="/login" replace />;
  }

  // If a user is logged in, render the child page (e.g., Dashboard, Family List)
  return <Outlet />;
};

export default ProtectedRoute;