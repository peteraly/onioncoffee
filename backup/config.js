import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAIphKgh86eLCsl-Y4xZ6XeJJ4opmW4ijI",
  authDomain: "onioncoffee-c5fb9.firebaseapp.com",
  projectId: "onioncoffee-c5fb9",
  storageBucket: "onioncoffee-c5fb9.appspot.com",
  messagingSenderId: "503205175895",
  appId: "1:503205175895:web:a058fff71cf50faaae3912",
  measurementId: "G-GK5V0SEZNR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const initializeEmulators = async () => {
  if (window.location.hostname === 'localhost') {
    try {
      console.log('Setting up Firebase emulators...');
      
      // Connect to Auth emulator
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      
      // Connect to Firestore emulator
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      
      // Connect to Storage emulator
      connectStorageEmulator(storage, '127.0.0.1', 9199);
      
      // Enable offline persistence
      await enableIndexedDbPersistence(db);
      
      console.log('Successfully connected to all emulators');
    } catch (error) {
      console.error('Error initializing emulators:', error);
    }
  }
};

// Initialize emulators
initializeEmulators();

export { auth, db, storage };