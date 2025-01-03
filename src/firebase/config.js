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

// Disable app verification when testing locally
if (window.location.hostname === 'localhost') {
  auth.settings.appVerificationDisabledForTesting = true;
}

const initializeEmulators = async () => {
  if (window.location.hostname === 'localhost') {
    try {
      console.log('Connecting to Firebase emulators...');
      connectAuthEmulator(auth, 'http://localhost:9098', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8081);
      connectStorageEmulator(storage, 'localhost', 9198);

      try {
        await enableIndexedDbPersistence(db);
      } catch (err) {
        if (err.code === 'failed-precondition') {
          console.warn('Persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The browser does not support persistence.');
        }
      }

      console.log('Connected to all emulators');
    } catch (error) {
      console.error('Error connecting to emulators:', error);
    }
  }
};

initializeEmulators();

export { auth, db, storage };
