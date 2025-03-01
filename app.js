import { 
  auth, db, storage, loginWithGoogle, logout, monitorAuthState, updateUserProfile, 
  addDocument, getDocuments, deleteDocument, updateDocument, setDocument, 
  uploadFile, getFileURL, trackEvent 
} from './firebase.js';

const TMDB_API_KEY = "0b1121a7a8eda7a6ecc7fdfa631ad27a";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";

const openModalBtn = document.getElementById('openModalBtn');
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('closeModalBtn');
const submitBtn = document.getElementById('submitBtn');
const cardContainer = document.getElementById('card-container');
const watchlistContainer = document.getElementById('watchlistContainer');
const titleInput = document.getElementById('title');
const contentTypeSelect = document.getElementById('content-type');
const seasonInput = document.getElementById('season');
const userRatingInput = document.getElementById('userRating');
const watchLaterCheckbox = document.getElementById('watchLater');
const fetchTmdbBtn = document.getElementById('fetchTmdbBtn');
const tmdbPreview = document.getElementById('tmdbPreview');
const clearPreviewBtn = document.getElementById('clearPreviewBtn');
const searchInput = document.getElementById('searchInput');
const detailModal = document.getElementById('detailModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const detailPoster = document.getElementById('detailPoster');
const detailTitle = document.getElementById('detailTitle');
const detailOverview = document.getElementById('detailOverview');
const detailRating = document.getElementById('detailRating');
const detailUserRating = document.getElementById('detailUserRating');
const detailRelease = document.getElementById('detailRelease');
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
const galaxyToggle = document.getElementById('galaxyToggle');
const galaxyView = document.getElementById('galaxyView');
const zoomIn = document.getElementById('zoomIn');
const zoomOut = document.getElementById('zoomOut');
const voiceSearchBtn = document.getElementById('voiceSearchBtn');
const themeToggle = document.getElementById('themeToggle');
const trendingContainer = document.getElementById('trendingContainer');
const recommendationsContainer = document.getElementById('recommendationsContainer');
const loginModal = document.getElementById('loginModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const sidebarPhoto = document.getElementById('sidebarPhoto');
const sidebarNickname = document.getElementById('sidebarNickname');
const totalFavorites = document.getElementById('totalFavorites');
const avgRating = document.getElementById('avgRating');
const homeBtn = document.getElementById('homeBtn');
const exportBtn = document.getElementById('exportBtn');
const shareBtn = document.getElementById('shareBtn');
const categoryFilter = document.getElementById('categoryFilter');

let selectedTMDBData = null;
let scene, camera, renderer, starField;

// Galaxy View (Fixed and Enhanced)
function initGalaxy() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, 250 / 250, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('galaxyCanvas'), alpha: true });
  renderer.setSize(250, 250);

  const stars = [];
  const loader = new THREE.TextureLoader();
  getDocuments(`users/${auth.currentUser.uid}/cards`).then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.watchLater) {
        const geometry = new THREE.SphereGeometry(2.5, 32, 32);
        const material = new THREE.MeshBasicMaterial({
          map: loader.load(data.posterUrl, undefined, undefined, () => {
            material.map = loader.load('https://via.placeholder.com/50'); // Fallback on error
          }),
          transparent: true
        });
        const star = new THREE.Mesh(geometry, material);
        star.position.set(
          (Math.random() - 0.5) * 150,
          (Math.random() - 0.5) * 150,
          (Math.random() - 0.5) * 150
        );
        star.userData = { id: doc.id, title: data.title, rating: data.userRating };
        stars.push(star);
        scene.add(star);
      }
    });

    starField = new THREE.Group();
    stars.forEach(star => starField.add(star));
    scene.add(starField);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    galaxyView.addEventListener('mousemove', (e) => {
      const rect = galaxyCanvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / 250) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / 250) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(stars);
      stars.forEach(s => s.scale.set(1, 1, 1));
      if (intersects.length) {
        const star = intersects[0].object;
        star.scale.set(2.5, 2.5, 2.5);
        galaxyView.title = `${star.userData.title} (Rating: ${star.userData.rating || 'N/A'})`;
      } else {
        galaxyView.title = "";
      }
    });

    galaxyView.addEventListener('click', (e) => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(stars);
      if (intersects.length) openDetailModalHandler(e, intersects[0].object.userData.id);
    });

    zoomIn.onclick = () => {
      camera.position.z = Math.max(50, camera.position.z - 20);
      trackEvent('galaxy_zoom_in', { zoom: camera.position.z });
    };
    zoomOut.onclick = () => {
      camera.position.z = Math.min(300, camera.position.z + 20);
      trackEvent('galaxy_zoom_out', { zoom: camera.position.z });
    };
  }).catch(err => console.error("Galaxy load error:", err));

  camera.position.z = 200;
  animateGalaxy();
}

function animateGalaxy() {
  requestAnimationFrame(animateGalaxy);
  if (starField) {
    starField.rotation.x += 0.0015;
    starField.rotation.y += 0.0015;
  }
  renderer.render(scene, camera);
}

// Voice Search
function initVoiceSearch() {
  if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      searchInput.value = transcript;
      searchCards(transcript);
      trackEvent('voice_search', { query: transcript });
    };
    voiceSearchBtn.onclick = () => recognition.start();
  } else {
    voiceSearchBtn.style.display = 'none';
  }
}

function searchCards(query) {
  const lowerQuery = query.toLowerCase();
  document.querySelectorAll('#card-container .card, #watchlistContainer .card').forEach(card => {
    const title = card.querySelector('.title').textContent.toLowerCase();
    card.style.display = title.includes(lowerQuery) ? 'block' : 'none';
  });
}

// Login Handling
googleLoginBtn.onclick = () => {
  loginWithGoogle()
    .then(() => {
      loginModal.classList.remove('open');
      document.body.classList.add('logged-in');
      trackEvent('login', { method: 'google' });
    })
    .catch(error => console.error("Login error:", error));
};

closeLoginModal.onclick = () => loginModal.classList.remove('open');

// Event Listeners
contentTypeSelect.onchange = () => {
  seasonInput.style.display = contentTypeSelect.value === 'tv' ? 'block' : 'none';
};

profileBtn.onclick = async () => {
  const user = auth.currentUser;
  if (user) {
    profilePhoto.src = user.photoURL || 'https://via.placeholder.com/150';
    const profileSnap = await getDocuments(`users/${user.uid}/profile`);
    let profileData = {};
    profileSnap.forEach(doc => profileData = doc.data());
    profileNicknameDisplay.textContent = profileData.nickname || user.displayName || "Anonymous";
    profileTaglineDisplay.textContent = profileData.tagline || "Cosmic Explorer";
    profileBioDisplay.textContent = profileData.bio || "Exploring the universe, one star at a time...";
    profileModal.classList.add('open');
    trackEvent('profile_view', { user_id: user.uid });
  }
};

closeProfileModal.onclick = () => profileModal.classList.remove('open');

monitorAuthState(user => {
  if (user) {
    document.body.classList.add('logged-in');
    loadCards();
    loadWatchlist();
    loadTrending();
    loadRecommendations();
    initVoiceSearch();
    updateUserStats();
    sidebarPhoto.src = user.photoURL || 'https://via.placeholder.com/80';
    sidebarNickname.textContent = user.displayName || "Anonymous";
    getDocuments(`users/${user.uid}/profile`).then(snap => {
      snap.forEach(doc => {
        const data = doc.data();
        sidebarNickname.textContent = data.nickname || user.displayName;
      });
    });
  } else {
    loginModal.classList.add('open');
    document.body.classList.remove('logged-in');
  }
});

async function fetchTMDBResults(title, type) {
  const searchUrl = `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
  try {
    const res = await fetch(searchUrl);
    if (!res.ok) throw new Error("TMDB fetch failed");
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching TMDB:", error);
    return [];
  }
}

function displayTMDBOptions(results) {
  tmdbPreview.innerHTML = "";
  if (!results.length) {
    tmdbPreview.textContent = "No stars found in this nebula.";
    return;
  }
  results.forEach(result => {
    const option = document.createElement('div');
    option.classList.add('tmdb-option');
    const name = result.title || result.name;
    const year = (result.release_date || result.first_air_date || '').substring(0, 4);
    const posterPath = result.poster_path ? TMDB_IMG_BASE + result.poster_path : 'https://via.placeholder.com/70';
    option.innerHTML = `<img src="${posterPath}" alt="${name}"><p>${name} (${year})</p>`;
    option.onclick = async () => {
      const data = {
        title: name,
        overview: result.overview,
        rating: result.vote_average,
        releaseDate: contentTypeSelect.value === 'movie' ? result.release_date : result.first_air_date,
        posterUrl: posterPath,
        type: contentTypeSelect.value,
        userRating: userRatingInput.value || null,
        watchLater: watchLaterCheckbox.checked
      };
      if (contentTypeSelect.value === 'tv' && seasonInput.value) {
        const seasonRes = await fetch(`${TMDB_BASE_URL}/tv/${result.id}/season/${seasonInput.value}?api_key=${TMDB_API_KEY}`);
        const seasonData = await seasonRes.json();
        if (seasonData.poster_path) data.posterUrl = TMDB_IMG_BASE + seasonData.poster_path;
        data.overview = seasonData.overview || data.overview;
        data.releaseDate = seasonData.air_date || data.releaseDate;
      }
      selectedTMDBData = data;
      tmdbPreview.innerHTML = `<img src="${data.posterUrl}" alt="${data.title}"><h3>${data.title}</h3><p>${data.overview.substring(0, 100)}...</p>`;
      trackEvent('tmdb_select', { title: data.title });
    };
    tmdbPreview.appendChild(option);
  });
}

async function saveCard(cardData) {
  const userId = auth.currentUser.uid;
  await addDocument(`users/${userId}/cards`, cardData);
  trackEvent(cardData.watchLater ? 'watchlist_added' : 'card_added', { title: cardData.title });
}

async function loadCards() {
  const userId = auth.currentUser.uid;
  const snapshot = await getDocuments(`users/${userId}/cards`);
  cardContainer.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.watchLater && (categoryFilter.value === 'all' || data.type === categoryFilter.value)) {
      createCardElement(data, doc.id, cardContainer);
    }
  });
  updateUserStats();
}

async function loadWatchlist() {
  const userId = auth.currentUser.uid;
  const snapshot = await getDocuments(`users/${userId}/cards`);
  watchlistContainer.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.watchLater && (categoryFilter.value === 'all' || data.type === categoryFilter.value)) {
      createCardElement(data, doc.id, watchlistContainer);
    }
  });
}

function createCardElement(cardData, docId, container) {
  const card = document.createElement('div');
  card.classList.add('card');
  card.dataset.id = docId;
  card.innerHTML = `
    <img src="${cardData.posterUrl}" alt="${cardData.title}">
    <div class="overlay">
      <div class="title">${cardData.title}</div>
      <div class="action-buttons">
        <button class="btn btn-info" onclick="openDetailModalHandler(event, '${docId}')">Info</button>
        <button class="btn btn-edit" onclick="editCard(event, this)">Edit</button>
        <button class="btn btn-delete" onclick="deleteCard(event, this)">Delete</button>
      </div>
    </div>
  `;
  container.appendChild(card);
}

window.deleteCard = async (e, button) => {
  e.preventDefault();
  const card = button.closest('.card');
  const docId = card.dataset.id;
  const userId = auth.currentUser.uid;
  await deleteDocument(`users/${userId}/cards`, docId);
  card.remove();
  loadCards();
  loadWatchlist();
  trackEvent('card_deleted', { doc_id: docId });
};

window.editCard = (e, button) => {
  e.preventDefault();
  const card = button.closest('.card');
  const docId = card.dataset.id;
  titleInput.value = card.querySelector('.title').textContent;
  modal.classList.add('open');
  submitBtn.onclick = async (e) => {
    e.preventDefault();
    const type = contentTypeSelect.value;
    const season = type === 'tv' ? seasonInput.value : null;
    const userRating = userRatingInput.value || null;
    const watchLater = watchLaterCheckbox.checked;
    const results = await fetchTMDBResults(titleInput.value, type);
    if (results.length) {
      const result = results[0];
      const data = {
        title: result.title || result.name,
        overview: result.overview,
        rating: result.vote_average,
        releaseDate: type === 'movie' ? result.release_date : result.first_air_date,
        posterUrl: result.poster_path ? TMDB_IMG_BASE + result.poster_path : "",
        type: type,
        userRating: userRating,
        watchLater: watchLater
      };
      if (type === 'tv' && season) {
        const seasonRes = await fetch(`${TMDB_BASE_URL}/tv/${result.id}/season/${season}?api_key=${TMDB_API_KEY}`);
        const seasonData = await seasonRes.json();
        if (seasonData.poster_path) data.posterUrl = TMDB_IMG_BASE + seasonData.poster_path;
        data.overview = seasonData.overview || data.overview;
        data.releaseDate = seasonData.air_date || data.releaseDate;
      }
      const userId = auth.currentUser.uid;
      await updateDocument(`users/${userId}/cards`, docId, data);
      card.querySelector('img').src = data.posterUrl;
      card.querySelector('.title').textContent = data.title;
      modal.classList.remove('open');
      loadCards();
      loadWatchlist();
      trackEvent('card_edited', { title: data.title });
    }
  };
};

fetchTmdbBtn.onclick = async (e) => {
  e.preventDefault();
  const title = titleInput.value;
  const type = contentTypeSelect.value;
  if (title) {
    const results = await fetchTMDBResults(title, type);
    displayTMDBOptions(results);
  }
};

clearPreviewBtn.onclick = (e) => {
  e.preventDefault();
  tmdbPreview.innerHTML = "";
  selectedTMDBData = null;
};

submitBtn.onclick = async (e) => {
  e.preventDefault();
  if (!selectedTMDBData) {
    alert("Please fetch and select a TMDB result.");
    return;
  }
  await saveCard(selectedTMDBData);
  await loadCards();
  await loadWatchlist();
  modal.classList.remove('open');
  titleInput.value = '';
  seasonInput.value = '';
  userRatingInput.value = '';
  watchLaterCheckbox.checked = false;
  tmdbPreview.innerHTML = "";
  selectedTMDBData = null;
};

openModalBtn.onclick = (e) => {
  e.preventDefault();
  if (auth.currentUser) modal.classList.add('open');
  else loginModal.classList.add('open');
};

closeModalBtn.onclick = (e) => {
  e.preventDefault();
  modal.classList.remove('open');
};

window.openDetailModalHandler = async (e, docId) => {
  e.preventDefault();
  const userId = auth.currentUser.uid;
  const snapshot = await getDocuments(`users/${userId}/cards`);
  let cardData;
  snapshot.forEach(doc => {
    if (doc.id === docId) cardData = doc.data();
  });
  if (cardData) {
    detailPoster.src = cardData.posterUrl;
    detailTitle.textContent = cardData.title;
    detailOverview.textContent = cardData.overview;
    detailRating.textContent = `TMDB Rating: ${cardData.rating}/10`;
    detailUserRating.textContent = `Your Rating: ${cardData.userRating || 'Not Rated'}/10`;
    detailRelease.textContent = `Released: ${cardData.releaseDate}`;
    detailModal.classList.add('open');
    trackEvent('card_details_viewed', { title: cardData.title });
  }
};

closeDetailModal.onclick = (e) => {
  e.preventDefault();
  detailModal.classList.remove('open');
};

searchInput.oninput = () => searchCards(searchInput.value);

profilePicInput.onchange = async () => {
  const file = profilePicInput.files[0];
  if (file) {
    const userId = auth.currentUser.uid;
    const path = `users/${userId}/profile-pic`;
    const url = await uploadFile(file, path);
    profilePhoto.src = url;
    sidebarPhoto.src = url;
    await updateUserProfile(auth.currentUser, { photoURL: url });
    trackEvent('profile_pic_updated', { user_id: userId });
  }
};

saveProfileBtn.onclick = async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const profileData = {
    nickname: profileNickname.value || user.displayName || "Anonymous",
    tagline: profileTagline.value || "Cosmic Explorer",
    bio: profileBio.value || "Exploring the universe, one star at a time..."
  };
  await setDocument(`users/${user.uid}/profile`, "profile", profileData);
  profileNicknameDisplay.textContent = profileData.nickname;
  profileTaglineDisplay.textContent = profileData.tagline;
  profileBioDisplay.textContent = profileData.bio;
  sidebarNickname.textContent = profileData.nickname;
  profileModal.classList.remove('open');
  trackEvent('profile_updated', { user_id: user.uid });
};

async function loadTrending() {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}`);
    if (!res.ok) throw new Error("Failed to fetch trending");
    const data = await res.json();
    trendingContainer.innerHTML = '';
    data.results.slice(0, 8).forEach(item => {
      const card = document.createElement('div');
      card.classList.add('card');
      const posterUrl = item.poster_path ? `${TMDB_IMG_BASE}${item.poster_path}` : 'https://via.placeholder.com/240';
      card.innerHTML = `
        <img src="${posterUrl}" alt="${item.title || item.name}">
        <div class="overlay">
          <div class="title">${item.title || item.name}</div>
          <div class="action-buttons">
            <button class="btn btn-info" onclick="fetchTrendingDetails('${item.id}', '${item.media_type}')">Info</button>
          </div>
        </div>
      `;
      trendingContainer.appendChild(card);
    });
    trackEvent('trending_loaded', { items: data.results.length });
  } catch (error) {
    console.error("Trending error:", error);
    trendingContainer.innerHTML = '<p>Failed to scan the trending nebula.</p>';
  }
}

async function fetchTrendingDetails(id, mediaType) {
  try {
    const url = `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch details");
    const data = await res.json();
    detailPoster.src = data.poster_path ? `${TMDB_IMG_BASE}${data.poster_path}` : 'https://via.placeholder.com/300';
    detailTitle.textContent = data.title || data.name;
    detailOverview.textContent = data.overview;
    detailRating.textContent = `TMDB Rating: ${data.vote_average}/10`;
    detailUserRating.textContent = "Your Rating: Not Rated";
    detailRelease.textContent = `Released: ${data.release_date || data.first_air_date}`;
    detailModal.classList.add('open');
    trackEvent('trending_details_viewed', { title: data.title || data.name });
  } catch (error) {
    console.error("Detail fetch error:", error);
  }
}

async function loadRecommendations() {
  try {
    const userId = auth.currentUser.uid;
    const snapshot = await getDocuments(`users/${userId}/cards`);
    const genres = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.genres) data.genres.forEach(g => genres.add(g));
    });
    const genreIds = Array.from(genres).slice(0, 2).join(',');
    const res = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreIds}&sort_by=popularity.desc`);
    if (!res.ok) throw new Error("Failed to fetch recommendations");
    const data = await res.json();
    recommendationsContainer.innerHTML = '';
    data.results.slice(0, 6).forEach(item => {
      const card = document.createElement('div');
      card.classList.add('card');
      const posterUrl = item.poster_path ? `${TMDB_IMG_BASE}${item.poster_path}` : 'https://via.placeholder.com/240';
      card.innerHTML = `
        <img src="${posterUrl}" alt="${item.title}">
        <div class="overlay">
          <div class="title">${item.title}</div>
          <div class="action-buttons">
            <button class="btn btn-info" onclick="fetchTrendingDetails('${item.id}', 'movie')">Info</button>
          </div>
        </div>
      `;
      recommendationsContainer.appendChild(card);
    });
    trackEvent('recommendations_loaded', { items: data.results.length });
  } catch (error) {
    console.error("Recommendations error:", error);
    recommendationsContainer.innerHTML = '<p>Failed to explore cosmic recommendations.</p>';
  }
}

async function updateUserStats() {
  const userId = auth.currentUser.uid;
  const snapshot = await getDocuments(`users/${userId}/cards`);
  let total = 0, ratedCount = 0, totalRating = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.watchLater) {
      total++;
      if (data.userRating) {
        ratedCount++;
        totalRating += parseInt(data.userRating);
      }
    }
  });
  totalFavorites.textContent = total;
  avgRating.textContent = ratedCount ? (totalRating / ratedCount).toFixed(1) : 'N/A';
}

galaxyToggle.onclick = (e) => {
  e.preventDefault();
  if (!auth.currentUser) {
    loginModal.classList.add('open');
    return;
  }
  galaxyView.classList.toggle('hidden');
  if (!galaxyView.classList.contains('hidden') && !starField) initGalaxy();
};

themeToggle.onclick = (e) => {
  e.preventDefault();
  document.documentElement.classList.toggle('light-mode');
  themeToggle.innerHTML = document.documentElement.classList.contains('light-mode') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  trackEvent('theme_toggled', { mode: document.documentElement.classList.contains('light-mode') ? 'light' : 'dark' });
};

logoutBtn.onclick = (e) => {
  e.preventDefault();
  logout().then(() => {
    document.body.classList.remove('logged-in');
    loginModal.classList.add('open');
    trackEvent('logout', { user_id: auth.currentUser?.uid });
  }).catch(error => console.error("Logout error:", error));
};

homeBtn.onclick = (e) => {
  e.preventDefault();
  loadCards();
  loadWatchlist();
  loadTrending();
  loadRecommendations();
};

exportBtn.onclick = async (e) => {
  e.preventDefault();
  const userId = auth.currentUser.uid;
  const snapshot = await getDocuments(`users/${userId}/cards`);
  const favorites = [];
  snapshot.forEach(doc => favorites.push(doc.data()));
  const json = JSON.stringify(favorites, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ur_favs_export.json';
  a.click();
  URL.revokeObjectURL(url);
  trackEvent('favorites_exported', { count: favorites.length });
};

shareBtn.onclick = async (e) => {
  e.preventDefault();
  const userId = auth.currentUser.uid;
  const snapshot = await getDocuments(`users/${userId}/cards`);
  const favorites = [];
  snapshot.forEach(doc => favorites.push(doc.data().title));
  const shareText = `Check out my cosmic favorites on UR FAV'S: ${favorites.slice(0, 3).join(', ')} and more! Visit ${window.location.origin}`;
  if (navigator.share) {
    await navigator.share({ title: "UR FAV'S", text: shareText, url: window.location.origin });
    trackEvent('social_share', { platform: 'native' });
  } else {
    alert(shareText); // Fallback
    trackEvent('social_share_fallback', {});
  }
};

categoryFilter.onchange = () => {
  loadCards();
  loadWatchlist();
};
