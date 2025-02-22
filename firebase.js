import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { 
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9L53Yd_EsE4A-KyXifyq4EIuYEvKNZk8",
  authDomain: "ykiiiiiiiiiiiiiiim.firebaseapp.com",
  projectId: "ykiiiiiiiiiiiiiiim",
  storageBucket: "ykiiiiiiiiiiiiiiim.appspot.com",
  messagingSenderId: "1042062383289",
  appId: "1:1042062383289:web:a4f43aa710b06a0f38a368",
  measurementId: "G-KNVLQ0TMB0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Export Firestore functions
export { 
  auth, 
  provider, 
  db,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  signOut 
};

// Login/Logout Logic
const loginContainer = document.getElementById('loginContainer');
const mainContent = document.getElementById('mainContent');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Google Login
googleLoginBtn.addEventListener('click', () => {
  signInWithPopup(auth, provider)
    .then(() => {
      loginContainer.classList.add('hidden');
      mainContent.classList.remove('hidden');
    })
    .catch((error) => {
      console.error("Login error:", error);
    });
});

// Logout
logoutBtn.addEventListener('click', () => {
  signOut(auth)
    .then(() => {
      loginContainer.classList.remove('hidden');
      mainContent.classList.add('hidden');
    })
    .catch((error) => {
      console.error("Logout error:", error);
    });
});

// Auth State Listener
auth.onAuthStateChanged((user) => {
  if (user) {
    loginContainer.classList.add('hidden');
    mainContent.classList.remove('hidden');
  } else {
    loginContainer.classList.remove('hidden');
    mainContent.classList.add('hidden');
  }
});
