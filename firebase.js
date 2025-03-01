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

// Firebase Realtime Database (optional bonus)
import { 
  getDatabase,
  ref as dbRef,
  set,
  get,
  onValue
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

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
const app = initializeApp(firebaseConfig);

// Initialize Services
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);
const realtimeDb = getDatabase(app);

// Authentication Functions
function loginWithGoogle() {
  return signInWithPopup(auth, provider);
}

function logout() {
  return signOut(auth);
}

function monitorAuthState(callback) {
  onAuthStateChanged(auth, callback);
}

function updateUserProfile(user, profileData) {
  return updateProfile(user, profileData);
}

// Firestore Functions
function addDocument(collectionName, data) {
  return addDoc(collection(db, collectionName), { ...data, timestamp: serverTimestamp() });
}

function getDocuments(collectionName) {
  return getDocs(collection(db, collectionName));
}

function deleteDocument(collectionName, docId) {
  return deleteDoc(doc(db, collectionName, docId));
}

function updateDocument(collectionName, docId, data) {
  return updateDoc(doc(db, collectionName, docId), data);
}

function setDocument(collectionName, docId, data) {
  return setDoc(doc(db, collectionName, docId), data);
}

function queryDocuments(collectionName, field, operator, value) {
  return getDocs(query(collection(db, collectionName), where(field, operator, value)));
}

function listenToCollection(collectionName, callback) {
  return onSnapshot(collection(db, collectionName), callback);
}

// Storage Functions
function uploadFile(file, path) {
  const storageRef = ref(storage, path);
  return uploadBytes(storageRef, file).then(() => getDownloadURL(storageRef));
}

function deleteFile(path) {
  const storageRef = ref(storage, path);
  return deleteObject(storageRef);
}

function getFileURL(path) {
  return getDownloadURL(ref(storage, path));
}

// Analytics Functions
function trackEvent(eventName, params) {
  logEvent(analytics, eventName, params);
}

// Realtime Database Functions
function saveRealtimeData(path, data) {
  return set(dbRef(realtimeDb, path), data);
}

function getRealtimeData(path) {
  return get(dbRef(realtimeDb, path));
}

function listenRealtimeData(path, callback) {
  return onValue(dbRef(realtimeDb, path), callback);
}

// Export Everything
export {
  auth,
  db,
  storage,
  analytics,
  realtimeDb,
  provider,
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
  serverTimestamp,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getAnalytics,
  logEvent,
  dbRef,
  set,
  get,
  onValue,
  // Custom Functions
  loginWithGoogle,
  logout,
  monitorAuthState,
  updateUserProfile,
  addDocument,
  getDocuments,
  deleteDocument,
  updateDocument,
  setDocument,
  queryDocuments,
  listenToCollection,
  uploadFile,
  deleteFile,
  getFileURL,
  trackEvent,
  saveRealtimeData,
  getRealtimeData,
  listenRealtimeData
};
