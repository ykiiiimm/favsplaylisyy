const openModalBtn = document.getElementById('openModalBtn');
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('closeModalBtn');
const submitBtn = document.getElementById('submitBtn');
const cardContainer = document.getElementById('card-container');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const imageUrlInput = document.getElementById('image-url');
const searchInput = document.querySelector('.search-bar input');

openModalBtn.addEventListener('click', () => {
    modal.classList.add('open');
});

closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('open');
});

submitBtn.addEventListener('click', () => {
    const title = titleInput.value;
    const description = descriptionInput.value;
    const imageUrl = imageUrlInput.value;

    if (title && description && imageUrl) {
        const newCard = document.createElement('div');
        newCard.classList.add('card');
        newCard.innerHTML = `
            <img src="${imageUrl}" alt="Poster">
            <div class="overlay">
                <div class="title">${title}</div>
                <div class="description">${description}</div>
                <div>
                    <button class="edit-button" onclick="editCard(this)">Edit</button>
                    <button class="delete-button" onclick="deleteCard(this)">Delete</button>
                </div>
            </div>
        `;
        cardContainer.appendChild(newCard);
        modal.classList.remove('open');
        titleInput.value = '';
        descriptionInput.value = '';
        imageUrlInput.value = '';
    }
});

function deleteCard(button) {
    button.closest('.card').remove();
}

function editCard(button) {
    const card = button.closest('.card');
    const title = card.querySelector('.title').innerText;
    const description = card.querySelector('.description').innerText;
    const imageUrl = card.querySelector('img').src;

    titleInput.value = title;
    descriptionInput.value = description;
    imageUrlInput.value = imageUrl;
    modal.classList.add('open');
    submitBtn.onclick = () => {
        card.querySelector('.title').innerText = titleInput.value;
        card.querySelector('.description').innerText = descriptionInput.value;
        card.querySelector('img').src = imageUrlInput.value;
        modal.classList.remove('open');
    };
}

// Search functionality
searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        const title = card.querySelector('.title').innerText.toLowerCase();
        if (title.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});
