// Firebase Configuration for Point Poker
//
// To enable multiplayer sessions, set up a Firebase project:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or use an existing one)
// 3. Add a web app to your project
// 4. Copy your firebaseConfig values into the object below
// 5. Enable Realtime Database in your Firebase project
// 6. Set the database rules to allow read/write access:
//    {
//      "rules": {
//        "sessions": {
//          "$sessionId": {
//            ".read": true,
//            ".write": true
//          }
//        }
//      }
//    }
//
//    For production use, consider adding Firebase Authentication and
//    restricting writes to authenticated users only.
//
// Until Firebase is configured, the app works in local (single-player) mode.
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1ktyAjm-lvo9CsjcjGCOohrHZ_7PPjhI",
  authDomain: "point-poker-16821.firebaseapp.com",
  projectId: "point-poker-16821",
  storageBucket: "point-poker-16821.firebasestorage.app",
  messagingSenderId: "1085661060356",
  appId: "1:1085661060356:web:7e7b6a832a3f236bef0451",
  measurementId: "G-8JTCP05Y47"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";
