// Import necessary Firebase SDK modules
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
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
