import { 
  auth, 
  db, 
  storage, 
  loginWithGoogle, 
  logout, 
  monitorAuthState, 
  updateUserProfile, 
  addDocument, 
  getDocuments, 
  deleteDocument, 
  updateDocument, 
  setDocument, 
  uploadFile, 
  getFileURL, 
  trackEvent 
} from './firebase.js';

const TMDB_API_KEY = "0b1121a7a8eda7a6ecc7fdfa631ad27a";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";

// DOM References
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
const detailModal = document.getElementById('detailModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const detailPoster = document.getElementById('detailPoster');
const detailTitle = document.getElementById('detailTitle');
const detailOverview = document.getElementById('detailOverview');
const detailRating = document.getElementById('detailRating');
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
const voiceSearchBtn = document.getElementById('voiceSearchBtn');
const themeToggle = document.getElementById('themeToggle');
const trendingContainer = document.getElementById('trendingContainer');
const loginModal = document.getElementById('loginModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const sidebarPhoto = document.getElementById('sidebarPhoto');
const sidebarNickname = document.getElementById('sidebarNickname');
const homeBtn = document.getElementById('homeBtn');

let selectedTMDBData = null;

// Galaxy View (Enhanced)
let scene, camera, renderer, starField;
function initGalaxy() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, 250 / 250, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('galaxyCanvas'), alpha: true });
  renderer.setSize(250, 250);

  const stars = [];
  getDocuments(`users/${auth.currentUser.uid}/cards`).then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const geometry = new THREE.SphereGeometry(2, 32, 32);
      const material = new THREE.MeshBasicMaterial({ 
        map: new THREE.TextureLoader().load(data.posterUrl),
        transparent: true
      });
      const star = new THREE.Mesh(geometry, material);
      star.position.set(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200
      );
      star.userData = { id: doc.id, title: data.title };
      stars.push(star);
      scene.add(star);
    });

    starField = new THREE.Group();
    stars.forEach(star => starField.add(star));
    scene.add(starField);

    // Add interactivity
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    galaxyView.addEventListener('mousemove', (e) => {
      const rect = galaxyCanvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / 250) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / 250) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(stars);
      if (intersects.length) {
        const star = intersects[0].object;
        star.scale.set(3, 3, 3);
        galaxyView.title = star.userData.title; // Tooltip
      } else {
        stars.forEach(s => s.scale.set(1, 1, 1));
        galaxyView.title = "";
      }
    });

    galaxyView.addEventListener('click', (e) => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(stars);
      if (intersects.length) openDetailModalHandler(e, intersects[0].object.userData.id);
    });
  });

  camera.position.z = 300;
  animateGalaxy();
}

function animateGalaxy() {
  requestAnimationFrame(animateGalaxy);
  if (starField) {
    starField.rotation.x += 0.002;
    starField.rotation.y += 0.002;
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
    voiceSearchBtn.addEventListener('click', () => recognition.start());
  } else {
    voiceSearchBtn.style.display = 'none';
  }
}

function searchCards(query) {
  const lowerQuery = query.toLowerCase();
  document.querySelectorAll('.card').forEach(card => {
    const title = card.querySelector('.title').textContent.toLowerCase();
    card.style.display = title.includes(lowerQuery) ? 'block' : 'none';
  });
}

// Login Handling
googleLoginBtn.addEventListener('click', () => {
  loginWithGoogle()
    .then(() => {
      loginModal.classList.remove('open');
      document.body.classList.add('logged-in');
      trackEvent('login', { method: 'google' });
    })
    .catch(error => console.error("Login error:", error));
});

closeLoginModal.addEventListener('click', () => loginModal.classList.remove('open'));

// Event Listeners
contentTypeSelect.addEventListener('change', () => {
  seasonInput.style.display = contentTypeSelect.value === 'tv' ? 'block' : 'none';
});

profileBtn.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (user) {
    profilePhoto.src = user.photoURL || 'https://via.placeholder.com/100';
    const profileSnap = await getDocuments(`users/${user.uid}/profile`);
    let profileData = {};
    profileSnap.forEach(doc => profileData = doc.data());
    profileNicknameDisplay.textContent = profileData.nickname || user.displayName || "Anonymous";
    profileTaglineDisplay.textContent = profileData.tagline || "Your tagline";
    profileBioDisplay.textContent = profileData.bio || "Write a bio...";
    profileModal.classList.add('open');
    trackEvent('profile_view', { user_id: user.uid });
  }
});

closeProfileModal.addEventListener('click', () => profileModal.classList.remove('open'));

monitorAuthState(user => {
  if (user) {
    document.body.classList.add('logged-in');
    loadCards();
    loadTrending();
    initVoiceSearch();
    sidebarPhoto.src = user.photoURL || 'https://via.placeholder.com/50';
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
  const searchUrl = type === 'movie' 
    ? `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
    : `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
  const res = await fetch(searchUrl);
  const data = await res.json();
  return data.results || [];
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
    option.addEventListener('click', async () => {
      const data = {
        title: name,
        overview: result.overview,
        rating: result.vote_average,
        releaseDate: contentTypeSelect.value === 'movie' ? result.release_date : result.first_air_date,
        posterUrl: posterPath
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
    });
    tmdbPreview.appendChild(option);
  });
}

async function saveCard(cardData) {
  const userId = auth.currentUser.uid;
  await addDocument(`users/${userId}/cards`, cardData);
  trackEvent('card_added', { title: cardData.title });
}

async function loadCards() {
  const userId = auth.currentUser.uid;
  const snapshot = await getDocuments(`users/${userId}/cards`);
  cardContainer.innerHTML = "";
  snapshot.forEach(doc => createCardElement(doc.data(), doc.id));
}

function createCardElement(cardData, docId) {
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
  cardContainer.appendChild(card);
}

window.deleteCard = async (e, button) => {
  e.preventDefault();
  const card = button.closest('.card');
  const docId = card.dataset.id;
  const userId = auth.currentUser.uid;
  await deleteDocument(`users/${userId}/cards`, docId);
  card.remove();
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
    const results = await fetchTMDBResults(titleInput.value, type);
    if (results.length) {
      const result = results[0];
      const data = {
        title: result.title || result.name,
        overview: result.overview,
        rating: result.vote_average,
        releaseDate: type === 'movie' ? result.release_date : result.first_air_date,
        posterUrl: result.poster_path ? TMDB_IMG_BASE + result.poster_path : ""
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
      trackEvent('card_edited', { title: data.title });
    }
  };
};

fetchTmdbBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const title = titleInput.value;
  const type = contentTypeSelect.value;
  if (title) {
    const results = await fetchTMDBResults(title, type);
    displayTMDBOptions(results);
  }
});

clearPreviewBtn.addEventListener('click', (e) => {
  e.preventDefault();
  tmdbPreview.innerHTML = "";
  selectedTMDBData = null;
});

submitBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  if (!selectedTMDBData) {
    alert("Please fetch and select a TMDB result.");
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

openModalBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (auth.currentUser) modal.classList.add('open');
  else loginModal.classList.add('open');
});

closeModalBtn.addEventListener('click', (e) => {
  e.preventDefault();
  modal.classList.remove('open');
});

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
    detailRating.textContent = `Rating: ${cardData.rating}/10`;
    detailRelease.textContent = `Released: ${cardData.releaseDate}`;
    detailModal.classList.add('open');
    trackEvent('card_details_viewed', { title: cardData.title });
  }
};

closeDetailModal.addEventListener('click', (e) => {
  e.preventDefault();
  detailModal.classList.remove('open');
});

searchInput.addEventListener('input', () => searchCards(searchInput.value));

profilePicInput.addEventListener('change', async () => {
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
});

saveProfileBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const profileData = {
    nickname: profileNickname.value || user.displayName || "Anonymous",
    tagline: profileTagline.value || "Your tagline",
    bio: profileBio.value || "Write a bio..."
  };
  await setDocument(`users/${user.uid}/profile`, "profile", profileData);
  profileNicknameDisplay.textContent = profileData.nickname;
  profileTaglineDisplay.textContent = profileData.tagline;
  profileBioDisplay.textContent = profileData.bio;
  sidebarNickname.textContent = profileData.nickname;
  profileModal.classList.remove('open');
  trackEvent('profile_updated', { user_id: user.uid });
});

// Fixed and Enhanced Trending
async function loadTrending() {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}`); // Changed to /day for fresher data
    if (!res.ok) throw new Error("Failed to fetch trending data");
    const data = await res.json();
    trendingContainer.innerHTML = '';
    data.results.slice(0, 8).forEach(item => { // Reduced to 8 for cleaner layout
      const card = document.createElement('div');
      card.classList.add('card');
      const posterUrl = item.poster_path ? `${TMDB_IMG_BASE}${item.poster_path}` : 'https://via.placeholder.com/200';
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
    console.error("Error loading trending:", error);
    trendingContainer.innerHTML = '<p>Unable to load trending items.</p>';
  }
}

async function fetchTrendingDetails(id, mediaType) {
  const url = `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  detailPoster.src = data.poster_path ? `${TMDB_IMG_BASE}${data.poster_path}` : 'https://via.placeholder.com/200';
  detailTitle.textContent = data.title || data.name;
  detailOverview.textContent = data.overview;
  detailRating.textContent = `Rating: ${data.vote_average}/10`;
  detailRelease.textContent = `Released: ${data.release_date || data.first_air_date}`;
  detailModal.classList.add('open');
  trackEvent('trending_details_viewed', { title: data.title || data.name });
}

galaxyToggle.addEventListener('click', (e) => {
  e.preventDefault();
  if (!auth.currentUser) {
    loginModal.classList.add('open');
    return;
  }
  galaxyView.classList.toggle('hidden');
  if (!galaxyView.classList.contains('hidden') && !starField) initGalaxy();
});

themeToggle.addEventListener('click', (e) => {
  e.preventDefault();
  document.documentElement.classList.toggle('light-mode');
  themeToggle.innerHTML = document.documentElement.classList.contains('light-mode') 
    ? '<i class="fas fa-sun"></i>' 
    : '<i class="fas fa-moon"></i>';
  trackEvent('theme_toggled', { mode: document.documentElement.classList.contains('light-mode') ? 'light' : 'dark' });
});

logoutBtn.addEventListener('click', (e) => {
  e.preventDefault();
  logout().then(() => {
    document.body.classList.remove('logged-in');
    loginModal.classList.add('open');
    trackEvent('logout', { user_id: auth.currentUser?.uid });
  }).catch(error => console.error("Logout error:", error));
});

homeBtn.addEventListener('click', (e) => {
  e.preventDefault();
  loadCards();
  loadTrending();
});
