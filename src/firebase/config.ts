// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAuf--i7MGKhUwvuiDXY0xqyIIyiuZEMGE",
  authDomain: "stageplanner-b5387.firebaseapp.com",
  projectId: "stageplanner-b5387",
  storageBucket: "stageplanner-b5387.firebasestorage.app",
  messagingSenderId: "383303649408",
  appId: "1:383303649408:web:6e22b0437de3c9507c3e65",
  measurementId: "G-QPZ1ECSVJF",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
