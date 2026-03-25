import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - Replace with your own config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA5thj2pfkRZTORF8xPV29k4jW7mIG5AWo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "codelancer-50fb7.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "codelancer-50fb7",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "codelancer-50fb7.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "418641356904",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:418641356904:web:62bfb857d44bdc800b73dd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
