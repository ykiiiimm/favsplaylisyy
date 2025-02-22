import { auth, db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from './firebase.js';

const openModalBtn = document.getElementById('openModalBtn');
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('closeModalBtn');
const submitBtn = document.getElementById('submitBtn');
const cardContainer = document.getElementById('card-container');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const imageUrlInput = document.getElementById('image-url');
const searchInput = document.querySelector('.search-bar input');
const fetchDetailsBtn = document.getElementById('fetchDetailsBtn'); // Button to fetch TMDb details
const mediaTypeSelect = document.getElementById('mediaType');
const seasonSelect = document.getElementById('seasonSelect');
const seasonLabel = document.getElementById('seasonLabel');

// Toggle season dropdown based on media type selection
mediaTypeSelect.addEventListener('change', () => {
  if (mediaTypeSelect.value === 'tv') {
    seasonSelect.style.display = 'block';
    seasonLabel.style.display = 'block';
  } else {
    seasonSelect.style.display = 'none';
    seasonLabel.style.display = 'none';
  }
});

// Load cards on login
auth.onAuthStateChanged((user) => {
  if (user) {
    loadCards();
  }
});

// Save card to Firestore
async function saveCard(title, description, imageUrl) {
  try {
    const userId = auth.currentUser.uid;
    await addDoc(collection(db, "users", userId, "cards"), {
      title,
      description,
      imageUrl
    });
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

// Create card element
function createCardElement(cardData, docId) {
  const card = document.createElement('div');
  card.classList.add('card');
  card.dataset.id = docId;
  card.innerHTML = `
    <img src="${cardData.imageUrl}" alt="Poster">
    <div class="overlay">
      <div class="title">${cardData.title}</div>
      <div class="description">${cardData.description}</div>
      <div>
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

// Edit card
window.editCard = (button) => {
  const card = button.closest('.card');
  const docId = card.dataset.id;
  const currentTitle = card.querySelector('.title').textContent;
  const currentDescription = card.querySelector('.description').textContent;
  const currentImageUrl = card.querySelector('img').src;

  titleInput.value = currentTitle;
  descriptionInput.value = currentDescription;
  imageUrlInput.value = currentImageUrl;
  modal.classList.add('open');

  // Replace any previous click handlers on submitBtn
  submitBtn.onclick = async (e) => {
    e.preventDefault();
    if (titleInput.value && descriptionInput.value && imageUrlInput.value) {
      try {
        const userId = auth.currentUser.uid;
        await updateDoc(doc(db, "users", userId, "cards", docId), {
          title: titleInput.value,
          description: descriptionInput.value,
          imageUrl: imageUrlInput.value
        });
        card.querySelector('.title').textContent = titleInput.value;
        card.querySelector('.description').textContent = descriptionInput.value;
        card.querySelector('img').src = imageUrlInput.value;
        modal.classList.remove('open');
      } catch (error) {
        console.error("Error updating card:", error);
      }
    }
  };
};

// Submit new card
submitBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  if (titleInput.value && descriptionInput.value && imageUrlInput.value) {
    await saveCard(titleInput.value, descriptionInput.value, imageUrlInput.value);
    await loadCards();
    modal.classList.remove('open');
    titleInput.value = '';
    descriptionInput.value = '';
    imageUrlInput.value = '';
  }
});

// Search functionality
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  document.querySelectorAll('.card').forEach(card => {
    const title = card.querySelector('.title').textContent.toLowerCase();
    card.style.display = title.includes(query) ? 'block' : 'none';
  });
});

// Modal functionality
openModalBtn.addEventListener('click', () => modal.classList.add('open'));
closeModalBtn.addEventListener('click', () => modal.classList.remove('open'));

// TMDb API: Fetch movie details based on title
async function fetchMovieDetailsTMDb() {
  const title = titleInput.value;
  if (!title) {
    alert("Please enter a title first.");
    return;
  }
  const apiKey = "0b1121a7a8eda7a6ecc7fdfa631ad27a"; // Your TMDb API key
  const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}`;
  
  try {
    const response = await fetch(searchUrl);
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      alert("Movie not found!");
      return;
    }
    // Use the first result from TMDb
    const movie = data.results[0];
    descriptionInput.value = movie.overview || "";
    if (movie.poster_path) {
      imageUrlInput.value = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    } else {
      imageUrlInput.value = "";
    }
  } catch (error) {
    console.error("Error fetching movie details from TMDb:", error);
    alert("Failed to fetch details. Try again later.");
  }
}

// TMDb API: Fetch TV show details and seasons based on title
async function fetchTVDetailsTMDb() {
  const title = titleInput.value;
  if (!title) {
    alert("Please enter a title first.");
    return;
  }
  const apiKey = "0b1121a7a8eda7a6ecc7fdfa631ad27a"; // Your TMDb API key
  const searchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(title)}`;
  
  try {
    const response = await fetch(searchUrl);
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      alert("TV Show not found!");
      return;
    }
    // Use the first result from TMDb
    const tvShow = data.results[0];
    descriptionInput.value = tvShow.overview || "";
    if (tvShow.poster_path) {
      imageUrlInput.value = `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`;
    } else {
      imageUrlInput.value = "";
    }
    
    // Fetch TV show details to get seasons
    const tvDetailsUrl = `https://api.themoviedb.org/3/tv/${tvShow.id}?api_key=${apiKey}`;
    const detailsResponse = await fetch(tvDetailsUrl);
    const detailsData = await detailsResponse.json();
    
    // Populate season dropdown
    if (seasonSelect) {
      seasonSelect.innerHTML = ""; // Clear previous options
      detailsData.seasons.forEach(season => {
         const option = document.createElement('option');
         option.value = season.season_number;
         option.textContent = season.name;
         seasonSelect.appendChild(option);
      });
      seasonSelect.style.display = 'block';
      seasonLabel.style.display = 'block';
    }
  } catch (error) {
    console.error("Error fetching TV show details from TMDb:", error);
    alert("Failed to fetch TV show details. Try again later.");
  }
}

// Determine which TMDb function to call based on media type selection
fetchDetailsBtn.addEventListener('click', () => {
  if (mediaTypeSelect.value === 'movie') {
    fetchMovieDetailsTMDb();
  } else if (mediaTypeSelect.value === 'tv') {
    fetchTVDetailsTMDb();
  }
});
