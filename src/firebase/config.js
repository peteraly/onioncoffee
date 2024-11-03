import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
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

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Set auth persistence
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Auth persistence error:", error);
  });

export { app, auth, db, storage, analytics };