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
const searchInput = document.querySelector('.search-bar input');

// Detail Modal Elements
const detailModal = document.getElementById('detailModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const detailPoster = document.getElementById('detailPoster');
const detailTitle = document.getElementById('detailTitle');
const detailOverview = document.getElementById('detailOverview');
const detailRating = document.getElementById('detailRating');
const detailRelease = document.getElementById('detailRelease');

// Show/hide season input based on content type selection
contentTypeSelect.addEventListener('change', () => {
  seasonInput.style.display = contentTypeSelect.value === 'tv' ? 'block' : 'none';
});

// When user is logged in, load cards
auth.onAuthStateChanged((user) => {
  if (user) {
    loadCards();
  }
});

// Function to fetch data from TMDB based on title and type
async function fetchTMDBData(title, type, season = null) {
  try {
    let searchUrl = "";
    if (type === "movie") {
      searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
    } else {
      searchUrl = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
    }
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    if (searchData.results && searchData.results.length > 0) {
      const result = searchData.results[0]; // Take the first result
      let posterPath = result.poster_path;
      let overview = result.overview;
      let rating = result.vote_average;
      let releaseDate = type === "movie" ? result.release_date : result.first_air_date;
      
      // If TV and season provided, fetch season details
      if (type === "tv" && season) {
        const tvId = result.id;
        const seasonRes = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/season/${season}?api_key=${TMDB_API_KEY}`);
        const seasonData = await seasonRes.json();
        if (seasonData.poster_path) {
          posterPath = seasonData.poster_path; // Use season poster if available
        }
        // Optionally, update overview and release date with season details
        overview = seasonData.overview || overview;
        releaseDate = seasonData.air_date || releaseDate;
      }
      
      return {
        title: result.title || result.name,
        overview,
        rating,
        releaseDate,
        posterUrl: posterPath ? TMDB_IMG_BASE + posterPath : ""
      };
    } else {
      throw new Error("No results found in TMDB");
    }
  } catch (error) {
    console.error("Error fetching TMDB data:", error);
    return null;
  }
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

// Edit card (similar to delete, pre-fill the modal for editing)
window.editCard = (button) => {
  const card = button.closest('.card');
  const docId = card.dataset.id;
  const currentTitle = card.querySelector('.title').textContent;
  // For simplicity, assume you want to re-fetch from TMDB when editing
  titleInput.value = currentTitle;
  modal.classList.add('open');
  
  submitBtn.onclick = async (e) => {
    e.preventDefault();
    const type = contentTypeSelect.value;
    const season = type === 'tv' ? seasonInput.value : null;
    const tmdbData = await fetchTMDBData(titleInput.value, type, season);
    if (tmdbData) {
      try {
        const userId = auth.currentUser.uid;
        await updateDoc(doc(db, "users", userId, "cards", docId), tmdbData);
        // Update card element with new data
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

// Fetch TMDB info button click in modal (preview before submitting)
fetchTmdbBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const title = titleInput.value;
  const type = contentTypeSelect.value;
  const season = type === 'tv' ? seasonInput.value : null;
  if (title) {
    const tmdbData = await fetchTMDBData(title, type, season);
    if (tmdbData) {
      tmdbPreview.innerHTML = `
        <img src="${tmdbData.posterUrl}" alt="Poster Preview" />
        <h3>${tmdbData.title}</h3>
        <p>${tmdbData.overview.substring(0, 100)}...</p>
      `;
    } else {
      tmdbPreview.textContent = "No data found.";
    }
  }
});

// Submit new card
submitBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const title = titleInput.value;
  const type = contentTypeSelect.value;
  const season = type === 'tv' ? seasonInput.value : null;
  if (title) {
    const tmdbData = await fetchTMDBData(title, type, season);
    if (tmdbData) {
      await saveCard(tmdbData);
      await loadCards();
      modal.classList.remove('open');
      titleInput.value = '';
      seasonInput.value = '';
      tmdbPreview.innerHTML = '';
    }
  }
});

// Open Add Modal
openModalBtn.addEventListener('click', () => modal.classList.add('open'));
// Close Add Modal
closeModalBtn.addEventListener('click', () => modal.classList.remove('open'));

// Open detail modal to show full info
window.openDetailModalHandler = async (e, docId) => {
  e.stopPropagation(); // prevent propagation from card container
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

// Close detail modal
closeDetailModal.addEventListener('click', () => detailModal.classList.remove('open'));

// Search functionality
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  document.querySelectorAll('.card').forEach(card => {
    const title = card.querySelector('.title').textContent.toLowerCase();
    card.style.display = title.includes(query) ? 'block' : 'none';
  });
});
