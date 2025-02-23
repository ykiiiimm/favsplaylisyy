import { auth, db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, signOut } from './firebase.js';

const TMDB_API_KEY = "0b1121a7a8eda7a6ecc7fdfa631ad27a";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";

// DOM references
const openModalBtn = document.getElementById('openModalBtn');
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('closeModalBtn');
const submitBtn = document.getElementById('submitBtn');
const cardContainer = document.getElementById('card-container');
const titleInput = document.getElementById('title');
const contentTypeSelect = document.getElementById('content-type');
const seasonInput = document.getElementById('season');
const fetchTmdbBtn = document.getElementById('fetchTmdbBtn');
const tmdbPreview = document.getElementById('tmdbPreview');
const clearPreviewBtn = document.getElementById('clearPreviewBtn');
const searchInput = document.getElementById('searchInput');

// Detail modal
const detailModal = document.getElementById('detailModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const detailPoster = document.getElementById('detailPoster');
const detailTitle = document.getElementById('detailTitle');
const detailOverview = document.getElementById('detailOverview');
const detailRating = document.getElementById('detailRating');
const detailRelease = document.getElementById('detailRelease');

// Profile modal
const profileBtn = document.getElementById('profileBtn');
const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const profilePhoto = document.getElementById('profilePhoto');
const profileNicknameDisplay = document.getElementById('profileNicknameDisplay');
const profileTaglineDisplay = document.getElementById('profileTaglineDisplay');
const profileBioDisplay = document.getElementById('profileBioDisplay');
const profilePicInput = document.getElementById('profilePicInput');
const profileNickname = document.getElementById('profileNickname');
const profileTagline = document.getElementById('profileTagline');
const profileBio = document.getElementById('profileBio');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const toggleContactBtn = document.getElementById('toggleContactBtn');
const contactInfo = document.getElementById('contactInfo');

let selectedTMDBData = null;

// Show/hide season input
contentTypeSelect.addEventListener('change', () => {
  seasonInput.style.display = (contentTypeSelect.value === 'tv') ? 'block' : 'none';
});

// Profile modal open
profileBtn.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (user) {
    // Basic photo from Firebase Auth
    profilePhoto.src = user.photoURL || 'default-profile.png';
    // Attempt to load profile data from Firestore
    const profileCollectionRef = collection(db, "users", user.uid, "profile");
    const profileSnap = await getDocs(profileCollectionRef);
    let profileData;
    profileSnap.forEach(docSnap => {
      profileData = docSnap.data();
    });
    profileNicknameDisplay.textContent = (profileData && profileData.nickname) || user.displayName || "Anonymous";
    profileTaglineDisplay.textContent = (profileData && profileData.tagline) || "Your tagline here";
    profileBioDisplay.textContent = (profileData && profileData.bio) || "Write a short bio about yourself...";
    profileModal.classList.add('open');
  }
});

// Close profile modal
closeProfileModal.addEventListener('click', () => profileModal.classList.remove('open'));

// Toggle contact info
toggleContactBtn.addEventListener('click', () => {
  contactInfo.classList.toggle('hidden');
});

// Auth state
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    loadCards();
  } else {
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('mainContent').classList.add('hidden');
  }
});

// TMDB
async function fetchTMDBResults(title, type) {
  let searchUrl = '';
  if (type === 'movie') {
    searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
  } else {
    searchUrl = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
  }
  try {
    const res = await fetch(searchUrl);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching TMDB:", error);
    return [];
  }
}

function displayTMDBOptions(results) {
  tmdbPreview.innerHTML = "";
  if (results.length === 0) {
    tmdbPreview.textContent = "No results found.";
    return;
  }
  const container = document.createElement('div');
  container.classList.add('tmdb-options');
  results.forEach(result => {
    const option = document.createElement('div');
    option.classList.add('tmdb-option');
    const name = result.title || result.name;
    const year = (result.release_date || result.first_air_date || '').substring(0, 4);
    const posterPath = result.poster_path ? TMDB_IMG_BASE + result.poster_path : '';
    option.innerHTML = `
      <img src="${posterPath}" alt="${name}">
      <p>${name} (${year})</p>
    `;
    option.addEventListener('click', async () => {
      const data = {
        title: name,
        overview: result.overview,
        rating: result.vote_average,
        releaseDate: (contentTypeSelect.value === 'movie') ? result.release_date : result.first_air_date,
        posterUrl: posterPath
      };
      // If TV & season, fetch season details
      if (contentTypeSelect.value === 'tv' && seasonInput.value) {
        try {
          const seasonRes = await fetch(`${TMDB_BASE_URL}/tv/${result.id}/season/${seasonInput.value}?api_key=${TMDB_API_KEY}`);
          const seasonData = await seasonRes.json();
          if (seasonData.poster_path) {
            data.posterUrl = TMDB_IMG_BASE + seasonData.poster_path;
          }
          data.overview = seasonData.overview || data.overview;
          data.releaseDate = seasonData.air_date || data.releaseDate;
        } catch (err) {
          console.error("Error fetching season data:", err);
        }
      }
      selectedTMDBData = data;
      tmdbPreview.innerHTML = `
        <img src="${data.posterUrl}" alt="Poster Preview">
        <h3>${data.title}</h3>
        <p>${data.overview.substring(0, 100)}...</p>
      `;
    });
    container.appendChild(option);
  });
  tmdbPreview.appendChild(container);
}

// Firestore
async function saveCard(cardData) {
  try {
    const userId = auth.currentUser.uid;
    await addDoc(collection(db, "users", userId, "cards"), cardData);
  } catch (error) {
    console.error("Error saving card:", error);
  }
}

async function loadCards() {
  try {
    const userId = auth.currentUser.uid;
    const snapshot = await getDocs(collection(db, "users", userId, "cards"));
    cardContainer.innerHTML = "";
    snapshot.forEach(docSnap => {
      createCardElement(docSnap.data(), docSnap.id);
    });
  } catch (error) {
    console.error("Error loading cards:", error);
  }
}

function createCardElement(cardData, docId) {
  const card = document.createElement('div');
  card.classList.add('card');
  card.dataset.id = docId;
  card.innerHTML = `
    <img src="${cardData.posterUrl}" alt="Poster">
    <div class="overlay">
      <div class="title">${cardData.title}</div>
      <div class="action-buttons">
        <button class="btn btn-info" onclick="openDetailModalHandler(event, '${docId}')">Info</button>
        <button class="btn btn-edit" onclick="editCard(this)">Edit</button>
        <button class="btn btn-delete" onclick="deleteCard(this)">Delete</button>
      </div>
    </div>
  `;
  cardContainer.appendChild(card);
}

// Global so we can call from HTML onclick
window.deleteCard = async (button) => {
  const card = button.closest('.card');
  const docId = card.dataset.id;
  try {
    const userId = auth.currentUser.uid;
    await deleteDoc(doc(db, "users", userId, "cards", docId));
    card.remove();
  } catch (error) {
    console.error("Error deleting card:", error);
  }
};

window.editCard = (button) => {
  const card = button.closest('.card');
  const docId = card.dataset.id;
  titleInput.value = card.querySelector('.title').textContent;
  modal.classList.add('open');
  submitBtn.onclick = async (e) => {
    e.preventDefault();
    const type = contentTypeSelect.value;
    const season = (type === 'tv') ? seasonInput.value : null;
    const results = await fetchTMDBResults(titleInput.value, type);
    if (results.length > 0) {
      const result = results[0];
      const data = {
        title: result.title || result.name,
        overview: result.overview,
        rating: result.vote_average,
        releaseDate: (type === 'movie') ? result.release_date : result.first_air_date,
        posterUrl: result.poster_path ? TMDB_IMG_BASE + result.poster_path : ""
      };
      // If TV & season
      if (type === 'tv' && season) {
        try {
          const seasonRes = await fetch(`${TMDB_BASE_URL}/tv/${result.id}/season/${season}?api_key=${TMDB_API_KEY}`);
          const seasonData = await seasonRes.json();
          if (seasonData.poster_path) {
            data.posterUrl = TMDB_IMG_BASE + seasonData.poster_path;
          }
          data.overview = seasonData.overview || data.overview;
          data.releaseDate = seasonData.air_date || data.releaseDate;
        } catch (err) {
          console.error("Error fetching season data:", err);
        }
      }
      try {
        const userId = auth.currentUser.uid;
        await updateDoc(doc(db, "users", userId, "cards", docId), data);
        card.querySelector('img').src = data.posterUrl;
        card.querySelector('.title').textContent = data.title;
        modal.classList.remove('open');
      } catch (err) {
        console.error("Error updating card:", err);
      }
    }
  };
};

// TMDB fetch button
fetchTmdbBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const title = titleInput.value;
  const type = contentTypeSelect.value;
  if (title) {
    const results = await fetchTMDBResults(title, type);
    displayTMDBOptions(results);
  }
});

// Clear TMDB preview
clearPreviewBtn.addEventListener('click', (e) => {
  e.preventDefault();
  tmdbPreview.innerHTML = "";
  selectedTMDBData = null;
});

// Submit new card
submitBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  if (!selectedTMDBData) {
    alert("Please fetch and select a TMDB result before submitting.");
    return;
  }
  await saveCard(selectedTMDBData);
  await loadCards();
  modal.classList.remove('open');
  titleInput.value = '';
  seasonInput.value = '';
  tmdbPreview.innerHTML = "";
  selectedTMDBData = null;
});

// Open & close Add/Edit modal
openModalBtn.addEventListener('click', () => modal.classList.add('open'));
closeModalBtn.addEventListener('click', () => modal.classList.remove('open'));

// Detail modal
window.openDetailModalHandler = async (e, docId) => {
  e.stopPropagation();
  try {
    const userId = auth.currentUser.uid;
    const snapshot = await getDocs(collection(db, "users", userId, "cards"));
    let cardData;
    snapshot.forEach(docSnap => {
      if (docSnap.id === docId) {
        cardData = docSnap.data();
      }
    });
    if (cardData) {
      detailPoster.src = cardData.posterUrl;
      detailTitle.textContent = cardData.title;
      detailOverview.textContent = cardData.overview;
      detailRating.textContent = `Rating: ${cardData.rating}`;
      detailRelease.textContent = `Release: ${cardData.releaseDate}`;
      detailModal.classList.add('open');
    }
  } catch (error) {
    console.error("Error opening detail modal:", error);
  }
};
closeDetailModal.addEventListener('click', () => detailModal.classList.remove('open'));

// Search functionality
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  document.querySelectorAll('.card').forEach(card => {
    const title = card.querySelector('.title').textContent.toLowerCase();
    card.style.display = title.includes(query) ? 'block' : 'none';
  });
});

// Profile picture preview
profilePicInput.addEventListener('change', () => {
  const file = profilePicInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      profilePhoto.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Save profile data
saveProfileBtn.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user) return;
  const profileData = {
    nickname: profileNickname.value || user.displayName || "Anonymous",
    tagline: profileTagline.value || "Your tagline here",
    bio: profileBio.value || "Write a short bio about yourself..."
  };
  try {
    await setDoc(doc(db, "users", user.uid, "profile", "profile"), profileData);
    profileNicknameDisplay.textContent = profileData.nickname;
    profileTaglineDisplay.textContent = profileData.tagline;
    profileBioDisplay.textContent = profileData.bio;
    alert("Profile updated successfully!");
  } catch (err) {
    console.error("Error updating profile:", err);
  }
});
