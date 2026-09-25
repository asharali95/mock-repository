// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAFcMuHXb83-zfm_2JrRYIu7CUYN2169I0",
  authDomain: "prepwise-16446.firebaseapp.com",
  projectId: "prepwise-16446",
  storageBucket: "prepwise-16446.firebasestorage.app",
  messagingSenderId: "192942313203",
  appId: "1:192942313203:web:5edefb36e960ffacaf7186",
  measurementId: "G-7P6EYDNHN3"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

