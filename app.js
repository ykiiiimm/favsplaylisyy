import { auth, db, collection, addDoc, getDocs, deleteDoc, doc } from './firebase.js';

const openModalBtn = document.getElementById('openModalBtn');
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('closeModalBtn');
const submitBtn = document.getElementById('submitBtn');
const cardContainer = document.getElementById('card-container');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const imageUrlInput = document.getElementById('image-url');
const searchInput = document.querySelector('.search-bar input');

// Load cards when the page loads or user logs in
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
    
    cardContainer.innerHTML = ""; // Clear existing cards
    querySnapshot.forEach((doc) => {
      createCardElement(doc.data(), doc.id);
    });
  } catch (error) {
    console.error("Error loading cards:", error);
  }
}

// Create card element
function createCardElement(cardData, docId) {
  const card = document.createElement('div');
  card.classList.add('card');
  card.dataset.id = docId; // Store Firestore document ID
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

// Delete card from Firestore
window.deleteCard = async (button) => {
  const cardElement = button.closest('.card');
  const docId = cardElement.dataset.id;
  
  try {
    const userId = auth.currentUser.uid;
    await deleteDoc(doc(db, "users", userId, "cards", docId));
    cardElement.remove();
  } catch (error) {
    console.error("Error deleting card:", error);
  }
};

// Submit new card
submitBtn.addEventListener('click', async (e) => {
  e.preventDefault(); // Prevent page reload

  if (titleInput.value && descriptionInput.value && imageUrlInput.value) {
    await saveCard(
      titleInput.value,
      descriptionInput.value,
      imageUrlInput.value
    );
    await loadCards(); // Refresh the card list
    modal.classList.remove('open');
    titleInput.value = '';
    descriptionInput.value = '';
    imageUrlInput.value = '';
  }
});

// Edit card (to implement later)
window.editCard = (button) => {
  // Add edit logic here
};

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
