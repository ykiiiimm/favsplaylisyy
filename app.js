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
