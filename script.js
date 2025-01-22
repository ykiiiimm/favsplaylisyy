// Firebase Configuration
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

// Your web app's Firebase configuration
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

// Google Login Function
function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            console.log("User logged in:", user.email);
            updateUserStatus(user.email);
        })
        .catch((error) => {
            console.error("Error during login:", error.message);
        });
}

// Logout Function
function logout() {
    signOut(auth).then(() => {
        console.log("User logged out");
        updateUserStatus();
    }).catch((error) => {
        console.error("Error during logout:", error.message);
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

// Check Authentication State
onAuthStateChanged(auth, (user) => {
    if (user) {
        updateUserStatus(user.email);
    } else {
        updateUserStatus();
    }
});
