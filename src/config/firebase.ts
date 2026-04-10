import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAwNKqSzCc9J1tU6bDg8klZZ4T_JJe1z6s",
  authDomain: "sikunirvibes-cdee5.firebaseapp.com",
  projectId: "sikunirvibes-cdee5",
  storageBucket: "sikunirvibes-cdee5.firebasestorage.app",
  messagingSenderId: "477946732265",
  appId: "1:477946732265:web:39a36eec991f3caf9b5a78",
  measurementId: "G-HWY0CH72N7"
};

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
