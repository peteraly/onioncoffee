import { db, storage } from '../firebase/config';
import { 
  doc, getDoc, collection, query, where, getDocs,
  updateDoc, addDoc, serverTimestamp, limit 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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