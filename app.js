// Make sure firebase.js exports setDoc along with the other functions.
import { auth, db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, signOut } from './firebase.js';

const TMDB_API_KEY = "0b1121a7a8eda7a6ecc7fdfa631ad27a";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";

// DOM Elements – Content & TMDB
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

// DOM Elements – Detail Modal
const detailModal = document.getElementById('detailModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const detailPoster = document.getElementById('detailPoster');
const detailTitle = document.getElementById('detailTitle');
const detailOverview = document.getElementById('detailOverview');
const detailRating = document.getElementById('detailRating');
const detailRelease = document.getElementById('detailRelease');

// DOM Elements – Profile Modal
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

// Global variable to store selected TMDB result
let selectedTMDBData = null;

// Show/hide season input based on content type
contentTypeSelect.addEventListener('change', () => {
  seasonInput.style.display = contentTypeSelect.value === 'tv' ? 'block' : 'none';
});

// Profile Modal: Open and populate profile info
profileBtn.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (user) {
    profilePhoto.src = user.photoURL || 'default-profile.png';
    // For extended profile data, load from Firestore (if exists)
    const profileRef = doc(db, "users", user.uid, "profile", "profile");
    const profileSnap = await getDocs(collection(db, "users", user.uid, "profile"));
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
closeProfileModal.addEventListener('click', () => profileModal.classList.remove('open'));

// Toggle contact info in profile modal
toggleContactBtn.addEventListener('click', () => {
  contactInfo.classList.toggle('hidden');
});

// Auth state listener
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

// TMDB functions
async function fetchTMDBResults(title, type) {
  const searchUrl = type === 'movie'
    ? `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
    : `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
  try {
    const res = await fetch(searchUrl);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching TMDB results:", error);
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
    option.innerHTML = `
      <img src="${result.poster_path ? TMDB_IMG_BASE + result.poster_path : ''}" alt="${result.title || result.name}">
      <p>${result.title || result.name} (${(result.release_date || result.first_air_date || '').substring(0,4)})</p>
    `;
    option.addEventListener('click', async () => {
      let data = {
        title: result.title || result.name,
        overview: result.overview,
        rating: result.vote_average,
        releaseDate: contentTypeSelect.value === 'movie' ? result.release_date : result.first_air_date,
        posterUrl: result.poster_path ? TMDB_IMG_BASE + result.poster_path : ""
      };
      if (contentTypeSelect.value === 'tv' && seasonInput.value) {
        try {
          const seasonRes = await fetch(`${TMDB_BASE_URL}/tv/${result.id}/season/${seasonInput.value}?api_key=${TMDB_API_KEY}`);
          const seasonData = await seasonRes.json();
          if (seasonData.poster_path) {
            data.posterUrl = TMDB_IMG_BASE + seasonData.poster_path;
          }
          data.overview = seasonData.overview || data.overview;
          data.releaseDate = seasonData.air_date || data.releaseDate;
        } catch (error) {
          console.error("Error fetching season data:", error);
        }
      }
      selectedTMDBData = data;
      tmdbPreview.innerHTML = `
        <img src="${selectedTMDBData.posterUrl}" alt="Poster Preview">
        <h3>${selectedTMDBData.title}</h3>
        <p>${selectedTMDBData.overview.substring(0, 100)}...</p>
      `;
    });
    container.appendChild(option);
  });
  tmdbPreview.appendChild(container);
}

// Firestore card functions
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
    const season = type === 'tv' ? seasonInput.value : null;
    const results = await fetchTMDBResults(titleInput.value, type);
    if (results.length > 0) {
      let result = results[0];
      let data = {
        title: result.title || result.name,
        overview: result.overview,
        rating: result.vote_average,
        releaseDate: type === 'movie' ? result.release_date : result.first_air_date,
        posterUrl: result.poster_path ? TMDB_IMG_BASE + result.poster_path : ""
      };
      if (type === 'tv' && season) {
        try {
          const seasonRes = await fetch(`${TMDB_BASE_URL}/tv/${result.id}/season/${season}?api_key=${TMDB_API_KEY}`);
          const seasonData = await seasonRes.json
