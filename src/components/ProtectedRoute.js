// ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, adminRequired = false }) => {
  const { currentUser, isAdmin, loading, setupComplete, isTestUser } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!currentUser && !isTestUser) {
    return <Navigate to="/login" replace />;
  }

  if (adminRequired && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!setupComplete && !isTestUser) {
    return <Navigate to="/setup-profile" replace />;
  }

  return children;
};

export default ProtectedRoute;
