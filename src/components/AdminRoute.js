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

  // Show loading indicator until authentication check is complete
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if no user is detected
  if (!currentUser) {
    console.log('AdminRoute: No user detected, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if user is authenticated but not an admin
  if (!isAdmin) {
    console.log('AdminRoute: Access denied, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // If admin access is granted, render the child components
  return children;
};

export default AdminRoute;
