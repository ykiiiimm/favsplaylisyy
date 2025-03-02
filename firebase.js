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
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Failed to initialize Firebase:", error);
}

// Firebase Services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Authentication Functions
function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider)
        .then(result => {
            console.log("Logged in as:", result.user.displayName);
            return result.user;
        })
        .catch(error => {
            console.error("Login error:", error.message);
            throw error;
        });
}

function logout() {
    return auth.signOut()
        .then(() => console.log("Logged out successfully"))
        .catch(error => {
            console.error("Logout error:", error.message);
            throw error;
        });
}

function monitorAuthState(callback) {
    auth.onAuthStateChanged(
        user => callback(user),
        error => console.error("Auth state error:", error)
    );
}

function updateUserProfile(user, profileData) {
    return user.updateProfile(profileData)
        .catch(error => console.error("Profile update error:", error));
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
    auth,
    db,
    storage
};
