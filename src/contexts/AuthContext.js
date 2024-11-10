// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase/config';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  limit 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

// Create AuthContext
const AuthContext = createContext();

// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [isTestUser, setIsTestUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Signup function
  const signup = (email, password) => createUserWithEmailAndPassword(auth, email, password);

  // Login function
  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  // Logout function
  const logout = () => signOut(auth);

  // Listen for auth state changes and set `setupComplete`, `isTestUser`, and `isAdmin`
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setSetupComplete(userData.setupComplete || false);
            setIsTestUser(userData.isTestUser || false);
            setIsAdmin(userData.isAdmin || false);
            console.log('AuthContext - User data:', userData);
          }
        } catch (error) {
          console.error('Error fetching user setup status:', error);
        }
      } else {
        // Reset states if no user
        setSetupComplete(false);
        setIsTestUser(false);
        setIsAdmin(false);
        console.log('AuthContext - No user authenticated');
      }
    });

    return unsubscribe;
  }, []);

  // Debugging console logs for each state to trace conditional routing
  useEffect(() => {
    console.log("AuthContext Debug:", {
      currentUser,
      setupComplete,
      isTestUser,
      isAdmin,
      loading,
    });
  }, [currentUser, setupComplete, isTestUser, isAdmin, loading]);

  // Context value
  const value = {
    currentUser,
    login,
    signup,
    logout,
    setupComplete,
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

// DashboardAPI for Firestore and Storage interactions
export const DashboardAPI = {
  async fetchUser(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user data');
    }
  },

  async fetchDateDetails(userId) {
    try {
      const dateRef = doc(db, 'dates', userId);
      const dateDoc = await getDoc(dateRef);
      return dateDoc.exists() ? dateDoc.data() : null;
    } catch (error) {
      console.error('Error fetching date details:', error);
      throw new Error('Failed to fetch date details');
    }
  },

  async fetchProfiles(currentUserId, limitCount = 10) {
    try {
      const profilesRef = collection(db, 'users');
      const profilesQuery = query(
        profilesRef,
        where('setupComplete', '==', true),
        limit(limitCount)
      );
      const snapshot = await getDocs(profilesQuery);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(profile => profile.id !== currentUserId);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      throw new Error('Failed to fetch profiles');
    }
  },

  async updateProfile(userId, updates) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        lastUpdated: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  },

  async uploadPhoto(userId, file) {
    try {
      const photoRef = ref(storage, `profilePhotos/${userId}`);
      await uploadBytes(photoRef, file);
      return await getDownloadURL(photoRef);
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw new Error('Failed to upload photo');
    }
  },

  async sendCoffee(senderData, receiverId) {
    try {
      const receiverRef = doc(db, 'users', receiverId);
      const receiverDoc = await getDoc(receiverRef);

      if (!receiverDoc.exists()) {
        throw new Error('Receiver not found');
      }

      const receiverData = receiverDoc.data();

      // Update receiver's coffee list
      await updateDoc(receiverRef, {
        coffeeAdded: [...(receiverData.coffeeAdded || []), senderData.phoneNumber]
      });

      // Record interaction
      await addDoc(collection(db, 'coffeeInteractions'), {
        sender: senderData.phoneNumber,
        receiver: receiverData.phoneNumber,
        timestamp: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error sending coffee:', error);
      throw new Error('Failed to send coffee');
    }
  },

  async checkMutualMatch(user1Phone, user2Phone) {
    try {
      const interactionsRef = collection(db, 'coffeeInteractions');
      const q1 = query(
        interactionsRef,
        where('sender', '==', user1Phone),
        where('receiver', '==', user2Phone)
      );
      const q2 = query(
        interactionsRef,
        where('sender', '==', user2Phone),
        where('receiver', '==', user1Phone)
      );

      const [sent, received] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      return !sent.empty && !received.empty;
    } catch (error) {
      console.error('Error checking mutual match:', error);
      throw new Error('Failed to check mutual match');
    }
  }
};
