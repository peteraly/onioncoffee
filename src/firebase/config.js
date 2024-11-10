// firebase/config.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';  // Import Firebase Storage

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

// Initialize Firebase Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Storage
const storage = getStorage(app);  // Initialize Firebase Storage

export { auth, db, storage };  // Export storage along with auth and db
