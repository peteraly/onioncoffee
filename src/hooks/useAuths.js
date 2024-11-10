import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const auth = getAuth();
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTestUser, setIsTestUser] = useState(false);

  useEffect(() => {
    setLoading(true);
  
    // Using the observer pattern directly from auth
    const unsubscribe = auth.onAuthStateChanged?.(async (user) => {
      try {
        console.log('Auth state changed:', { user, isTestUser });
  
        if (user || isTestUser) {
          const userId = isTestUser ? 'test-user-id' : user?.uid;
          const userDocRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userDocRef);
  
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser(isTestUser ? { uid: userId, ...userData } : user);
            setIsAdmin(userData.isAdmin === true);
            setSetupComplete(userData.setupComplete === true);
          } else {
            setCurrentUser(isTestUser ? { uid: userId } : user);
            setIsAdmin(false);
            setSetupComplete(false);
          }
        } else {
          setCurrentUser(null);
          setIsAdmin(false);
          setSetupComplete(false);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setCurrentUser(null);
        setIsAdmin(false);
        setSetupComplete(false);
      } finally {
        console.log('Loading finished:', loading);
        setLoading(false);
      }
    });
  
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [loading]); // Add loading to the dependency array

  const updateUserStatus = async (userId, updates) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        ...updates,
        lastUpdated: new Date().toISOString()
      });

      if (userId === currentUser?.uid) {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.isAdmin === true);
          setSetupComplete(userData.setupComplete === true);
        }
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    isAdmin,
    setupComplete,
    loading,
    isTestUser,
    setIsTestUser,
    updateUserStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;