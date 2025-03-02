// Check if Firebase is loaded
if (typeof firebase === 'undefined') {
    console.error("Firebase SDK not loaded. Please check your internet connection or CDN.");
    window.firebase = {};
} else {
    // Firebase Configuration
    const firebaseConfig = {
        apiKey: "AIzaSyA9L53Yd_EsE4A-KyXifyq4EIuYEvKNZk8",
        authDomain: "ykiiiiiiiiiiiiiiim.firebaseapp.com",
        projectId: "ykiiiiiiiiiiiiiiim",
        storageBucket: "ykiiiiiiiiiiiiiiim.appspot.com",
        messagingSenderId: "1042062383289",
        appId: "1:1042062383289:web:a4f43aa710b06a0f38a368",
        measurementId: "G-KNVLQ0TMB0"
    };

    // Initialize Firebase with error handling
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase initialized successfully");
        }
    } catch (error) {
        console.error("Firebase initialization error:", error);
    }
}

// Get Firebase services
const auth = firebase.auth ? firebase.auth() : null;
const db = firebase.firestore ? firebase.firestore() : null;
const storage = firebase.storage ? firebase.storage() : null;
const analytics = firebase.analytics ? firebase.analytics() : null;

// Authentication Functions with better error handling
const loginWithGoogle = () => {
    if (!auth) {
        return Promise.reject(new Error("Firebase Auth not available"));
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider)
        .catch(error => {
            console.error("Google login error:", error);
            throw error;
        });
};

const logout = () => {
    if (!auth) {
        return Promise.reject(new Error("Firebase Auth not available"));
    }
    return auth.signOut()
        .catch(error => {
            console.error("Logout error:", error);
            throw error;
        });
};

const monitorAuthState = (callback) => {
    if (!auth) {
        console.error("Firebase Auth not available");
        callback(null);
        return;
    }
    return auth.onAuthStateChanged(
        user => callback(user),
        error => console.error("Auth state error:", error)
    );
};

// Export functions
window.firebaseUtils = {
    loginWithGoogle,
    logout,
    monitorAuthState,
    auth,
    db,
    storage,
    analytics,
    // Keep other functions if needed, but simplified for login focus
    addDocument: (path, data) => db ? db.collection(path).add({ ...data, timestamp: firebase.firestore.FieldValue.serverTimestamp() }) : Promise.reject(new Error("Firestore not available")),
    getDocuments: (path) => db ? db.collection(path).get() : Promise.reject(new Error("Firestore not available"))
};
