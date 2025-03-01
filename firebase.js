// Firebase Core
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";

// Firebase Authentication
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  updateProfile 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

// Firebase Firestore
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Firebase Storage
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

// Firebase Analytics
import { 
  getAnalytics, 
  logEvent 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js";

// Firebase Realtime Database (not used currently, kept for future expansion)
import { 
  getDatabase, 
  ref as dbRef, 
  set, 
  get, 
  onValue 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

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
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);
const realtimeDb = getDatabase(app);

// Authentication Functions
async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error) {
    console.error("Google Login Error:", error);
    throw error;
  }
}

async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
    throw error;
  }
}

function monitorAuthState(callback) {
  return onAuthStateChanged(auth, callback, (error) => console.error("Auth State Error:", error));
}

async function updateUserProfile(user, profileData) {
  try {
    await updateProfile(user, profileData);
  } catch (error) {
    console.error("Profile Update Error:", error);
    throw error;
  }
}

// Firestore Functions
async function addDocument(collectionPath, data) {
  try {
    const docRef = await addDoc(collection(db, collectionPath), { ...data, timestamp: serverTimestamp() });
    return docRef;
  } catch (error) {
    console.error("Add Document Error:", error);
    throw error;
  }
}

async function getDocuments(collectionPath) {
  try {
    const snapshot = await getDocs(collection(db, collectionPath));
    return snapshot;
  } catch (error) {
    console.error("Get Documents Error:", error);
    throw error;
  }
}

async function getWatchlistDocuments(collectionPath) {
  try {
    const q = query(collection(db, collectionPath), where("watchLater", "==", true));
    const snapshot = await getDocs(q);
    return snapshot;
  } catch (error) {
    console.error("Get Watchlist Error:", error);
    throw error;
  }
}

async function deleteDocument(collectionPath, docId) {
  try {
    await deleteDoc(doc(db, collectionPath, docId));
  } catch (error) {
    console.error("Delete Document Error:", error);
    throw error;
  }
}

async function updateDocument(collectionPath, docId, data) {
  try {
    await updateDoc(doc(db, collectionPath, docId), data);
  } catch (error) {
    console.error("Update Document Error:", error);
    throw error;
  }
}

async function setDocument(collectionPath, docId, data) {
  try {
    await setDoc(doc(db, collectionPath, docId), data);
  } catch (error) {
    console.error("Set Document Error:", error);
    throw error;
  }
}

function listenToCollection(collectionPath, callback) {
  return onSnapshot(collection(db, collectionPath), callback, (error) => console.error("Snapshot Error:", error));
}

// Storage Functions
async function uploadFile(file, path) {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Upload File Error:", error);
    throw error;
  }
}

async function deleteFile(path) {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Delete File Error:", error);
    throw error;
  }
}

async function getFileURL(path) {
  try {
    return await getDownloadURL(ref(storage, path));
  } catch (error) {
    console.error("Get File URL Error:", error);
    throw error;
  }
}

// Analytics Functions
function trackEvent(eventName, params) {
  try {
    logEvent(analytics, eventName, params);
  } catch (error) {
    console.error("Analytics Event Error:", error);
  }
}

// Realtime Database Functions (for potential future use)
async function saveRealtimeData(path, data) {
  try {
    await set(dbRef(realtimeDb, path), data);
  } catch (error) {
    console.error("Save Realtime Data Error:", error);
    throw error;
  }
}

async function getRealtimeData(path) {
  try {
    const snapshot = await get(dbRef(realtimeDb, path));
    return snapshot.val();
  } catch (error) {
    console.error("Get Realtime Data Error:", error);
    throw error;
  }
}

function listenRealtimeData(path, callback) {
  return onValue(dbRef(realtimeDb, path), snapshot => callback(snapshot.val()), error => console.error("Realtime Data Error:", error));
}

// Export Everything
export {
  auth, db, storage, analytics, realtimeDb, provider, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, query, where, orderBy, onSnapshot, serverTimestamp,
  signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile, ref, uploadBytes, getDownloadURL, deleteObject, getAnalytics, logEvent, dbRef, set, get, onValue,
  loginWithGoogle, logout, monitorAuthState, updateUserProfile, addDocument, getDocuments, getWatchlistDocuments, deleteDocument, updateDocument, setDocument, listenToCollection,
  uploadFile, deleteFile, getFileURL, trackEvent, saveRealtimeData, getRealtimeData, listenRealtimeData
};
