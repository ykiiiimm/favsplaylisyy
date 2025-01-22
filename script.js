// Firebase Configuration (replace with your actual Firebase config)
var firebaseConfig = {
    apiKey: "AIzaSyA9L53Yd_EsE4A-KyXifyq4EIuYEvKNZk8",
    authDomain: "ykiiiiiiiiiiiiiiim.firebaseapp.com",
    projectId: "ykiiiiiiiiiiiiiiim",
    storageBucket: "ykiiiiiiiiiiiiiiim.firebasestorage.app",
    messagingSenderId: "1042062383289",
    appId: "1:1042062383289:web:a4f43aa710b06a0f38a368",
    measurementId: "G-KNVLQ0TMB0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var auth = firebase.auth();

// Login with Google
function loginWithGoogle() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            var user = result.user;
            updateUserStatus(user.email);
            toggleLoginModal();
        })
        .catch((error) => {
            alert("Error: " + error.message);
        });
}

// Toggle Login Modal
function toggleLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.style.display = modal.style.display === "block" ? "none" : "block";
}

// Close Login Modal
document.getElementById('closeLoginModalBtn').addEventListener('click', () => {
    document.getElementById('loginModal').style.display = 'none';
});

// Logout Function
function logout() {
    firebase.auth().signOut().then(() => {
        updateUserStatus();
    }).catch((error) => {
        alert("Error: " + error.message);
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
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        updateUserStatus(user.email);
    } else {
        updateUserStatus();
    }
});
