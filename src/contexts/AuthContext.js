import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true); // Set loading to true on auth state change
      setCurrentUser(user);

      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsAdmin(userData.isAdmin === true);
            setSetupComplete(userData.setupComplete === true);
          } else {
            setIsAdmin(false);
            setSetupComplete(false);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setIsAdmin(false);
          setSetupComplete(false);
        }
      } else {
        setIsAdmin(false);
        setSetupComplete(false);
      }
      setLoading(false); // Complete loading after setting user data
    });

    return () => unsubscribe();
  }, []);

  const updateUserStatus = async (userId, updates) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        ...updates,
        lastUpdated: new Date().toISOString()
      });

      // If the current user is updated, sync local state
      if (userId === currentUser?.uid) {
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        setIsAdmin(userData.isAdmin === true);
        setSetupComplete(userData.setupComplete === true);
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
    updateUserStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
