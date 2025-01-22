// Toggle Login Modal
function toggleLoginModal() {
  const modal = document.getElementById('loginModal');
  modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

// Close Login Modal
document.getElementById('closeLoginModalBtn').addEventListener('click', () => {
  document.getElementById('loginModal').style.display = 'none';
});

// Login with Google
function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();

  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      updateUserStatus(user.email);
      toggleLoginModal();
    })
    .catch((error) => {
      alert(`Login Failed: ${error.message}`);
    });
}

// Logout Function
function logout() {
  firebase.auth().signOut()
    .then(() => {
      updateUserStatus(null);
    })
    .catch((error) => {
      alert(`Logout Failed: ${error.message}`);
    });
}

// Update User Status
function updateUserStatus(email) {
  const userStatus = document.getElementById('user-status');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (email) {
    userStatus.textContent = `Logged in as ${email}`;
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
  } else {
    userStatus.textContent = 'Not logged in';
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
  }
}

// Check Firebase Authentication State
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    updateUserStatus(user.email);
  } else {
    updateUserStatus(null);
  }
});
