import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA9L53Yd_EsE4A-KyXifyq4EIuYEvKNZk8",
    authDomain: "ykiiiiiiiiiiiiiiim.firebaseapp.com",
    projectId: "ykiiiiiiiiiiiiiiim",
    storageBucket: "ykiiiiiiiiiiiiiiim.firebasestorage.app",
    messagingSenderId: "1042062383289",
    appId: "1:1042062383289:web:a4f43aa710b06a0f38a368",
    measurementId: "G-KNVLQ0TMB0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM elements
const openModalBtn = document.getElementById('openModalBtn');
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('closeModalBtn');
const submitBtn = document.getElementById('submitBtn');
const cardContainer = document.getElementById('card-container');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const imageUrlInput = document.getElementById('image-url');
const searchInput = document.querySelector('.search-bar input');

// Open/Close Modal
openModalBtn.addEventListener('click', () => modal.classList.add('open'));
closeModalBtn.addEventListener('click', () => modal.classList.remove('open'));

// Add a new card
submitBtn.addEventListener('click', async () => {
    const title = titleInput.value;
    const description = descriptionInput.value;
    const imageUrl = imageUrlInput.value;

    if (title && description && imageUrl) {
        try {
            const docRef = await addDoc(collection(db, "cards"), { title, description, imageUrl });
            const newCard = document.createElement('div');
            newCard.classList.add('card');
            newCard.dataset.cardId = docRef.id;
            newCard.innerHTML = `
                <img src="${imageUrl}" alt="Poster">
                <div class="overlay">
                    <div class="title">${title}</div>
                    <div class="description">${description}</div>
                    <div>
                        <button class="edit-button" onclick="editCard(this)">Edit</button>
                        <button class="delete-button" onclick="deleteCard(this, '${docRef.id}')">Delete</button>
                    </div>
                </div>
            `;
            cardContainer.appendChild(newCard);
            modal.classList.remove('open');
            titleInput.value = '';
            descriptionInput.value = '';
            imageUrlInput.value = '';
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }
});

// Load cards
async function loadCards() {
    const querySnapshot = await getDocs(collection(db, "cards"));
    querySnapshot.forEach((doc) => {
        const cardData = doc.data();
        const newCard = document.createElement('div');
        newCard.classList.add('card');
        newCard.dataset.cardId = doc.id;
        newCard.innerHTML = `
            <img src="${cardData.imageUrl}" alt="Poster">
            <div class="overlay">
                <div class="title">${cardData.title}</div>
                <div class="description">${cardData.description}</div>
                <div>
                    <button class="edit-button" onclick="editCard(this)">Edit</button>
                    <button class="delete-button" onclick="deleteCard(this, '${doc.id}')">Delete</button>
                </div>
            </div>
        `;
        cardContainer.appendChild(newCard);
    });
}
loadCards();

// Delete card
function deleteCard(button, cardId) {
    deleteDoc(doc(db, "cards", cardId)).then(() => {
        button.closest('.card').remove();
    }).catch((error) => console.error("Error removing document: ", error));
}

// Edit card
function editCard(button) {
    const card = button.closest('.card');
    titleInput.value = card.querySelector('.title').innerText;
    descriptionInput.value = card.querySelector('.description').innerText;
    imageUrlInput.value = card.querySelector('img').src;
    modal.classList.add('open');
    submitBtn.onclick = async () => {
        const cardId = card.dataset.cardId;
        await updateDoc(doc(db, "cards", cardId), {
            title: titleInput.value,
            description: descriptionInput.value,
            imageUrl: imageUrlInput.value
        });
        card.querySelector('.title').innerText = titleInput.value;
        card.querySelector('.description').innerText = descriptionInput.value;
        card.querySelector('img').src = imageUrlInput.value;
        modal.classList.remove('open');
    };
}

// Search functionality
searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
        const title = card.querySelector('.title').innerText.toLowerCase();
        card.style.display = title.includes(query) ? 'block' : 'none';
    });
});
