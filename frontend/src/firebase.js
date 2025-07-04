// Firebase config and initialization
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAPLbAAx6L2O5mnKW1DwebQ4kMNP4H5Cow",
    authDomain: "fingery-39905.firebaseapp.com",
    projectId: "fingery-39905",
    storageBucket: "fingery-39905.firebasestorage.app",
    messagingSenderId: "565151032424",
    appId: "1:565151032424:web:2e7b6d9cf1be9e54edc7dd",
    measurementId: "G-0MYK8W1KZ0"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app); 