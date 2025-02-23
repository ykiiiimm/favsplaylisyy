import { auth, db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, signOut } from './firebase.js';

const TMDB_API_KEY = "0b1121a7a8eda7a6ecc7fdfa631ad27a";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";

// DOM Elements
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
const searchInput = document.querySelector('.search-bar input');

// Detail Modal Elements
const detailModal = document.getElementById('detailModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const detailPoster = document.getElementById('detailPoster');
const detailTitle = document.getElementById('detailTitle');
const detailOverview = document.getElementById('detailOverview');
const detailRating = document.getElementById('detailRating');
const detailRelease = document.getElementById('detailRelease');

// Profile Modal Elements
const profileBtn = document.getElementById('profileBtn');
const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const profilePhoto = document.getElementById('profilePhoto');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
// Optionally, updateProfileBtn can be used for profile update functionality
const updateProfileBtn = document.getElementById('updateProfileBtn');

// Global variable to store the selected TMDB result
let selectedTMDBData = null;

// Show/hide season input based on content type selection
contentTypeSelect.addEventListener('change', () => {
  seasonInput.style.display = contentTypeSelect.value === 'tv' ? 'block' : 'none';
});

// Profile modal events
profileBtn.addEventListener('click', () => {
  const user = auth.currentUser;
  if (user) {
    profilePhoto.src = user.photoURL || 'default-profile.png';
    profileName.textContent = user.displayName || "No Name";
    profileEmail.textContent = user.email || "No Email";
    profileModal.classList.add('open');
  }
});
closeProfileModal.addEventListener('click', () => profileModal.classList.remove('open'));

// When user is logged in, load cards
auth.onAuthStateChanged((user) => {
  if (user) {
    loadCards();
  }
});

// Fetch a list of TMDB results (without season details)
async function fetchTMDBResults(title, type) {
  try {
    let searchUrl = "";
    if (type === "movie") {
      searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
    } else {
      searchUrl = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
    }
    const res = await fetch(searchUrl);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching TMDB results:", error);
    return [];
  }
}

// Display a list of selectable TMDB options in a horizontal layout
function displayTMDBOptions(results) {
  tmdbPreview.innerHTML = "";
  if (results.length === 0) {
    tmdbPreview.textContent = "No results found.";
    return;
  }
  const list = document.createElement('div');
  list.classList.add('tmdb-options');
  results.forEach(result => {
    const item = document.createElement('div');
    item.classList.add('tmdb-option');
    item.innerHTML = `
      <img src="${result.poster_path ? TMDB_IMG_BASE + result.poster_path : ''}" alt="${result.title || result.name}" />
      <p>${result.title || result.name} (${(result.release_date || result.first_air_date || '').substring(0,4)})</p>
    `;
    item.addEventListener('click', async () => {
      let tmdbData = {
        title: result.title || result.name,
        overview: result.overview,
        rating: result.vote_average,
        releaseDate: contentTypeSelect.value === "movie" ? result.release_date : result.first_air_date,
        posterUrl: result.poster_path ? TMDB_IMG_BASE + result.poster_path : ""
      };
      if (contentTypeSelect.value === "tv" && seasonInput.value) {
        try {
          const seasonRes = await fetch(`${TMDB_BASE_URL}/tv/${result.id}/season/${seasonInput.value}?api_key=${TMDB_API_KEY}`);
          const seasonData = await seasonRes.json();
          if (seasonData.poster_path) {
            tmdbData.posterUrl = TMDB_IMG_BASE + seasonData.poster_path;
          }
          tmdbData.overview = seasonData.overview || tmdbData.overview;
          tmdbData.releaseDate = seasonData.air_date || tmdbData.releaseDate;
        } catch (error) {
          console.error("Error fetching season data:", error);
        }
      }
      selectedTMDBData = tmdbData;
      tmdbPreview.innerHTML = `
        <img src="${selectedTMDBData.posterUrl}" alt="Poster Preview" />
        <h3>${selectedTMDBData.title}</h3>
        <p>${selectedTMDBData.overview.substring(0, 100)}...</p>
      `;
    });
    list.appendChild(item);
  });
  tmdbPreview.appendChild(list);
}

// Save card to Firestore
async function saveCard(cardData) {
  try {
    const userId = auth.currentUser.uid;
    await addDoc(collection(db, "users", userId, "cards"), cardData);
  } catch (error) {
    console.error("Error saving card:", error);
  }
}

// Load cards from Firestore
async function loadCards() {
  try {
    const userId = auth.currentUser.uid;
    const querySnapshot = await getDocs(collection(db, "users", userId, "cards"));
    cardContainer.innerHTML = "";
    querySnapshot.forEach((docSnap) => {
      createCardElement(docSnap.data(), docSnap.id);
    });
  } catch (error) {
    console.error("Error loading cards:", error);
  }
}

// Create card element with info, edit, delete, and detail buttons
function createCardElement(cardData, docId) {
  const card = document.createElement('div');
  card.classList.add('card');
  card.dataset.id = docId;
  card.innerHTML = `
    <img src="${cardData.posterUrl}" alt="Poster" />
    <div class="overlay">
      <div class="title">${cardData.title}</div>
      <div class="action-buttons">
        <button class="info-button" onclick="openDetailModalHandler(event, '${docId}')">Info</button>
        <button class="edit-button" onclick="editCard(this)">Edit</button>
        <button class="delete-button" onclick="deleteCard(this)">Delete</button>
      </div>
    </div>
  `;
  cardContainer.appendChild(card);
}

// Delete card
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

// Edit card (pre-fill the modal for editing)
window.editCard = (button) => {
  const card = button.closest('.card');
  const docId = card.dataset.id;
  const currentTitle = card.querySelector('.title').textContent;
  titleInput.value = currentTitle;
  modal.classList.add('open');
  
  submitBtn.onclick = async (e) => {
    e.preventDefault();
    const type = contentTypeSelect.value;
    const season = type === 'tv' ? seasonInput.value : null;
    const results = await fetchTMDBResults(titleInput.value, type);
    if (results.length > 0) {
      let result = results[0];
      let tmdbData = {
        title: result.title || result.name,
        overview: result.overview,
        rating: result.vote_average,
        releaseDate: type === "movie" ? result.release_date : result.first_air_date,
        posterUrl: result.poster_path ? TMDB_IMG_BASE + result.poster_path : ""
      };
      if (type === "tv" && season) {
        try {
          const seasonRes = await fetch(`${TMDB_BASE_URL}/tv/${result.id}/season/${season}?api_key=${TMDB_API_KEY}`);
          const seasonData = await seasonRes.json();
          if (seasonData.poster_path) {
            tmdbData.posterUrl = TMDB_IMG_BASE + seasonData.poster_path;
          }
          tmdbData.overview = seasonData.overview || tmdbData.overview;
          tmdbData.releaseDate = seasonData.air_date || tmdbData.releaseDate;
        } catch (error) {
          console.error("Error fetching season data:", error);
        }
      }
      try {
        const userId = auth.currentUser.uid;
        await updateDoc(doc(db, "users", userId, "cards", docId), tmdbData);
        const cardImg = card.querySelector('img');
        cardImg.src = tmdbData.posterUrl;
        card.querySelector('.title').textContent = tmdbData.title;
        modal.classList.remove('open');
      } catch (error) {
        console.error("Error updating card:", error);
      }
    }
  };
};

// Fetch TMDB info button click (display selection options)
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

// Submit new card using the selected TMDB data
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

// Open and close Add Modal
openModalBtn.addEventListener('click', () => modal.classList.add('open'));
closeModalBtn.addEventListener('click', () => modal.classList.remove('open'));

// Open detail modal to show full info (horizontal layout)
window.openDetailModalHandler = async (e, docId) => {
  e.stopPropagation();
  try {
    const userId = auth.currentUser.uid;
    const querySnapshot = await getDocs(collection(db, "users", userId, "cards"));
    let cardData;
    querySnapshot.forEach((docSnap) => {
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
