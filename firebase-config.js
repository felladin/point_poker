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

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";
