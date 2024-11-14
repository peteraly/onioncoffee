// AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const TEST_USER = {
  uid: 'test-user-5551234567',
  phoneNumber: '5551234567',
  verificationCode: '123456'
};

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTestUser, setIsTestUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleUserData = async (userId, isTest = false) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setIsAdmin(userData.isAdmin || false);
        console.log('User data loaded:', userData);
        return userData;
      } else if (isTest) {
        await setDoc(userRef, { ...TEST_USER, setupComplete: true, isAdmin: false });
        console.log('Test user created in Firestore:', TEST_USER);
        return TEST_USER;
      }
      console.warn('No user data found for ID:', userId);
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('Setting up auth listener...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', { user, isTestUser });
      try {
        const userId = isTestUser ? TEST_USER.phoneNumber : user?.uid;
        const userData = await handleUserData(userId, isTestUser);
        setCurrentUser(userData ? { ...user, ...userData } : null);
        console.log('Current user set:', userData ? { ...user, ...userData } : null);
      } catch (error) {
        console.error('Error in auth state change:', error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isTestUser]);

  const logout = async () => {
    try {
      await signOut(auth);
      setIsTestUser(false);
      console.log('User signed out');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };

  const value = {
    currentUser,
    login: signInWithEmailAndPassword,
    signup: createUserWithEmailAndPassword,
    logout,
    isTestUser,
    isAdmin,
    setIsTestUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
