// Import the necessary Firebase functions
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

// Firebase configuration
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
const auth = getAuth(app);

// Google Auth provider
const provider = new GoogleAuthProvider();

// Login with Google
function loginWithGoogle() {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            updateUserStatus(user.email);
        })
        .catch((error) => {
            console.error(error.message);
        });
}

// Logout
function logout() {
    signOut(auth).then(() => {
        updateUserStatus();
    }).catch((error) => {
        console.error(error.message);
    });
}

// Update user status (logged in or not)
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

// Monitor authentication state change
onAuthStateChanged(auth, (user) => {
    if (user) {
        updateUserStatus(user.email);
    } else {
        updateUserStatus();
    }
});
