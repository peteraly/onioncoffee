import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAIphKgh86eLCsl-Y4xZ6XeJJ4opmW4ijI",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "onioncoffee-c5fb9.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "onioncoffee-c5fb9",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "onioncoffee-c5fb9.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "503205175895",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:503205175895:web:a058fff71cf50faaae3912",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-GK5V0SEZNR"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Initialize services with error handling
let auth, db, storage, analytics;

try {
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  analytics = getAnalytics(app);

  // Set auth persistence
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error("Auth persistence error:", error);
    });
} catch (error) {
  console.error("Service initialization error:", error);
}

export { app, auth, db, storage, analytics };