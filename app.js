document.addEventListener('DOMContentLoaded', () => {
    const TMDB_API_KEY = "0b1121a7a8eda7a6ecc7fdfa631ad27a";
    const TMDB_BASE_URL = "https://api.themoviedb.org/3";
    const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";

    // DOM Elements
    const els = {
        loginModal: document.getElementById('loginModal'),
        googleLoginBtn: document.getElementById('googleLoginBtn'),
        closeLoginModal: document.getElementById('closeLoginModal'),
        logoutBtn: document.getElementById('logoutBtn'),
        openModalBtn: document.getElementById('openModalBtn'),
        modal: document.getElementById('modal'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        submitBtn: document.getElementById('submitBtn'),
        titleInput: document.getElementById('title'),
        contentTypeSelect: document.getElementById('content-type'),
        userRatingInput: document.getElementById('userRating'),
        watchLaterCheckbox: document.getElementById('watchLater'),
        fetchTmdbBtn: document.getElementById('fetchTmdbBtn'),
        tmdbPreview: document.getElementById('tmdbPreview'),
        cardContainer: document.getElementById('card-container'),
        watchlistContainer: document.getElementById('watchlistContainer'),
        trendingContainer: document.getElementById('trendingContainer'),
        detailModal: document.getElementById('detailModal'),
        closeDetailModal: document.getElementById('closeDetailModal'),
        detailPoster: document.getElementById('detailPoster'),
        detailTitle: document.getElementById('detailTitle'),
        detailOverview: document.getElementById('detailOverview'),
        detailRating: document.getElementById('detailRating'),
        detailUserRating: document.getElementById('detailUserRating'),
        detailRelease: document.getElementById('detailRelease')
    };

    const { loginWithGoogle, logout, monitorAuthState, addDocument, getDocuments, getWatchlistDocuments, deleteDocument, auth } = window.firebaseUtils;

    let selectedTMDBData = null;

    // Initialize
    function init() {
        monitorAuthState(handleAuthState);
        setupEventListeners();
    }

    // Auth State Handler
    function handleAuthState(user) {
        if (user) {
            els.loginModal.style.display = 'none';
            document.body.classList.add('logged-in');
            loadContent();
        } else {
            els.loginModal.style.display = 'flex';
            document.body.classList.remove('logged-in');
            clearContent();
        }
    }

    // Event Listeners
    function setupEventListeners() {
        els.googleLoginBtn.onclick = () => {
            loginWithGoogle()
                .then(() => els.loginModal.style.display = 'none')
                .catch(error => alert(`Login failed: ${error.message}`));
        };
        els.closeLoginModal.onclick = () => els.loginModal.style.display = 'none';
        els.logoutBtn.onclick = () => logout();
        els.openModalBtn.onclick = () => auth.currentUser ? els.modal.style.display = 'flex' : els.loginModal.style.display = 'flex';
        els.closeModalBtn.onclick = () => els.modal.style.display = 'none';
        els.fetchTmdbBtn.onclick = handleFetchTMDB;
        els.submitBtn.onclick = handleSubmit;
        els.closeDetailModal.onclick = () => els.detailModal.style.display = 'none';
    }

    // Fetch TMDB Data
    async function handleFetchTMDB() {
        const title = els.titleInput.value;
        const type = els.contentTypeSelect.value;
        if (!title) return;
        const results = await fetchTMDBResults(title, type);
        displayTMDBOptions(results);
    }

    // Submit New Title
    async function handleSubmit() {
        if (!selectedTMDBData || !auth.currentUser) return;
        await addDocument(`users/${auth.currentUser.uid}/cards`, selectedTMDBData);
        resetModal();
        loadContent();
    }

    // Load All Content
    async function loadContent() {
        await Promise.all([loadCards(), loadWatchlist(), loadTrending()]);
    }

    // Clear Content
    function clearContent() {
        els.cardContainer.innerHTML = '';
        els.watchlistContainer.innerHTML = '';
        els.trendingContainer.innerHTML = '';
    }

    // Fetch TMDB Results
    async function fetchTMDBResults(title, type) {
        const url = `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error("TMDB fetch error:", error);
            return [];
        }
    }

    // Fetch TMDB Details
    async function fetchTMDBDetails(id, type) {
        const url = `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("TMDB details error:", error);
            return null;
        }
    }

    // Display TMDB Options
    function displayTMDBOptions(results) {
        els.tmdbPreview.innerHTML = results.map(result => `
            <div class="tmdb-option" onclick="selectTMDB(${result.id})">
                <img src="${result.poster_path ? TMDB_IMG_BASE + result.poster_path : 'https://via.placeholder.com/50'}" alt="${result.title || result.name}">
                <p>${result.title || result.name} (${(result.release_date || result.first_air_date || '').substring(0, 4)})</p>
            </div>
        `).join('') || "No results found.";
    }

    // Select TMDB Item
    window.selectTMDB = async (id) => {
        const details = await fetchTMDBDetails(id, els.contentTypeSelect.value);
        if (!details) return;
        selectedTMDBData = {
            title: details.title || details.name,
            overview: details.overview,
            rating: details.vote_average,
            releaseDate: els.contentTypeSelect.value === 'movie' ? details.release_date : details.first_air_date,
            posterUrl: details.poster_path ? TMDB_IMG_BASE + details.poster_path : 'https://via.placeholder.com/50',
            type: els.contentTypeSelect.value,
            userRating: els.userRatingInput.value || null,
            watchLater: els.watchLaterCheckbox.checked
        };
        els.tmdbPreview.innerHTML = `<img src="${selectedTMDBData.posterUrl}" alt="${selectedTMDBData.title}"><p>${selectedTMDBData.title}</p>`;
    };

    // Load Cards
    async function loadCards() {
        if (!auth.currentUser) return;
        const snapshot = await getDocuments(`users/${auth.currentUser.uid}/cards`);
        els.cardContainer.innerHTML = snapshot.docs
            .filter(doc => !doc.data().watchLater)
            .map(doc => createCardHTML(doc.id, doc.data())).join('');
    }

    // Load Watchlist
    async function loadWatchlist() {
        if (!auth.currentUser) return;
        const snapshot = await getWatchlistDocuments(`users/${auth.currentUser.uid}/cards`);
        els.watchlistContainer.innerHTML = snapshot.docs
            .map(doc => createCardHTML(doc.id, doc.data())).join('');
    }

    // Load Trending
    async function loadTrending() {
        const response = await fetch(`${TMDB_BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        els.trendingContainer.innerHTML = data.results.slice(0, 8).map(item => `
            <div class="card">
                <img src="${item.poster_path ? TMDB_IMG_BASE + item.poster_path : 'https://via.placeholder.com/180'}" alt="${item.title || item.name}">
                <div class="overlay">
                    <div class="title">${item.title || item.name}</div>
                    <div class="action-buttons">
                        <button class="btn btn-info" onclick="showTrendingDetails('${item.id}', '${item.media_type}')">Info</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Create Card HTML
    function createCardHTML(id, data) {
        return `
            <div class="card" data-id="${id}">
                <img src="${data.posterUrl}" alt="${data.title}">
                <div class="overlay">
                    <div class="title">${data.title}</div>
                    <div class="action-buttons">
                        <button class="btn btn-info" onclick="showCardDetails('${id}')">Info</button>
                        <button class="btn btn-delete" onclick="deleteCard('${id}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }

    // Show Card Details
    window.showCardDetails = async (id) => {
        if (!auth.currentUser) return;
        const snapshot = await getDocuments(`users/${auth.currentUser.uid}/cards`);
        const card = snapshot.docs.find(doc => doc.id === id)?.data();
        if (card) showDetails(card);
    };

    // Show Trending Details
    window.showTrendingDetails = async (id, type) => {
        const data = await fetchTMDBDetails(id, type);
        if (data) showDetails({
            title: data.title || data.name,
            overview: data.overview,
            rating: data.vote_average,
            releaseDate: data.release_date || data.first_air_date,
            posterUrl: data.poster_path ? TMDB_IMG_BASE + data.poster_path : 'https://via.placeholder.com/200',
            userRating: null
        });
    };

    // Show Details in Modal
    function showDetails(data) {
        els.detailPoster.src = data.posterUrl;
        els.detailTitle.textContent = data.title;
        els.detailOverview.textContent = data.overview;
        els.detailRating.textContent = `TMDB Rating: ${data.rating || 'N/A'}/10`;
        els.detailUserRating.textContent = `Your Rating: ${data.userRating || 'Not Rated'}/10`;
        els.detailRelease.textContent = `Release: ${data.releaseDate || 'N/A'}`;
        els.detailModal.style.display = 'flex';
    }

    // Delete Card
    window.deleteCard = async (id) => {
        if (!auth.currentUser) return;
        await deleteDocument(`users/${auth.currentUser.uid}/cards`, id);
        loadContent();
    };

    // Reset Modal
    function resetModal() {
        els.modal.style.display = 'none';
        els.titleInput.value = '';
        els.userRatingInput.value = '';
        els.watchLaterCheckbox.checked = false;
        els.tmdbPreview.innerHTML = '';
        selectedTMDBData = null;
    }

    init();
});
