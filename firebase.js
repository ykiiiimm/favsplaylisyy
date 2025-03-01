// Firebase App (core module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";

// Firebase Authentication
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

// Firebase Firestore
import { 
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyA9L53Yd_EsE4A-KyXifyq4EIuYEvKNZk8",
  authDomain: "ykiiiiiiiiiiiiiiim.firebaseapp.com",
  projectId: "ykiiiiiiiiiiiiiiim",
  storageBucket: "ykiiiiiiiiiiiiiiim.appspot.com",
  messagingSenderId: "1042062383289",
  appId: "1:1042062383289:web:a4f43aa710b06a0f38a368",
  measurementId: "G-KNVLQ0TMB0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
const auth = getAuth(app);
const provider = new GoogleAuthProvider(); // For Google Sign-In

// Initialize Firestore
const db = getFirestore(app);

// Export all necessary functions and objects
export { 
  auth, 
  db,
  provider, // Added provider explicitly for clarity
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
};
