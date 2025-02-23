import { 
  db, tmdbApiKey, collection, addDoc, getDocs, deleteDoc, doc, updateDoc 
} from "./firebase.js";

document.addEventListener("DOMContentLoaded", async () => {
  // DOM Elements
  const elements = {
    openModalBtn: document.getElementById("openModalBtn"),
    modal: document.getElementById("modal"),
    closeModalBtn: document.getElementById("closeModalBtn"),
    fetchDetailsBtn: document.getElementById("fetchDetailsBtn"),
    submitBtn: document.getElementById("submitBtn"),
    titleInput: document.getElementById("title"),
    descriptionInput: document.getElementById("description"),
    imageUrlInput: document.getElementById("image-url"),
    mediaTypeSelect: document.getElementById("mediaType"),
    seasonSelect: document.getElementById("seasonSelect"),
    seasonLabel: document.getElementById("seasonLabel"),
    cardContainer: document.getElementById("card-container"),
    searchInput: document.querySelector(".search-bar input"),
    loginContainer: document.getElementById("loginContainer"),
    mainContent: document.getElementById("mainContent")
  };

  let editCardId = null;

  // 🔍 Search Functionality
  elements.searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll(".card").forEach(card => {
      const title = card.querySelector(".title").textContent.toLowerCase();
      const desc = card.querySelector(".description").textContent.toLowerCase();
      card.style.display = (title.includes(term) || desc.includes(term)) ? "block" : "none";
    });
  });

  // 📺 TMDb API Fetch
  async function fetchTVDetailsTMDb() {
    const title = elements.titleInput.value.trim();
    if (!title) return showError("Please enter a title first");

    try {
      toggleFetchButton(true);
      
      const searchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}`;
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (!data.results?.length) return showError("TV Show not found!");
      
      const tvShow = data.results[0];
      populateFormFields(tvShow);
      await populateSeasons(tvShow.id);

    } catch (error) {
      showError("Failed to fetch details");
    } finally {
      toggleFetchButton(false);
    }
  }

  // 🛠️ Helper Functions
  function toggleFetchButton(isLoading) {
    elements.fetchDetailsBtn.disabled = isLoading;
    elements.fetchDetailsBtn.innerHTML = isLoading 
      ? `<i class="fas fa-spinner fa-spin"></i> Fetching...`
      : "Fetch Details";
  }

  function populateFormFields(tvShow) {
    elements.descriptionInput.value = tvShow.overview || "";
    elements.imageUrlInput.value = tvShow.poster_path 
      ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`
      : "";
  }

  async function populateSeasons(tvId) {
    const detailsUrl = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${tmdbApiKey}`;
    const response = await fetch(detailsUrl);
    const data = await response.json();

    elements.seasonSelect.innerHTML = data.seasons.map(season => 
      `<option value="${season.season_number}" 
       data-poster="${season.poster_path ? `https://image.tmdb.org/t/p/w500${season.poster_path}` : ""}">
        ${season.name}
      </option>`
    ).join("");

    elements.seasonSelect.style.display = "block";
    elements.seasonLabel.style.display = "block";

    elements.seasonSelect.addEventListener("change", () => {
      const selected = elements.seasonSelect.options[elements.seasonSelect.selectedIndex];
      elements.imageUrlInput.value = selected.getAttribute("data-poster") || "";
    });
  }

  // 💾 Form Submission
  elements.submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const { titleInput, descriptionInput, imageUrlInput } = elements;
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const imageUrl = imageUrlInput.value.trim();

    if (!title || !description || !imageUrl) {
      return showError("All fields are required!");
    }

    if (!isValidImageUrl(imageUrl)) {
      return showError("Invalid image URL (use .jpg, .png, .webp)");
    }

    try {
      const cardData = {
        title,
        description,
        imageUrl,
        mediaType: elements.mediaTypeSelect.value,
        season: elements.seasonSelect.value || ""
      };

      if (editCardId) {
        await updateDoc(doc(db, "cards", editCardId), cardData);
        updateCardDOM(editCardId, cardData);
        showSuccess("Updated successfully!");
      } else {
        const docRef = await addDoc(collection(db, "cards"), cardData);
        createCard(docRef.id, cardData);
        showSuccess("Added successfully!");
      }

      resetForm();
      
    } catch (error) {
      showError("Failed to save. Check console.");
      console.error(error);
    }
  });

  // 🎨 DOM Helpers
  function createCard(id, { title, description, imageUrl, mediaType, season }) {
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("data-id", id);

    card.innerHTML = `
      <img src="${imageUrl}" alt="${title}">
      <div class="overlay">
        <div class="title">${title}</div>
        <div class="description">${description}${mediaType === "tv" ? ` (Season ${season})` : ""}</div>
        <button class="edit-button">Edit</button>
        <button class="delete-button">Delete</button>
      </div>
    `;

    card.querySelector(".edit-button").addEventListener("click", () => populateEditForm(id, cardData));
    card.querySelector(".delete-button").addEventListener("click", () => deleteCard(id, card));
    
    elements.cardContainer.appendChild(card);
  }

  // ... (remaining helper functions for loadCardsFromFirestore, updateCardDOM, etc) ...
});

// 🔥 Error/Success Handlers
function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document.querySelector(".modal-content").appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
}

function showSuccess(message) {
  const successDiv = document.createElement("div");
  successDiv.className = "success-message";
  successDiv.textContent = message;
  document.body.appendChild(successDiv);
  setTimeout(() => successDiv.remove(), 2000);
}
