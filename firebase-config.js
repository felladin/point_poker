// Firebase Configuration for Point Poker
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, set, onDisconnect, update, remove, get } from "firebase/database"; // Import Realtime Database functions
import { getAuth, signInAnonymously } from "firebase/auth"; // Import Auth functions for anonymous sign-in

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1ktyAjm-lvo9CsjcjGCOohrHZ_7PPjhI",
  authDomain: "point-poker-16821.firebaseapp.com",
  databaseURL: "https://point-poker-16821-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "point-poker-16821",
  storageBucket: "point-poker-16821.firebasestorage.app",
  messagingSenderId: "1085661060356",
  appId: "1:1085661060356:web:7e7b6a832a3f236bef0451",
  measurementId: "G-8JTCP05Y47"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app); // Initialize Realtime Database
const auth = getAuth(app); // Initialize Authentication

export { app, analytics, db, auth, ref, set, onDisconnect, update, remove, get, signInAnonymously }; // Export everything needed
