document.addEventListener("DOMContentLoaded", () => {
  // Select DOM elements for the modal and TMDb functionality
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

  // Open the modal when the "Add New Content" button is clicked
  if (openModalBtn && modal) {
    openModalBtn.addEventListener("click", () => {
      modal.classList.add("open");
    });
  }

  // Close the modal when the close button (×) is clicked
  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener("click", () => {
      modal.classList.remove("open");
    });
  }

  // TMDb API: Fetch TV show details and populate form fields
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
          option.setAttribute("data-poster", season.poster_path ? `https://image.tmdb.org/t/p/w500${season.poster_path}` : "");
          seasonSelect.appendChild(option);
        });
        seasonSelect.style.display = "block";
        seasonLabel.style.display = "block";
        
        // Update image when a different season is selected
        seasonSelect.addEventListener("change", function() {
          const selectedOption = seasonSelect.options[seasonSelect.selectedIndex];
          imageUrlInput.value = selectedOption.getAttribute("data-poster") || "";
        });
      }
    } catch (error) {
      console.error("Error fetching TV show details from TMDb:", error);
      alert("Failed to fetch TV show details. Try again later.");
    }
  }

  // Attach the TMDb fetch function to the "Fetch Details" button
  if (fetchDetailsBtn) {
    fetchDetailsBtn.addEventListener("click", fetchTVDetailsTMDb);
  }

  // Submit Button: Handle new content submission
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      // Collect data from modal inputs
      const title = titleInput.value.trim();
      const description = descriptionInput.value.trim();
      const imageUrl = imageUrlInput.value.trim();
      const mediaType = mediaTypeSelect.value;
      const season = seasonSelect ? seasonSelect.value : "";

      // Basic validation (customize as needed)
      if (!title || !description || !imageUrl) {
        alert("Please fill in the Title, Description, and Image URL fields.");
        return;
      }

      // Create a new card element
      const card = document.createElement("div");
      card.className = "card";

      // Create an image element for the card
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = title;
      card.appendChild(img);

      // Create overlay for card title and description
      const overlay = document.createElement("div");
      overlay.className = "overlay";

      const cardTitle = document.createElement("div");
      cardTitle.className = "title";
      cardTitle.textContent = title;
      overlay.appendChild(cardTitle);

      const cardDescription = document.createElement("div");
      cardDescription.className = "description";
      // Append media type and season info for TV shows if available
      cardDescription.textContent =
        description + (mediaType === "tv" && season ? ` (Season ${season})` : "");
      overlay.appendChild(cardDescription);

      card.appendChild(overlay);

      // Append the new card to the card container
      if (cardContainer) {
        cardContainer.appendChild(card);
      }

      // Clear the form inputs after submission
      titleInput.value = "";
      descriptionInput.value = "";
      imageUrlInput.value = "";
      if (seasonSelect) {
        seasonSelect.innerHTML = "";
        seasonSelect.style.display = "none";
      }
      if (seasonLabel) {
        seasonLabel.style.display = "none";
      }
      // Close the modal
      modal.classList.remove("open");
    });
  }
});
