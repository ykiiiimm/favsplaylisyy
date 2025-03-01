import { auth, db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, signOut, signInWithPopup, GoogleAuthProvider } from './firebase.js';

const TMDB_API_KEY = "0b1121a7a8eda7a6ecc7fdfa631ad27a";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";
const provider = new GoogleAuthProvider();

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

let selectedTMDBData = null;

// Galaxy View (3D)
let scene, camera, renderer, stars;
function initGalaxy() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('galaxyCanvas') });
  renderer.setSize(250, 250); // Smaller for sidebar
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  getDocs(collection(db, "users", auth.currentUser.uid, "cards")).then(snapshot => {
    snapshot.forEach(doc => {
      const x = (Math.random() - 0.5) * 500;
      const y = (Math.random() - 0.5) * 500;
      const z = (Math.random() - 0.5) * 500;
      vertices.push(x, y, z);
    });
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ color: 0xf5c518, size: 3 });
    stars = new THREE.Points(geometry, material);
    scene.add(stars);
  });
  camera.position.z = 300;
  animateGalaxy();
}

function animateGalaxy() {
  requestAnimationFrame(animateGalaxy);
  stars.rotation.x += 0.002;
  stars.rotation.y += 0.002;
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
  signInWithPopup(auth, provider)
    .then(() => {
      loginModal.classList.remove('open');
      document.body.classList.add('logged-in');
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
    const profileSnap = await getDocs(collection(db, "users", user.uid, "profile"));
    let profileData = {};
    profileSnap.forEach(doc => profileData = doc.data());
    profileNicknameDisplay.textContent = profileData.nickname || user.displayName || "Anonymous";
    profileTaglineDisplay.textContent = profileData.tagline || "Your tagline";
    profileBioDisplay.textContent = profileData.bio || "Write a bio...";
    profileModal.classList.add('open');
  }
});

closeProfileModal.addEventListener('click', () => profileModal.classList.remove('open'));

auth.onAuthStateChanged(user => {
  if (user) {
    document.body.classList.add('logged-in');
    loadCards();
    loadTrending();
    initVoiceSearch();
    sidebarPhoto.src = user.photoURL || 'https://via.placeholder.com/50';
    sidebarNickname.textContent = user.displayName || "Anonymous";
    getDocs(collection(db, "users", user.uid, "profile")).then(snap => {
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
        try {
          const seasonRes = await fetch(`${TMDB_BASE_URL}/tv/${result.id}/season/${seasonInput.value}?api_key=${TMDB_API_KEY}`);
          const seasonData = await seasonRes.json();
          if (seasonData.poster_path) data.posterUrl = TMDB_IMG_BASE + seasonData.poster_path;
          data.overview = seasonData.overview || data.overview;
          data.releaseDate = seasonData.air_date || data.releaseDate;
        } catch (err) {
          console.error("Error fetching season:", err);
        }
      }
      selectedTMDBData = data;
      tmdbPreview.innerHTML = `<img src="${data.posterUrl}" alt="${data.title}"><h3>${data.title}</h3><p>${data.overview.substring(0, 100)}...</p>`;
    });
    tmdbPreview.appendChild(option);
  });
}

async function saveCard(cardData) {
  const userId = auth.currentUser.uid;
  await addDoc(collection(db, "users", userId, "cards"), cardData);
}

async function loadCards() {
  const userId = auth.currentUser.uid;
  const snapshot = await getDocs(collection(db, "users", userId, "cards"));
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
  await deleteDoc(doc(db, "users", userId, "cards", docId));
  card.remove();
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
      await updateDoc(doc(db, "users", userId, "cards", docId), data);
      card.querySelector('img').src = data.posterUrl;
      card.querySelector('.title').textContent = data.title;
      modal.classList.remove('open');
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
  const snapshot = await getDocs(collection(db, "users", userId, "cards"));
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
  }
};

closeDetailModal.addEventListener('click', (e) => {
  e.preventDefault();
  detailModal.classList.remove('open');
});

searchInput.addEventListener('input', () => searchCards(searchInput.value));

profilePicInput.addEventListener('change', () => {
  const file = profilePicInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      profilePhoto.src = e.target.result;
      sidebarPhoto.src = e.target.result;
    };
    reader.readAsDataURL(file);
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
  await setDoc(doc(db, "users", user.uid, "profile", "profile"), profileData);
  profileNicknameDisplay.textContent = profileData.nickname;
  profileTaglineDisplay.textContent = profileData.tagline;
  profileBioDisplay.textContent = profileData.bio;
  sidebarNickname.textContent = profileData.nickname;
  profileModal.classList.remove('open');
});

async function loadTrending() {
  const res = await fetch(`${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}`);
  const data = await res.json();
  trendingContainer.innerHTML = '';
  data.results.slice(0, 10).forEach(item => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
      <img src="${TMDB_IMG_BASE}${item.poster_path}" alt="${item.title || item.name}">
      <div class="overlay">
        <div class="title">${item.title || item.name}</div>
      </div>
    `;
    trendingContainer.appendChild(card);
  });
}

galaxyToggle.addEventListener('click', (e) => {
  e.preventDefault();
  if (!auth.currentUser) {
    loginModal.classList.add('open');
    return;
  }
  galaxyView.classList.toggle('hidden');
  if (!galaxyView.classList.contains('hidden') && !stars) initGalaxy();
});

themeToggle.addEventListener('click', (e) => {
  e.preventDefault();
  document.documentElement.classList.toggle('light-mode');
  themeToggle.innerHTML = document.documentElement.classList.contains('light-mode') 
    ? '<i class="fas fa-sun"></i>' 
    : '<i class="fas fa-moon"></i>';
});

logoutBtn.addEventListener('click', (e) => {
  e.preventDefault();
  signOut(auth).then(() => {
    document.body.classList.remove('logged-in');
    loginModal.classList.add('open');
  }).catch(error => console.error("Logout error:", error));
});

homeBtn.addEventListener('click', (e) => {
  e.preventDefault();
  loadCards();
  loadTrending();
});
