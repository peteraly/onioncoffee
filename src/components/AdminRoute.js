import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();

  useEffect(() => {
    console.log('AdminRoute Debug:', {
      currentUser: currentUser?.uid,
      isAdmin,
      loading
    });
  }, [currentUser, isAdmin, loading]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    console.log('AdminRoute: No user detected, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    console.log('AdminRoute: Access denied, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;