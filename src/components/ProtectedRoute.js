import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, adminRequired = false }) => {
  const { currentUser, isAdmin, loading, setupComplete } = useAuth();

  // Loading state: show a loading spinner or placeholder
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If admin access is required and user is not an admin, redirect to user dashboard
  if (adminRequired && !isAdmin) {
    console.log('Admin access denied. User is not admin.');
    return <Navigate to="/dashboard" replace />;
  }

  // If user has not completed setup, redirect to setup page
  if (!setupComplete) {
    return <Navigate to="/setup" replace />;
  }

  // If all checks pass, render the children (protected component)
  return children;
};

export default ProtectedRoute;
