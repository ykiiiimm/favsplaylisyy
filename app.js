import { 
  auth, db, storage, loginWithGoogle, logout, monitorAuthState, updateUserProfile, 
  addDocument, getDocuments, getWatchlistDocuments, deleteDocument, updateDocument, setDocument, 
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
const watchlistTagSelect = document.getElementById('watchlistTag');
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
const detailCast = document.getElementById('detailCast');
const detailGenres = document.getElementById('detailGenres');
const detailRuntime = document.getElementById('detailRuntime');
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
const dashboardBtn = document.getElementById('dashboardBtn');
const dashboardModal = document.getElementById('dashboardModal');
const closeDashboardModal = document.getElementById('closeDashboardModal');
const dashboardPhoto = document.getElementById('dashboardPhoto');
const dashboardNickname = document.getElementById('dashboardNickname');
const dashboardTotalFavorites = document.getElementById('dashboardTotalFavorites');
const dashboardAvgRating = document.getElementById('dashboardAvgRating');
const galaxyToggle = document.getElementById('galaxyToggle');
const galaxyView = document.getElementById('galaxyView');
const zoomIn = document.getElementById('zoomIn');
const zoomOut = document.getElementById('zoomOut');
const voiceSearchBtn = document.getElementById('voiceSearchBtn');
const themeToggle = document.getElementById('themeToggle');
const trendingContainer = document.getElementById('trendingContainer');
const recommendationsContainer = document.getElementById('recommendationsContainer');
const ratingsHistogram = document.getElementById('ratingsHistogram');
const activityLog = document.getElementById('activityLog');
const loginModal = document.getElementById('loginModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const homeBtn = document.getElementById('homeBtn');
const exportBtn = document.getElementById('exportBtn');
const shareBtn = document.getElementById('shareBtn');
const randomPickBtn = document.getElementById('randomPickBtn');
const categoryFilter = document.getElementById('categoryFilter');
const watchlistTagFilter = document.getElementById('watchlistTagFilter');
const sortFavorites = document.getElementById('sortFavorites');

let selectedTMDBData = null;
let scene, camera, renderer, starField;
let histogramChart;

// Galaxy View
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
            material.map = loader.load('https://via.placeholder.com/50');
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

// Voice Search (Fixed and Enhanced)
function initVoiceSearch() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn("Voice recognition not supported in this browser.");
    voiceSearchBtn.style.display = 'none';
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    voiceSearchBtn.classList.add('active');
    console.log("Voice recognition started.");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    searchInput.value = transcript;
    searchCards(transcript);
    trackEvent('voice_search', { query: transcript });
    voiceSearchBtn.classList.remove('active');
  };

  recognition.onerror = (event) => {
    console.error("Voice recognition error:", event.error);
    voiceSearchBtn.classList.remove('active');
    alert("Voice search failed. Please try again or type your query.");
  };

  recognition.onend = () => {
    voiceSearchBtn.classList.remove('active');
  };

  voiceSearchBtn.onclick = () => {
    try {
      recognition.start();
    } catch (error) {
      console.error("Voice recognition start error:", error);
    }
  };
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
  watchlistTagSelect.style.display = watchLaterCheckbox.checked && contentTypeSelect.value === 'tv' ? 'block' : 'none';
};

watchLaterCheckbox.onchange = () => {
  watchlistTagSelect.style.display = watchLaterCheckbox.checked ? 'block' : 'none';
};

profileBtn.onclick = async () => {
  const user = auth.currentUser;
  if (user) {
    profilePhoto.src = user.photoURL || 'https://via.placeholder.com/100';
    const profileSnap = await getDocuments(`users/${user.uid}/profile`);
    let profileData = {};
    profileSnap.forEach(doc => profileData = doc.data());
    profileNicknameDisplay.textContent = profileData.nickname || user.displayName || "Anonymous";
    profileTaglineDisplay.textContent = profileData.tagline || "Movie & TV Fan";
    profileBioDisplay.textContent = profileData.bio || "Tell us about yourself...";
    profileModal.classList.add('open');
    trackEvent('profile_view', { user_id: user.uid });
  }
};

closeProfileModal.onclick = () => profileModal.classList.remove('open');

dashboardBtn.onclick = async () => {
  const user = auth.currentUser;
  if (user) {
    dashboardPhoto.src = user.photoURL || 'https://via.placeholder.com/100';
    const profileSnap = await getDocuments(`users/${user.uid}/profile`);
    let profileData = {};
    profileSnap.forEach(doc => profileData = doc.data());
    dashboardNickname.textContent = profileData.nickname || user.displayName || "Anonymous";
    updateDashboardStats();
    dashboardModal.classList.add('open');
    trackEvent('dashboard_view', { user_id: user.uid });
  }
};

closeDashboardModal.onclick = () => {
  dashboardModal.classList.remove('open');
  galaxyView.classList.add('hidden');
};

monitorAuthState(user => {
  if (user) {
    document.body.classList.add('logged-in');
    loadCards();
    loadWatchlist();
    loadTrending();
    loadRecommendations();
    initVoiceSearch();
    updateRatingsHistogram();
    updateActivityLog();
    loginModal.classList.remove('open');
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

async function fetchTMDBDetails(id, type) {
  const url = `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("TMDB details fetch failed");
    return await res.json();
  } catch (error) {
    console.error("Error fetching TMDB details:", error);
    return null;
  }
}

function displayTMDBOptions(results) {
  tmdbPreview.innerHTML = "";
  if (!results.length) {
    tmdbPreview.textContent = "No results found.";
    return;
  }
  results.forEach(result => {
    const option = document.createElement('div');
    option.classList.add('tmdb-option');
    const name = result.title || result.name;
    const year = (result.release_date || result.first_air_date || '').substring(0, 4);
    const posterPath = result.poster_path ? TMDB_IMG_BASE + result.poster_path : 'https://via.placeholder.com/50';
    option.innerHTML = `<img src="${posterPath}" alt="${name}"><p>${name} (${year})</p>`;
    option.onclick = async () => {
      const details = await fetchTMDBDetails(result.id, contentTypeSelect.value);
      const data = {
        title: name,
        overview: result.overview,
        rating: result.vote_average,
        releaseDate: contentTypeSelect.value === 'movie' ? result.release_date : result.first_air_date,
        posterUrl: posterPath,
        type: contentTypeSelect.value,
        userRating: userRatingInput.value || null,
        watchLater: watchLaterCheckbox.checked,
        watchlistTag: watchLaterCheckbox.checked ? watchlistTagSelect.value : null,
        cast: details ? details.credits.cast.slice(0, 3).map(c => c.name).join(', ') : '',
        genres: details ? details.genres.map(g => g.name).join(', ') : '',
        runtime: details ? (details.runtime || details.episode_run_time ? details.episode_run_time[0] : 'N/A') : 'N/A'
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
  const docRef = await addDocument(`users/${userId}/cards`, cardData);
  addToActivityLog(`Added "${cardData.title}" to ${cardData.watchLater ? 'Watch Later' : 'Favorites'}`);
  trackEvent(cardData.watchLater ? 'watchlist_added' : 'card_added', { title: cardData.title, doc_id: docRef.id });
}

async function loadCards() {
  const userId = auth.currentUser.uid;
  const snapshot = await getDocuments(`users/${userId}/cards`);
  let cards = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.watchLater) cards.push({ id: doc.id, ...data });
  });

  // Sorting
  const sortBy = sortFavorites.value;
  cards.sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'rating') return (b.userRating || 0) - (a.userRating || 0);
    if (sortBy === 'date') return b.timestamp?.toMillis() - a.timestamp?.toMillis();
    return 0;
  });

  cardContainer.innerHTML = "";
  cards.forEach(card => {
    if (categoryFilter.value === 'all' || card.type === categoryFilter.value) {
      createCardElement(card, cardContainer);
    }
  });
  updateRatingsHistogram();
}

async function loadWatchlist() {
  const userId = auth.currentUser.uid;
  const snapshot = await getWatchlistDocuments(`users/${userId}/cards`);
  let watchlist = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.watchLater) watchlist.push({ id: doc.id, ...data });
  });

  watchlistContainer.innerHTML = "";
  watchlist.forEach(item => {
    if ((categoryFilter.value === 'all' || item.type === categoryFilter.value) &&
        (watchlistTagFilter.value === 'all' || item.watchlistTag === watchlistTagFilter.value)) {
      createCardElement(item, watchlistContainer);
    }
  });
}

function createCardElement(cardData, container) {
  const card = document.createElement('div');
  card.classList.add('card');
  card.dataset.id = cardData.id;
  card.innerHTML = `
    <img src="${cardData.posterUrl}" alt="${cardData.title}">
    <div class="overlay">
      <div class="title">${cardData.title}</div>
      <div class="action-buttons">
        <button class="btn btn-info" onclick="openDetailModalHandler(event, '${cardData.id}')">Info</button>
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
  const snapshot = await getDocuments(`users/${userId}/cards`);
  let title = "";
  snapshot.forEach(doc => {
    if (doc.id === docId) title = doc.data().title;
  });
  await deleteDocument(`users/${userId}/cards`, docId);
  card.remove();
  addToActivityLog(`Deleted "${title}"`);
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
    const watchlistTag = watchLater ? watchlistTagSelect.value : null;
    const results = await fetchTMDBResults(titleInput.value, type);
    if (results.length) {
      const result = results[0];
      const details = await fetchTMDBDetails(result.id, type);
      const data = {
        title: result.title || result.name,
        overview: result.overview,
        rating: result.vote_average,
        releaseDate: type === 'movie' ? result.release_date : result.first_air_date,
        posterUrl: result.poster_path ? TMDB_IMG_BASE + result.poster_path : "",
        type: type,
        userRating: userRating,
        watchLater: watchLater,
        watchlistTag: watchlistTag,
        cast: details ? details.credits.cast.slice(0, 3).map(c => c.name).join(', ') : '',
        genres: details ? details.genres.map(g => g.name).join(', ') : '',
        runtime: details ? (details.runtime || details.episode_run_time ? details.episode_run_time[0] : 'N/A') : 'N/A'
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
      addToActivityLog(`Edited "${data.title}"`);
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
  watchlistTagSelect.style.display = 'none';
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
    detailCast.textContent = `Cast: ${cardData.cast || 'N/A'}`;
    detailGenres.textContent = `Genres: ${cardData.genres || 'N/A'}`;
    detailRuntime.textContent = `Runtime: ${cardData.runtime || 'N/A'} min`;
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
    dashboardPhoto.src = url;
    await updateUserProfile(auth.currentUser, { photoURL: url });
    addToActivityLog("Updated profile picture");
    trackEvent('profile_pic_updated', { user_id: userId });
  }
};

saveProfileBtn.onclick = async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const profileData = {
    nickname: profileNickname.value || user.displayName || "Anonymous",
    tagline: profileTagline.value || "Movie & TV Fan",
    bio: profileBio.value || "Tell us about yourself..."
  };
  await setDocument(`users/${user.uid}/profile`, "profile", profileData);
  profileNicknameDisplay.textContent = profileData.nickname;
  profileTaglineDisplay.textContent = profileData.tagline;
  profileBioDisplay.textContent = profileData.bio;
  dashboardNickname.textContent = profileData.nickname;
  addToActivityLog("Updated profile");
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
      const posterUrl = item.poster_path ? `${TMDB_IMG_BASE}${item.poster_path}` : 'https://via.placeholder.com/180';
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
    trendingContainer.innerHTML = '<p>Failed to load trending items.</p>';
  }
}

async function fetchTrendingDetails(id, mediaType) {
  try {
    const data = await fetchTMDBDetails(id, mediaType);
    if (!data) throw new Error("Failed to fetch details");
    detailPoster.src = data.poster_path ? `${TMDB_IMG_BASE}${data.poster_path}` : 'https://via.placeholder.com/200';
    detailTitle.textContent = data.title || data.name;
    detailOverview.textContent = data.overview;
    detailRating.textContent = `TMDB Rating: ${data.vote_average}/10`;
    detailUserRating.textContent = "Your Rating: Not Rated";
    detailRelease.textContent = `Released: ${data.release_date || data.first_air_date}`;
    detailCast.textContent = `Cast: ${data.credits.cast.slice(0, 3).map(c => c.name).join(', ') || 'N/A'}`;
    detailGenres.textContent = `Genres: ${data.genres.map(g => g.name).join(', ') || 'N/A'}`;
    detailRuntime.textContent = `Runtime: ${data.runtime || data.episode_run_time ? data.episode_run_time[0] : 'N/A'} min`;
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
      if (data.genres) data.genres.split(', ').forEach(g => genres.add(g));
    });
    const genreIds = Array.from(genres).slice(0, 2).join(',');
    const res = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreIds}&sort_by=popularity.desc`);
    if (!res.ok) throw new Error("Failed to fetch recommendations");
    const data = await res.json();
    recommendationsContainer.innerHTML = '';
    data.results.slice(0, 6).forEach(item => {
      const card = document.createElement('div');
      card.classList.add('card');
      const posterUrl = item.poster_path ? `${TMDB_IMG_BASE}${item.poster_path}` : 'https://via.placeholder.com/180';
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
    recommendationsContainer.innerHTML = '<p>Failed to load recommendations.</p>';
  }
}

async function updateDashboardStats() {
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
  dashboardTotalFavorites.textContent = total;
  dashboardAvgRating.textContent = ratedCount ? (totalRating / ratedCount).toFixed(1) : 'N/A';
}

async function updateRatingsHistogram() {
  const userId = auth.currentUser.uid;
  const snapshot = await getDocuments(`users/${userId}/cards`);
  const ratings = Array(11).fill(0); // 0-10 scale
  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.watchLater && data.userRating) {
      ratings[parseInt(data.userRating)]++;
    }
  });

  if (histogramChart) histogramChart.destroy();
  histogramChart = new Chart(ratingsHistogram, {
    type: 'bar',
    data: {
      labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      datasets: [{
        label: 'Your Ratings Distribution',
        data: ratings,
        backgroundColor: 'rgba(245, 197, 24, 0.7)',
        borderColor: 'rgba(245, 197, 24, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

async function updateActivityLog() {
  const userId = auth.currentUser.uid;
  const snapshot = await getDocuments(`users/${userId}/activity`);
  activityLog.innerHTML = '';
  let activities = [];
  snapshot.forEach(doc => activities.push(doc.data()));
  activities.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
  activities.slice(0, 5).forEach(activity => {
    const li = document.createElement('li');
    li.textContent = `${activity.action} - ${new Date(activity.timestamp?.toMillis()).toLocaleString()}`;
    activityLog.appendChild(li);
  });
}

async function addToActivityLog(action) {
  const userId = auth.currentUser.uid;
  await addDocument(`users/${userId}/activity`, { action, timestamp: serverTimestamp() });
  updateActivityLog();
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
  
  // JSON Export
  const json = JSON.stringify(favorites, null, 2);
  const jsonBlob = new Blob([json], { type: 'application/json' });
  const jsonUrl = URL.createObjectURL(jsonBlob);
  const jsonA = document.createElement('a');
  jsonA.href = jsonUrl;
  jsonA.download = 'ur_favs_export.json';
  jsonA.click();
  URL.revokeObjectURL(jsonUrl);

  // CSV Export
  const csv = 'Title,Type,Rating,Release Date,Watch Later,Tag\n' + favorites.map(f => 
    `"${f.title.replace(/"/g, '""')}",${f.type},${f.userRating || ''},${f.releaseDate},${f.watchLater ? 'Yes' : 'No'},${f.watchlistTag || ''}`
  ).join('\n');
  const csvBlob = new Blob([csv], { type: 'text/csv' });
  const csvUrl = URL.createObjectURL(csvBlob);
  const csvA = document.createElement('a');
  csvA.href = csvUrl;
  csvA.download = 'ur_favs_export.csv';
  csvA.click();
  URL.revokeObjectURL(csvUrl);

  addToActivityLog("Exported favorites");
  trackEvent('favorites_exported', { count: favorites.length });
};

shareBtn.onclick = async (e) => {
  e.preventDefault();
  const userId = auth.currentUser.uid;
  const snapshot = await getDocuments(`users/${userId}/cards`);
  const favorites = [];
  snapshot.forEach(doc => favorites.push(doc.data().title));
  const shareText = `My favorites on UR FAV'S: ${favorites.slice(0, 3).join(', ')} and more! Check it out at ${window.location.origin}`;
  if (navigator.share) {
    await navigator.share({ title: "UR FAV'S", text: shareText, url: window.location.origin });
    trackEvent('social_share', { platform: 'native' });
  } else {
    alert(shareText);
    trackEvent('social_share_fallback', {});
  }
  addToActivityLog("Shared favorites");
};

randomPickBtn.onclick = async (e) => {
  e.preventDefault();
  const userId = auth.currentUser.uid;
  const snapshot = await getDocuments(`users/${userId}/cards`);
  const items = [];
  snapshot.forEach(doc => items.push(doc.data()));
  if (items.length) {
    const randomItem = items[Math.floor(Math.random() * items.length)];
    alert(`Random Pick: "${randomItem.title}" (${randomItem.watchLater ? 'Watch Later' : 'Favorite'})`);
    trackEvent('random_pick', { title: randomItem.title });
    addToActivityLog(`Randomly picked "${randomItem.title}"`);
  }
};

categoryFilter.onchange = () => {
  loadCards();
  loadWatchlist();
};

sortFavorites.onchange = () => loadCards();
watchlistTagFilter.onchange = () => loadWatchlist();
