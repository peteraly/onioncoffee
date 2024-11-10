import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const setupTestUser = async () => {
  try {
    const db = getFirestore();
    
    // Create test user document
    await setDoc(doc(db, 'users', 'test-user-id'), {
      firstName: "Test User",
      phoneNumber: "+15551234567",
      age: "25",
      gender: "Not specified",
      interestedIn: "Not specified",
      bio: "This is a test user account",
      setupComplete: true,
      isAdmin: false,
      profilePhoto: "",
      photos: [],
      groupIds: [],
      coffeeAdded: [],
      createdAt: new Date(),
      lastUpdated: new Date()
    });

    console.log('Test user setup complete!');
  } catch (error) {
    console.error('Error setting up test user:', error);
  }
};

setupTestUser();