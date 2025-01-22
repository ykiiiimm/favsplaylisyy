// Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";

// Your Firebase configuration (use your actual Firebase credentials here)
const firebaseConfig = {
  apiKey: "AIzaSyA9L53Yd_EsE4A-KyXifyq4EIuYEvKNZk8",
  authDomain: "ykiiiiiiiiiiiiiiim.firebaseapp.com",
  projectId: "ykiiiiiiiiiiiiiiim",
  storageBucket: "ykiiiiiiiiiiiiiiim.firebasestorage.app",
  messagingSenderId: "1042062383289",
  appId: "1:1042062383289:web:a4f43aa710b06a0f38a368",
  measurementId: "G-KNVLQ0TMB0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Google Sign-In Function
function loginWithGoogle() {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            updateUserStatus(user.email);  // Update user info
        })
        .catch((error) => {
            alert("Error: " + error.message);  // Show error if something goes wrong
        });
}

// Logout Function
function logout() {
    signOut(auth)
        .then(() => {
            updateUserStatus();  // Update status when logged out
        })
        .catch((error) => {
            alert("Error: " + error.message);  // Show error if something goes wrong
        });
}

// Update User Status
function updateUserStatus(userEmail) {
    const userStatus = document.getElementById('user-status');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (userEmail) {
        userStatus.textContent = `Logged in as ${userEmail}`;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        userStatus.textContent = 'Not logged in';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
}

// Listen for Auth State Changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        updateUserStatus(user.email);
    } else {
        updateUserStatus();
    }
});
