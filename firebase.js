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
    try {
        firebase.initializeApp(firebaseConfig);
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
}

const auth = firebase.auth ? firebase.auth() : null;
const db = firebase.firestore ? firebase.firestore() : null;
const storage = firebase.storage ? firebase.storage() : null;
const analytics = firebase.analytics ? firebase.analytics() : null;

// Authentication Functions
const loginWithGoogle = () => auth ? auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()) : Promise.reject(new Error("Auth not available"));
const logout = () => auth ? auth.signOut() : Promise.reject(new Error("Auth not available"));
const monitorAuthState = (callback) => auth ? auth.onAuthStateChanged(callback) : callback(null);
const updateUserProfile = (user, profileData) => user && auth ? user.updateProfile(profileData) : Promise.reject(new Error("User or Auth not available"));

// Firestore Functions
const addDocument = (collectionPath, data) => db ? db.collection(collectionPath).add({ ...data, timestamp: firebase.firestore.FieldValue.serverTimestamp() }) : Promise.reject(new Error("Firestore not available"));
const getDocuments = (collectionPath) => db ? db.collection(collectionPath).get() : Promise.reject(new Error("Firestore not available"));
const getWatchlistDocuments = (collectionPath) => db ? db.collection(collectionPath).where("watchLater", "==", true).get() : Promise.reject(new Error("Firestore not available"));
const deleteDocument = (collectionPath, docId) => db ? db.collection(collectionPath).doc(docId).delete() : Promise.reject(new Error("Firestore not available"));
const updateDocument = (collectionPath, docId, data) => db ? db.collection(collectionPath).doc(docId).update(data) : Promise.reject(new Error("Firestore not available"));
const setDocument = (collectionPath, docId, data) => db ? db.collection(collectionPath).doc(docId).set(data) : Promise.reject(new Error("Firestore not available"));

// Storage Functions
const uploadFile = (file, path) => storage ? storage.ref(path).put(file).then(() => storage.ref(path).getDownloadURL()) : Promise.reject(new Error("Storage not available"));
const getFileURL = (path) => storage ? storage.ref(path).getDownloadURL() : Promise.reject(new Error("Storage not available"));

// Analytics Function
const trackEvent = (eventName, params) => analytics ? analytics.logEvent(eventName, params) : console.warn("Analytics not available:", eventName, params);

// Export functions
window.firebaseUtils = {
    loginWithGoogle, logout, monitorAuthState, updateUserProfile,
    addDocument, getDocuments, getWatchlistDocuments, deleteDocument,
    updateDocument, setDocument, uploadFile, getFileURL, trackEvent,
    auth, db, storage, analytics
};
