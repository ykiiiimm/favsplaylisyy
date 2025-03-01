// Check if Firebase is loaded from CDN before proceeding
if (typeof firebase === 'undefined') {
    console.error("Firebase SDK failed to load. Check your internet connection or Firebase CDN.");
    window.firebase = {};
} else if (!firebase.apps.length) {
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

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth ? firebase.auth() : null;
const db = firebase.firestore ? firebase.firestore() : null;
const storage = firebase.storage ? firebase.storage() : null;
const analytics = firebase.analytics ? firebase.analytics() : null;

// Authentication Functions with Fallback
function loginWithGoogle() {
    if (!auth) {
        console.error("Firebase Auth not available.");
        return Promise.reject(new Error("Firebase Auth not initialized."));
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider);
}

function logout() {
    if (!auth) {
        console.error("Firebase Auth not available.");
        return Promise.reject(new Error("Firebase Auth not initialized."));
    }
    return auth.signOut();
}

function monitorAuthState(callback) {
    if (!auth) {
        console.error("Firebase Auth not available.");
        callback(null); // Fallback: no user
        return;
    }
    auth.onAuthStateChanged(callback);
}

function updateUserProfile(user, profileData) {
    if (!user || !auth) {
        console.error("User or Firebase Auth not available.");
        return Promise.reject(new Error("User or Firebase Auth not initialized."));
    }
    return user.updateProfile(profileData);
}

// Firestore Functions with Fallback
function addDocument(collectionPath, data) {
    if (!db) {
        console.error("Firebase Firestore not available.");
        return Promise.reject(new Error("Firebase Firestore not initialized."));
    }
    return db.collection(collectionPath).add({
        ...data,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

function getDocuments(collectionPath) {
    if (!db) {
        console.error("Firebase Firestore not available.");
        return Promise.reject(new Error("Firebase Firestore not initialized."));
    }
    return db.collection(collectionPath).get();
}

function getWatchlistDocuments(collectionPath) {
    if (!db) {
        console.error("Firebase Firestore not available.");
        return Promise.reject(new Error("Firebase Firestore not initialized."));
    }
    return db.collection(collectionPath).where("watchLater", "==", true).get();
}

function deleteDocument(collectionPath, docId) {
    if (!db) {
        console.error("Firebase Firestore not available.");
        return Promise.reject(new Error("Firebase Firestore not initialized."));
    }
    return db.collection(collectionPath).doc(docId).delete();
}

function updateDocument(collectionPath, docId, data) {
    if (!db) {
        console.error("Firebase Firestore not available.");
        return Promise.reject(new Error("Firebase Firestore not initialized."));
    }
    return db.collection(collectionPath).doc(docId).update(data);
}

function setDocument(collectionPath, docId, data) {
    if (!db) {
        console.error("Firebase Firestore not available.");
        return Promise.reject(new Error("Firebase Firestore not initialized."));
    }
    return db.collection(collectionPath).doc(docId).set(data);
}

// Storage Functions with Fallback
function uploadFile(file, path) {
    if (!storage) {
        console.error("Firebase Storage not available.");
        return Promise.reject(new Error("Firebase Storage not initialized."));
    }
    const storageRef = storage.ref(path);
    return storageRef.put(file).then(() => storageRef.getDownloadURL());
}

function getFileURL(path) {
    if (!storage) {
        console.error("Firebase Storage not available.");
        return Promise.reject(new Error("Firebase Storage not initialized."));
    }
    return storage.ref(path).getDownloadURL();
}

// Analytics Function with Fallback
function trackEvent(eventName, params) {
    if (!analytics) {
        console.warn("Firebase Analytics not available, event not tracked:", eventName, params);
        return;
    }
    analytics.logEvent(eventName, params);
}

// Export functions globally
window.firebaseUtils = {
    loginWithGoogle,
    logout,
    monitorAuthState,
    updateUserProfile,
    addDocument,
    getDocuments,
    getWatchlistDocuments,
    deleteDocument,
    updateDocument,
    setDocument,
    uploadFile,
    getFileURL,
    trackEvent,
    auth,
    db,
    storage,
    analytics
};
