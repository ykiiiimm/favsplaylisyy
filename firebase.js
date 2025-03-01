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

// Initialize Firebase only if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const analytics = firebase.analytics();

// Authentication Functions
function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider);
}

function logout() {
    return auth.signOut();
}

function monitorAuthState(callback) {
    auth.onAuthStateChanged(callback);
}

function updateUserProfile(user, profileData) {
    return user.updateProfile(profileData);
}

// Firestore Functions
function addDocument(collectionPath, data) {
    return db.collection(collectionPath).add({
        ...data,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

function getDocuments(collectionPath) {
    return db.collection(collectionPath).get();
}

function getWatchlistDocuments(collectionPath) {
    return db.collection(collectionPath).where("watchLater", "==", true).get();
}

function deleteDocument(collectionPath, docId) {
    return db.collection(collectionPath).doc(docId).delete();
}

function updateDocument(collectionPath, docId, data) {
    return db.collection(collectionPath).doc(docId).update(data);
}

function setDocument(collectionPath, docId, data) {
    return db.collection(collectionPath).doc(docId).set(data);
}

// Storage Functions
function uploadFile(file, path) {
    const storageRef = storage.ref(path);
    return storageRef.put(file).then(() => storageRef.getDownloadURL());
}

function getFileURL(path) {
    return storage.ref(path).getDownloadURL();
}

// Analytics Function (Optional, can skip if blocked by extensions)
function trackEvent(eventName, params) {
    if (analytics && analytics.logEvent) {
        analytics.logEvent(eventName, params);
    } else {
        console.warn("Analytics not available, event not tracked:", eventName, params);
    }
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
