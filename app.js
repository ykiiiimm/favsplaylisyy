/* 
  app.js
  Requires Firebase Firestore imports from firebase.js
  to store and retrieve cards.
*/

import {
  db,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "./firebase.js"; // or "firebase.js" if in the same folder

document.addEventListener("DOMContentLoaded", async () => {
  // DOM elements
  const openModalBtn = document.getElementById("openModalBtn");
  const modal = document.getElementById("modal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const fetchDetailsBtn = document.getElementById("fetchDetailsBtn");
  const submitBtn = document.getElementById("submitBtn");
  const titleInput = document.getElementById("title");
  const descriptionInput = document.getElementById("description");
  const imageUrlInput = document.getElementById("image-url");
  const mediaTypeSelect = document.getElementById("mediaType");
  const seasonSelect = document.getElementById("seasonSelect");
  const seasonLabel = document.getElementById("seasonLabel");
  const cardContainer = document.getElementById("card-container");

  // Track whether we're editing an existing card or creating a new one
  let editCardId = null; // Will store the Firestore doc ID if editing

  // === 1) Load existing cards from Firestore on page load ===
  await loadCardsFromFirestore();

  // === 2) Modal open/close ===
  if (openModalBtn && modal) {
    openModalBtn.addEventListener("click", () => {
      // Clear editCardId whenever we open the modal for a new card
      editCardId = null;

      // Clear form fields
      titleInput.value = "";
      descriptionInput.value = "";
      imageUrlInput.value = "";
      seasonSelect.innerHTML = "";
      seasonSelect.style.display = "none";
      seasonLabel.style.display = "none";
      mediaTypeSelect.value = "movie";

      // Open modal
      modal.classList.add("open");
    });
  }

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener("click", () => {
      modal.classList.remove("open");
    });
  }

  // === 3) “Fetch Details” button (TMDb API) ===
  async function fetchTVDetailsTMDb() {
    const title = titleInput.value.trim();
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
      // Set default image to the TV show's poster if available
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
        detailsData.seasons.forEach((season) => {
          const option = document.createElement("option");
          option.value = season.season_number;
          option.textContent = season.name;
          // Store the season poster URL if available
          option.setAttribute(
            "data-poster",
            season.poster_path
              ? `https://image.tmdb.org/t/p/w500${season.poster_path}`
              : ""
          );
          seasonSelect.appendChild(option);
        });
        seasonSelect.style.display = "block";
        seasonLabel.style.display = "block";

        // Update image when a different season is selected
        seasonSelect.addEventListener("change", function () {
          const selectedOption =
            seasonSelect.options[seasonSelect.selectedIndex];
          imageUrlInput.value =
            selectedOption.getAttribute("data-poster") || "";
        });
      }
    } catch (error) {
      console.error("Error fetching TV show details from TMDb:", error);
      alert("Failed to fetch TV show details. Try again later.");
    }
  }

  if (fetchDetailsBtn) {
    fetchDetailsBtn.addEventListener("click", fetchTVDetailsTMDb);
  }

  // === 4) “Submit” button: create or update card in Firestore ===
  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      const title = titleInput.value.trim();
      const description = descriptionInput.value.trim();
      const imageUrl = imageUrlInput.value.trim();
      const mediaType = mediaTypeSelect.value;
      const season = seasonSelect && seasonSelect.value ? seasonSelect.value : "";

      // Basic validation
      if (!title || !description || !imageUrl) {
        alert("Please fill in Title, Description, and Image URL.");
        return;
      }

      try {
        if (editCardId) {
          // === Update existing card in Firestore ===
          await updateDoc(doc(db, "cards", editCardId), {
            title,
            description,
            imageUrl,
            mediaType,
            season
          });

          // Update the DOM card immediately
          updateCardDOM(editCardId, title, description, imageUrl, mediaType, season);
        } else {
          // === Create new card in Firestore ===
          const docRef = await addDoc(collection(db, "cards"), {
            title,
            description,
            imageUrl,
            mediaType,
            season
          });
          // Add it to the DOM
          createCard(docRef.id, title, description, imageUrl, mediaType, season);
        }
      } catch (err) {
        console.error("Error saving card to Firestore:", err);
        alert("Failed to save card. Check console for details.");
      }

      // Clear form & close modal
      titleInput.value = "";
      descriptionInput.value = "";
      imageUrlInput.value = "";
      seasonSelect.innerHTML = "";
      seasonSelect.style.display = "none";
      seasonLabel.style.display = "none";
      mediaTypeSelect.value = "movie";
      editCardId = null;
      modal.classList.remove("open");
    });
  }

  // === Helper function to load existing cards from Firestore ===
  async function loadCardsFromFirestore() {
    const snapshot = await getDocs(collection(db, "cards"));
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      createCard(
        docSnap.id,
        data.title,
        data.description,
        data.imageUrl,
        data.mediaType,
        data.season
      );
    });
  }

  // === Helper function to create a new card DOM element ===
  function createCard(id, title, description, imageUrl, mediaType, season) {
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("data-id", id);

    // Card image
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = title;
    card.appendChild(img);

    // Overlay
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const cardTitle = document.createElement("div");
    cardTitle.className = "title";
    cardTitle.textContent = title;
    overlay.appendChild(cardTitle);

    const cardDescription = document.createElement("div");
    cardDescription.className = "description";
    cardDescription.textContent =
      description + (mediaType === "tv" && season ? ` (Season ${season})` : "");
    overlay.appendChild(cardDescription);

    // === Edit Button ===
    const editButton = document.createElement("button");
    editButton.className = "edit-button";
    editButton.textContent = "Edit";
    overlay.appendChild(editButton);

    editButton.addEventListener("click", () => {
      // Set the editCardId so we know to update instead of create
      editCardId = id;
      // Populate form fields with existing data
      titleInput.value = title;
      descriptionInput.value = description;
      imageUrlInput.value = imageUrl;
      mediaTypeSelect.value = mediaType;
      // If it's a TV show, we can also show the season dropdown
      if (mediaType === "tv" && season) {
        seasonSelect.value = season;
        seasonSelect.style.display = "block";
        seasonLabel.style.display = "block";
      } else {
        seasonSelect.style.display = "none";
        seasonLabel.style.display = "none";
      }
      // Show the modal
      modal.classList.add("open");
    });

    // === Delete Button ===
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    overlay.appendChild(deleteButton);

    deleteButton.addEventListener("click", async () => {
      try {
        await deleteDoc(doc(db, "cards", id));
        card.remove(); // remove from DOM
      } catch (err) {
        console.error("Error deleting card:", err);
        alert("Failed to delete card. Check console for details.");
      }
    });

    card.appendChild(overlay);
    cardContainer.appendChild(card);
  }

  // === Helper function to update an existing card in the DOM ===
  function updateCardDOM(id, newTitle, newDesc, newImageUrl, newMediaType, newSeason) {
    const card = cardContainer.querySelector(`.card[data-id="${id}"]`);
    if (!card) return;

    const img = card.querySelector("img");
    const overlay = card.querySelector(".overlay");
    const titleDiv = overlay.querySelector(".title");
    const descDiv = overlay.querySelector(".description");

    if (img) {
      img.src = newImageUrl;
      img.alt = newTitle;
    }
    if (titleDiv) titleDiv.textContent = newTitle;
    if (descDiv) {
      descDiv.textContent =
        newDesc + (newMediaType === "tv" && newSeason ? ` (Season ${newSeason})` : "");
    }
  }
});
