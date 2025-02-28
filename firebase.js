import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { 
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9L53Yd_EsE4A-KyXifyq4EIuYEvKNZk8",
  authDomain: "ykiiiiiiiiiiiiiiim.firebaseapp.com",
  projectId: "ykiiiiiiiiiiiiiiim",
  storageBucket: "ykiiiiiiiiiiiiiiim.appspot.com",
  messagingSenderId: "1042062383289",
  appId: "1:1042062383289:web:a4f43aa710b06a0f38a368",
  measurementId: "G-KNVLQ0TMB0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Export Firestore functions
export { 
  auth, 
  provider, 
  db,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  signOut 
};

// DOM elements
const loginContainer = document.getElementById('loginContainer');
const mainContent = document.getElementById('mainContent');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loadingScreen = document.getElementById('loadingScreen');

// Improved Google Login with animation
googleLoginBtn.addEventListener('click', () => {
  // Show loading animation while authentication is in progress
  loginContainer.classList.add('logging-in');
  googleLoginBtn.disabled = true;
  googleLoginBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Signing in...';
  
  signInWithPopup(auth, provider)
    .then(() => {
      // The transition to content happens in the auth state listener
    })
    .catch((error) => {
      console.error("Login error:", error);
      // Reset button state on error
      googleLoginBtn.disabled = false;
      googleLoginBtn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google';
      loginContainer.classList.remove('logging-in');
      
      // Show error message
      const errorMsg = document.createElement('p');
      errorMsg.classList.add('login-error');
      errorMsg.textContent = "Login failed. Please try again.";
      loginContainer.querySelector('.login-card').appendChild(errorMsg);
      
      // Remove error message after 3 seconds
      setTimeout(() => {
        errorMsg.remove();
      }, 3000);
    });
});

// Smooth Logout
logoutBtn.addEventListener('click', () => {
  // Add transition class before logout
  mainContent.classList.add('fading-out');
  
  // Wait for animation to complete
  setTimeout(() => {
    signOut(auth)
      .then(() => {
        loginContainer.classList.remove('hidden');
        mainContent.classList.add('hidden');
        mainContent.classList.remove('fading-out');
      })
      .catch((error) => {
        console.error("Logout error:", error);
        mainContent.classList.remove('fading-out');
      });
  }, 300);
});

// Enhanced Auth State Listener
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    loginContainer.classList.add('hidden');
    mainContent.classList.remove('hidden');
    
    // Animate main content entry
    mainContent.classList.add('fadeIn');
    
    // Immediately display content - no need to scroll
    window.scrollTo(0, 0);
    
    // Get user profile data and update UI
    updateUserProfile(user);
  } else {
    // User is signed out
    loginContainer.classList.remove('hidden');
    mainContent.classList.add('hidden');
    mainContent.classList.remove('fadeIn');
    
    // Reset the login button
    if (googleLoginBtn) {
      googleLoginBtn.disabled = false;
      googleLoginBtn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google';
      loginContainer.classList.remove('logging-in');
    }
  }
});

// Function to update user profile elements
async function updateUserProfile(user) {
  // Set user photo in navbar if we add that feature later
  const userPhotoElements = document.querySelectorAll('.user-photo');
  if (userPhotoElements.length > 0) {
    userPhotoElements.forEach(el => {
      el.src = user.photoURL || 'default-profile.png';
    });
  }
  
  // Check if user has profile in Firestore, create default if not
  try {
    const profileRef = doc(db, "users", user.uid, "profile", "profile");
    const profileSnap = await getDocs(collection(db, "users", user.uid, "profile"));
    
    // If no profile exists, create a default one
    if (profileSnap.empty) {
      const defaultProfile = {
        nickname: user.displayName || "User",
        tagline: "Welcome to UR FAV'S!",
        bio: "This is your profile. Click 'Update Profile' to customize it."
      };
      
      await setDoc(profileRef, defaultProfile);
    }
  } catch (error) {
    console.error("Error checking/creating user profile:", error);
  }
}
