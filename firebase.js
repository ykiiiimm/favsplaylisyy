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
let firebaseApp;
try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Failed to initialize Firebase:", error);
    throw error;
}

// Firebase Services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Authentication Functions
async function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        console.log("Logged in as:", result.user.displayName);
        return result.user;
    } catch (error) {
        console.error("Login error:", error.message);
        throw error;
    }
}

async function logout() {
    try {
        await auth.signOut();
        console.log("Logged out successfully");
    } catch (error) {
        console.error("Logout error:", error.message);
        throw error;
    }
}

function monitorAuthState(callback) {
    return auth.onAuthStateChanged(
        user => callback(user),
        error => console.error("Auth state error:", error)
    );
}

async function updateUserProfile(user, profileData) {
    try {
        await user.updateProfile(profileData);
    } catch (error) {
        console.error("Profile update error:", error);
        throw error;
    }
}

// Firestore Functions
async function addDocument(collectionPath, data) {
    try {
        return await db.collection(collectionPath).add({
            ...data,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("Add document error:", error);
        throw error;
    }
}

async function getDocuments(collectionPath) {
    try {
        return await db.collection(collectionPath).get();
    } catch (error) {
        console.error("Get documents error:", error);
        throw error;
    }
}

async function getWatchlistDocuments(collectionPath) {
    try {
        return await db.collection(collectionPath).where("watchLater", "==", true).get();
    } catch (error) {
        console.error("Get watchlist error:", error);
        throw error;
    }
}

async function deleteDocument(collectionPath, docId) {
    try {
        return await db.collection(collectionPath).doc(docId).delete();
    } catch (error) {
        console.error("Delete document error:", error);
        throw error;
    }
}

async function updateDocument(collectionPath, docId, data) {
    try {
        return await db.collection(collectionPath).doc(docId).update(data);
    } catch (error) {
        console.error("Update document error:", error);
        throw error;
    }
}

async function setDocument(collectionPath, docId, data) {
    try {
        return await db.collection(collectionPath).doc(docId).set(data);
    } catch (error) {
        console.error("Set document error:", error);
        throw error;
    }
}

// Storage Functions
async function uploadFile(file, path) {
    try {
        const storageRef = storage.ref(path);
        await storageRef.put(file);
        return await storageRef.getDownloadURL();
    } catch (error) {
        console.error("Upload file error:", error);
        throw error;
    }
}

// Export functions
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
