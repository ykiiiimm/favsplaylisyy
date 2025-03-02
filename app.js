document.addEventListener('DOMContentLoaded', () => {
    const TMDB_API_KEY = "0b1121a7a8eda7a6ecc7fdfa631ad27a";
    const TMDB_BASE_URL = "https://api.themoviedb.org/3";
    const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";

    // DOM Elements
    const elements = {
        openModalBtn: document.getElementById('openModalBtn'),
        modal: document.getElementById('modal'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        submitBtn: document.getElementById('submitBtn'),
        cardContainer: document.getElementById('card-container'),
        watchlistContainer: document.getElementById('watchlistContainer'),
        titleInput: document.getElementById('title'),
        contentTypeSelect: document.getElementById('content-type'),
        seasonInput: document.getElementById('season'),
        userRatingInput: document.getElementById('userRating'),
        watchLaterCheckbox: document.getElementById('watchLater'),
        watchlistTagSelect: document.getElementById('watchlistTag'),
        fetchTmdbBtn: document.getElementById('fetchTmdbBtn'),
        tmdbPreview: document.getElementById('tmdbPreview'),
        clearPreviewBtn: document.getElementById('clearPreviewBtn'),
        searchInput: document.getElementById('searchInput'),
        detailModal: document.getElementById('detailModal'),
        closeDetailModal: document.getElementById('closeDetailModal'),
        detailPoster: document.getElementById('detailPoster'),
        detailTitle: document.getElementById('detailTitle'),
        detailOverview: document.getElementById('detailOverview'),
        detailRating: document.getElementById('detailRating'),
        detailUserRating: document.getElementById('detailUserRating'),
        detailRelease: document.getElementById('detailRelease'),
        detailCast: document.getElementById('detailCast'),
        detailGenres: document.getElementById('detailGenres'),
        detailRuntime: document.getElementById('detailRuntime'),
        profileBtn: document.getElementById('profileBtn'),
        profileModal: document.getElementById('profileModal'),
        closeProfileModal: document.getElementById('closeProfileModal'),
        profilePhoto: document.getElementById('profilePhoto'),
        profileNicknameDisplay: document.getElementById('profileNicknameDisplay'),
        profileTaglineDisplay: document.getElementById('profileTaglineDisplay'),
        profileBioDisplay: document.getElementById('profileBioDisplay'),
        profilePicInput: document.getElementById('profilePicInput'),
        profileNickname: document.getElementById('profileNickname'),
        profileTagline: document.getElementById('profileTagline'),
        profileBio: document.getElementById('profileBio'),
        saveProfileBtn: document.getElementById('saveProfileBtn'),
        dashboardBtn: document.getElementById('dashboardBtn'),
        dashboardModal: document.getElementById('dashboardModal'),
        closeDashboardModal: document.getElementById('closeDashboardModal'),
        dashboardPhoto: document.getElementById('dashboardPhoto'),
        dashboardNickname: document.getElementById('dashboardNickname'),
        dashboardTotalFavorites: document.getElementById('dashboardTotalFavorites'),
        dashboardAvgRating: document.getElementById('dashboardAvgRating'),
        voiceSearchBtn: document.getElementById('voiceSearchBtn'),
        themeToggle: document.getElementById('themeToggle'),
        trendingContainer: document.getElementById('trendingContainer'),
        recommendationsContainer: document.getElementById('recommendationsContainer'),
        ratingsHistogram: document.getElementById('ratingsHistogram'),
        activityLog: document.getElementById('activityLog'),
        loginModal: document.getElementById('loginModal'),
        closeLoginModal: document.getElementById('closeLoginModal'),
        googleLoginBtn: document.getElementById('googleLoginBtn'),
        homeBtn: document.getElementById('homeBtn'),
        exportBtn: document.getElementById('exportBtn'),
        shareBtn: document.getElementById('shareBtn'),
        randomPickBtn: document.getElementById('randomPickBtn'),
        categoryFilter: document.getElementById('categoryFilter'),
        watchlistTagFilter: document.getElementById('watchlistTagFilter'),
        sortFavorites: document.getElementById('sortFavorites'),
        logoutBtn: document.getElementById('logoutBtn')
    };

    const { loginWithGoogle, logout, monitorAuthState, updateUserProfile,
            addDocument, getDocuments, getWatchlistDocuments, deleteDocument,
            updateDocument, setDocument, uploadFile, trackEvent, auth } = window.firebaseUtils;

    let selectedTMDBData = null;

    // Initialize
    function init() {
        Object.values(elements).forEach(el => {
            if (!el) console.error("Missing DOM element");
        });
        monitorAuthState(handleAuthState);
        setupEventListeners();
        initVoiceSearch();
    }

    function handleAuthState(user) {
        if (user) {
            document.body.classList.add('logged-in');
            loadCards();
            loadWatchlist();
            loadTrending();
            loadRecommendations();
            updateRatingsHistogram();
            updateActivityLog();
            elements.loginModal.classList.remove('open');
        } else {
            document.body.classList.remove('logged-in');
            elements.loginModal.classList.add('open');
        }
    }

    function setupEventListeners() {
        elements.openModalBtn.onclick = () => auth.currentUser ? elements.modal.classList.add('open') : elements.loginModal.classList.add('open');
        elements.closeModalBtn.onclick = () => elements.modal.classList.remove('open');
        elements.submitBtn.onclick = handleSubmit;
        elements.fetchTmdbBtn.onclick = handleFetchTMDB;
        elements.clearPreviewBtn.onclick = () => { elements.tmdbPreview.innerHTML = ""; selectedTMDBData = null; };
        elements.googleLoginBtn.onclick = () => loginWithGoogle().then(() => elements.loginModal.classList.remove('open')).catch(console.error);
        elements.closeLoginModal.onclick = () => elements.loginModal.classList.remove('open');
        elements.profileBtn.onclick = handleProfileClick;
        elements.closeProfileModal.onclick = () => elements.profileModal.classList.remove('open');
        elements.saveProfileBtn.onclick = handleSaveProfile;
        elements.dashboardBtn.onclick = handleDashboardClick;
        elements.closeDashboardModal.onclick = () => elements.dashboardModal.classList.remove('open');
        elements.themeToggle.onclick = () => {
            document.documentElement.classList.toggle('light-mode');
            elements.themeToggle.innerHTML = document.documentElement.classList.contains('light-mode') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        };
        elements.logoutBtn.onclick = () => logout().catch(console.error);
        elements.homeBtn.onclick = () => { loadCards(); loadWatchlist(); loadTrending(); loadRecommendations(); };
        elements.exportBtn.onclick = handleExport;
        elements.shareBtn.onclick = handleShare;
        elements.randomPickBtn.onclick = handleRandomPick;
        elements.closeDetailModal.onclick = () => elements.detailModal.classList.remove('open');
        elements.contentTypeSelect.onchange = () => {
            elements.seasonInput.style.display = elements.contentTypeSelect.value === 'tv' ? 'block' : 'none';
            elements.watchlistTagSelect.style.display = elements.watchLaterCheckbox.checked ? 'block' : 'none';
        };
        elements.watchLaterCheckbox.onchange = () => elements.watchlistTagSelect.style.display = elements.watchLaterCheckbox.checked ? 'block' : 'none';
        elements.searchInput.oninput = () => searchCards(elements.searchInput.value);
        elements.profilePicInput.onchange = handleProfilePicChange;
        elements.categoryFilter.onchange = () => { loadCards(); loadWatchlist(); };
        elements.sortFavorites.onchange = loadCards;
        elements.watchlistTagFilter.onchange = loadWatchlist;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!selectedTMDBData || !auth.currentUser) return;
        await saveCard(selectedTMDBData);
        await Promise.all([loadCards(), loadWatchlist()]);
        resetModal();
    }

    async function handleFetchTMDB(e) {
        e.preventDefault();
        const title = elements.titleInput.value;
        const type = elements.contentTypeSelect.value;
        if (title) displayTMDBOptions(await fetchTMDBResults(title, type));
    }

    async function handleProfileClick() {
        const user = auth.currentUser;
        if (!user) return elements.loginModal.classList.add('open');
        elements.profilePhoto.src = user.photoURL || 'https://via.placeholder.com/100';
        const snapshot = await getDocuments(`users/${user.uid}/profile`);
        const profileData = snapshot.docs[0]?.data() || {};
        elements.profileNicknameDisplay.textContent = profileData.nickname || user.displayName || "Anonymous";
        elements.profileTaglineDisplay.textContent = profileData.tagline || "Movie & TV Fan";
        elements.profileBioDisplay.textContent = profileData.bio || "Tell us about yourself...";
        elements.profileModal.classList.add('open');
    }

    async function handleSaveProfile(e) {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        const profileData = {
            nickname: elements.profileNickname.value || user.displayName || "Anonymous",
            tagline: elements.profileTagline.value || "Movie & TV Fan",
            bio: elements.profileBio.value || "Tell us about yourself..."
        };
        await setDocument(`users/${user.uid}/profile`, 'profile', profileData);
        updateProfileDisplay(profileData);
        elements.profileModal.classList.remove('open');
    }

    async function handleDashboardClick() {
        const user = auth.currentUser;
        if (!user) return elements.loginModal.classList.add('open');
        elements.dashboardPhoto.src = user.photoURL || 'https://via.placeholder.com/100';
        const snapshot = await getDocuments(`users/${user.uid}/profile`);
        const profileData = snapshot.docs[0]?.data() || {};
        elements.dashboardNickname.textContent = profileData.nickname || user.displayName || "Anonymous";
        updateDashboardStats();
        elements.dashboardModal.classList.add('open');
    }

    async function handleExport(e) {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        const snapshot = await getDocuments(`users/${user.uid}/cards`);
        const favorites = snapshot.docs.map(doc => doc.data());
        exportData(favorites);
    }

    async function handleShare(e) {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        const snapshot = await getDocuments(`users/${user.uid}/cards`);
        const favorites = snapshot.docs.map(doc => doc.data().title);
        const shareText = `My favorites on UR FAV'S: ${favorites.slice(0, 3).join(', ')} and more! Check it out at ${window.location.origin}`;
        navigator.share ? await navigator.share({ title: "UR FAV'S", text: shareText, url: window.location.origin }) : alert(shareText);
    }

    async function handleRandomPick(e) {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        const snapshot = await getDocuments(`users/${user.uid}/cards`);
        const items = snapshot.docs.map(doc => doc.data());
        if (items.length) alert(`Random Pick: "${items[Math.floor(Math.random() * items.length)].title}"`);
    }

    async function handleProfilePicChange() {
        const file = elements.profilePicInput.files[0];
        if (file && auth.currentUser) {
            const url = await uploadFile(file, `users/${auth.currentUser.uid}/profile-pic`);
            elements.profilePhoto.src = url;
            elements.dashboardPhoto.src = url;
            await updateUserProfile(auth.currentUser, { photoURL: url });
        }
    }

    function initVoiceSearch() {
        const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!recognition) return elements.voiceSearchBtn.style.display = 'none';
        const speech = new recognition();
        speech.onresult = (event) => {
            elements.searchInput.value = event.results[0][0].transcript;
            searchCards(elements.searchInput.value);
        };
        elements.voiceSearchBtn.onclick = () => speech.start();
    }

    async function fetchTMDBResults(title, type) {
        try {
            const res = await fetch(`${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
            return (await res.json()).results || [];
        } catch (error) {
            console.error("TMDB fetch error:", error);
            return [];
        }
    }

    async function fetchTMDBDetails(id, type) {
        try {
            const res = await fetch(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits`);
            return await res.json();
        } catch (error) {
            console.error("TMDB details error:", error);
            return null;
        }
    }

    function displayTMDBOptions(results) {
        elements.tmdbPreview.innerHTML = results.length ? results.map(result => `
            <div class="tmdb-option" onclick="selectTMDB(${result.id})">
                <img src="${result.poster_path ? TMDB_IMG_BASE + result.poster_path : 'https://via.placeholder.com/50'}" alt="${result.title || result.name}">
                <p>${result.title || result.name} (${(result.release_date || result.first_air_date || '').substring(0, 4)})</p>
            </div>
        `).join('') : "No results found.";
    }

    window.selectTMDB = async (id) => {
        const details = await fetchTMDBDetails(id, elements.contentTypeSelect.value);
        if (!details) return;
        selectedTMDBData = {
            title: details.title || details.name,
            overview: details.overview,
            rating: details.vote_average,
            releaseDate: elements.contentTypeSelect.value === 'movie' ? details.release_date : details.first_air_date,
            posterUrl: details.poster_path ? TMDB_IMG_BASE + details.poster_path : 'https://via.placeholder.com/50',
            type: elements.contentTypeSelect.value,
            userRating: elements.userRatingInput.value || null,
            watchLater: elements.watchLaterCheckbox.checked,
            watchlistTag: elements.watchLaterCheckbox.checked ? elements.watchlistTagSelect.value : null,
            cast: details.credits.cast.slice(0, 3).map(c => c.name).join(', '),
            genres: details.genres.map(g => g.name).join(', '),
            runtime: details.runtime || (details.episode_run_time?.[0]) || 'N/A'
        };
        elements.tmdbPreview.innerHTML = `<img src="${selectedTMDBData.posterUrl}" alt="${selectedTMDBData.title}"><h3>${selectedTMDBData.title}</h3><p>${selectedTMDBData.overview.substring(0, 100)}...</p>`;
    };

    async function saveCard(cardData) {
        if (!auth.currentUser) return;
        await addDocument(`users/${auth.currentUser.uid}/cards`, cardData);
    }

    async function loadCards() {
        if (!auth.currentUser) return;
        const snapshot = await getDocuments(`users/${auth.currentUser.uid}/cards`);
        const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(card => !card.watchLater);
        cards.sort((a, b) => {
            const sortBy = elements.sortFavorites.value;
            return sortBy === 'title' ? a.title.localeCompare(b.title) :
                   sortBy === 'rating' ? (b.userRating || 0) - (a.userRating || 0) :
                   b.timestamp?.toMillis() - a.timestamp?.toMillis();
        });
        elements.cardContainer.innerHTML = cards
            .filter(card => elements.categoryFilter.value === 'all' || card.type === elements.categoryFilter.value)
            .map(card => createCardHTML(card)).join('');
        updateRatingsHistogram();
    }

    async function loadWatchlist() {
        if (!auth.currentUser) return;
        const snapshot = await getWatchlistDocuments(`users/${auth.currentUser.uid}/cards`);
        const watchlist = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        elements.watchlistContainer.innerHTML = watchlist
            .filter(item => (elements.categoryFilter.value === 'all' || item.type === elements.categoryFilter.value) &&
                          (elements.watchlistTagFilter.value === 'all' || item.watchlistTag === elements.watchlistTagFilter.value))
            .map(item => createCardHTML(item)).join('');
    }

    function createCardHTML(cardData) {
        return `
            <div class="card" data-id="${cardData.id}">
                <img src="${cardData.posterUrl}" alt="${cardData.title}">
                <div class="overlay">
                    <div class="title">${cardData.title}</div>
                    <div class="action-buttons">
                        <button class="btn btn-info" onclick="openDetailModal('${cardData.id}')">Info</button>
                        <button class="btn btn-edit" onclick="editCard('${cardData.id}')">Edit</button>
                        <button class="btn btn-delete" onclick="deleteCard('${cardData.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }

    window.deleteCard = async (docId) => {
        if (!auth.currentUser) return;
        await deleteDocument(`users/${auth.currentUser.uid}/cards`, docId);
        await Promise.all([loadCards(), loadWatchlist()]);
    };

    window.editCard = async (docId) => {
        if (!auth.currentUser) return;
        const snapshot = await getDocuments(`users/${auth.currentUser.uid}/cards`);
        const card = snapshot.docs.find(doc => doc.id === docId)?.data();
        if (!card) return;
        elements.titleInput.value = card.title;
        elements.contentTypeSelect.value = card.type;
        elements.seasonInput.value = '';
        elements.userRatingInput.value = card.userRating || '';
        elements.watchLaterCheckbox.checked = card.watchLater;
        elements.watchlistTagSelect.value = card.watchlistTag || '';
        elements.modal.classList.add('open');
        elements.submitBtn.onclick = async (e) => {
            e.preventDefault();
            const updatedData = { ...selectedTMDBData, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
            await updateDocument(`users/${auth.currentUser.uid}/cards`, docId, updatedData);
            await Promise.all([loadCards(), loadWatchlist()]);
            resetModal();
        };
    };

    window.openDetailModal = async (docId) => {
        if (!auth.currentUser) return;
        const snapshot = await getDocuments(`users/${auth.currentUser.uid}/cards`);
        const cardData = snapshot.docs.find(doc => doc.id === docId)?.data();
        if (cardData) {
            elements.detailPoster.src = cardData.posterUrl;
            elements.detailTitle.textContent = cardData.title;
            elements.detailOverview.textContent = cardData.overview;
            elements.detailRating.textContent = `TMDB Rating: ${cardData.rating}/10`;
            elements.detailUserRating.textContent = `Your Rating: ${cardData.userRating || 'Not Rated'}/10`;
            elements.detailRelease.textContent = `Released: ${cardData.releaseDate}`;
            elements.detailCast.textContent = `Cast: ${cardData.cast || 'N/A'}`;
            elements.detailGenres.textContent = `Genres: ${cardData.genres || 'N/A'}`;
            elements.detailRuntime.textContent = `Runtime: ${cardData.runtime || 'N/A'} min`;
            elements.detailModal.classList.add('open');
        }
    };

    async function loadTrending() {
        const res = await fetch(`${TMDB_BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        elements.trendingContainer.innerHTML = data.results.slice(0, 8).map(item => `
            <div class="card">
                <img src="${item.poster_path ? TMDB_IMG_BASE + item.poster_path : 'https://via.placeholder.com/180'}" alt="${item.title || item.name}">
                <div class="overlay">
                    <div class="title">${item.title || item.name}</div>
                    <div class="action-buttons">
                        <button class="btn btn-info" onclick="fetchTrendingDetails('${item.id}', '${item.media_type}')">Info</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    window.fetchTrendingDetails = async (id, mediaType) => {
        const data = await fetchTMDBDetails(id, mediaType);
        if (data) {
            elements.detailPoster.src = data.poster_path ? TMDB_IMG_BASE + data.poster_path : 'https://via.placeholder.com/200';
            elements.detailTitle.textContent = data.title || data.name;
            elements.detailOverview.textContent = data.overview;
            elements.detailRating.textContent = `TMDB Rating: ${data.vote_average}/10`;
            elements.detailUserRating.textContent = "Your Rating: Not Rated";
            elements.detailRelease.textContent = `Released: ${data.release_date || data.first_air_date}`;
            elements.detailCast.textContent = `Cast: ${data.credits.cast.slice(0, 3).map(c => c.name).join(', ') || 'N/A'}`;
            elements.detailGenres.textContent = `Genres: ${data.genres.map(g => g.name).join(', ') || 'N/A'}`;
            elements.detailRuntime.textContent = `Runtime: ${data.runtime || (data.episode_run_time?.[0]) || 'N/A'} min`;
            elements.detailModal.classList.add('open');
        }
    };

    async function loadRecommendations() {
        if (!auth.currentUser) return;
        const snapshot = await getDocuments(`users/${auth.currentUser.uid}/cards`);
        const genres = new Set(snapshot.docs.flatMap(doc => doc.data().genres?.split(', ') || []));
        const res = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${Array.from(genres).slice(0, 2).join(',')}&sort_by=popularity.desc`);
        const data = await res.json();
        elements.recommendationsContainer.innerHTML = data.results.slice(0, 6).map(item => `
            <div class="card">
                <img src="${item.poster_path ? TMDB_IMG_BASE + item.poster_path : 'https://via.placeholder.com/180'}" alt="${item.title}">
                <div class="overlay">
                    <div class="title">${item.title}</div>
                    <div class="action-buttons">
                        <button class="btn btn-info" onclick="fetchTrendingDetails('${item.id}', 'movie')">Info</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async function updateDashboardStats() {
        if (!auth.currentUser) return;
        const snapshot = await getDocuments(`users/${auth.currentUser.uid}/cards`);
        const favorites = snapshot.docs.map(doc => doc.data()).filter(item => !item.watchLater);
        elements.dashboardTotalFavorites.textContent = favorites.length;
        const avgRating = favorites.reduce((sum, item) => sum + (parseInt(item.userRating) || 0), 0) / (favorites.filter(item => item.userRating).length || 1);
        elements.dashboardAvgRating.textContent = avgRating.toFixed(1) || 'N/A';
    }

    async function updateRatingsHistogram() {
        if (!auth.currentUser) return;
        const snapshot = await getDocuments(`users/${auth.currentUser.uid}/cards`);
        const ratings = Array(11).fill(0);
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (!data.watchLater && data.userRating) ratings[parseInt(data.userRating)]++;
        });
        if (window.histogramChart) window.histogramChart.destroy();
        window.histogramChart = new Chart(elements.ratingsHistogram, {
            type: 'bar',
            data: {
                labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
                datasets: [{ label: 'Your Ratings', data: ratings, backgroundColor: 'rgba(245, 197, 24, 0.7)', borderColor: 'rgba(245, 197, 24, 1)', borderWidth: 1 }]
            },
            options: { scales: { y: { beginAtZero: true } } }
        });
    }

    async function updateActivityLog() {
        if (!auth.currentUser) return;
        const snapshot = await window.firebaseUtils.db.collection(`users/${auth.currentUser.uid}/activity`).orderBy('timestamp', 'desc').limit(5).get();
        elements.activityLog.innerHTML = snapshot.docs.map(doc => `<li>${doc.data().action} - ${doc.data().timestamp ? new Date(doc.data().timestamp.toMillis()).toLocaleString() : 'N/A'}</li>`).join('');
    }

    function searchCards(query) {
        const lowerQuery = query.toLowerCase();
        document.querySelectorAll('.card').forEach(card => {
            card.style.display = card.querySelector('.title').textContent.toLowerCase().includes(lowerQuery) ? 'block' : 'none';
        });
    }

    function resetModal() {
        elements.modal.classList.remove('open');
        elements.titleInput.value = '';
        elements.seasonInput.value = '';
        elements.userRatingInput.value = '';
        elements.watchLaterCheckbox.checked = false;
        elements.watchlistTagSelect.style.display = 'none';
        elements.tmdbPreview.innerHTML = "";
        selectedTMDBData = null;
    }

    function updateProfileDisplay(profileData) {
        elements.profileNicknameDisplay.textContent = profileData.nickname;
        elements.profileTaglineDisplay.textContent = profileData.tagline;
        elements.profileBioDisplay.textContent = profileData.bio;
        elements.dashboardNickname.textContent = profileData.nickname;
    }

    function exportData(favorites) {
        const json = JSON.stringify(favorites, null, 2);
        const jsonBlob = new Blob([json], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonA = document.createElement('a');
        jsonA.href = jsonUrl;
        jsonA.download = 'ur_favs_export.json';
        jsonA.click();
        URL.revokeObjectURL(jsonUrl);

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
    }

    init();
});
