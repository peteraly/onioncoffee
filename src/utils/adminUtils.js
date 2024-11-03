// src/utils/adminUtils.js
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Updates the admin status for a specified user
 * @param {string} userId - The Firebase UID of the user
 * @param {boolean} isAdmin - The admin status to set
 * @returns {Promise<boolean>} - Success status of the operation
 */
export const setAdminStatus = async (userId, isAdmin) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Verify user exists before updating
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      console.error('User document does not exist:', userId);
      return false;
    }

    await updateDoc(userRef, {
      isAdmin: isAdmin,
      lastUpdated: new Date().toISOString()
    });
    
    console.log(`Admin status ${isAdmin ? 'granted' : 'revoked'} for user:`, userId);
    return true;
  } catch (error) {
    console.error('Error updating admin status:', error);
    return false;
  }
};

/**
 * Checks if a user has admin status
 * @param {string} userId - The Firebase UID of the user
 * @returns {Promise<boolean>} - Whether the user has admin status
 */
export const checkAdminStatus = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('User document does not exist:', userId);
      return false;
    }

    const userData = userSnap.data();
    return userData.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Verifies and repairs admin status if needed
 * @param {string} userId - The Firebase UID of the user
 * @returns {Promise<boolean>} - Success status of the verification/repair
 */
export const verifyAndRepairAdminStatus = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('User document does not exist:', userId);
      return false;
    }

    const userData = userSnap.data();
    
    // For the specific admin user
    if (userId === 'TltkIE6753eW70LE2NZFNCW0km73' && 
        userData.phoneNumber === '+17194914511') {
      
      if (!userData.isAdmin) {
        await updateDoc(userRef, {
          isAdmin: true,
          lastUpdated: new Date().toISOString()
        });
        console.log('Admin status repaired for user:', userId);
      }
      return true;
    }
    
    return userData.isAdmin === true;
  } catch (error) {
    console.error('Error in admin status verification:', error);
    return false;
  }
};