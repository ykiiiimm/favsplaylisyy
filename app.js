document.addEventListener("DOMContentLoaded", () => {
  // Select DOM elements for the modal and TMDb functionality
  const openModalBtn = document.getElementById("openModalBtn");
  const modal = document.getElementById("modal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const fetchDetailsBtn = document.getElementById("fetchDetailsBtn");
  const titleInput = document.getElementById("title");
  const descriptionInput = document.getElementById("description");
  const imageUrlInput = document.getElementById("image-url");
  const seasonSelect = document.getElementById("seasonSelect");
  const seasonLabel = document.getElementById("seasonLabel");

  // Open the modal when the "Add New Content" button is clicked
  openModalBtn.addEventListener("click", () => {
    modal.classList.add("open");
  });

  // Close the modal when the close button (×) is clicked
  closeModalBtn.addEventListener("click", () => {
    modal.classList.remove("open");
  });

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
        detailsData.seasons.forEach(season => {
          const option = document.createElement("option");
          option.value = season.season_number;
          option.textContent = season.name;
          // Store the season poster URL if available
          if (season.poster_path) {
            option.setAttribute("data-poster", `https://image.tmdb.org/t/p/w500${season.poster_path}`);
          } else {
            option.setAttribute("data-poster", "");
          }
          seasonSelect.appendChild(option);
        });
        seasonSelect.style.display = "block";
        seasonLabel.style.display = "block";
        
        // Update image when a different season is selected
        seasonSelect.onchange = function() {
          const selectedOption = seasonSelect.options[seasonSelect.selectedIndex];
          const seasonPoster = selectedOption.getAttribute("data-poster");
          imageUrlInput.value = seasonPoster ? seasonPoster : "";
        };
      }
    } catch (error) {
      console.error("Error fetching TV show details from TMDb:", error);
      alert("Failed to fetch TV show details. Try again later.");
    }
  }

  // Attach the TMDb fetch function to the "Fetch Details" button
  fetchDetailsBtn.addEventListener("click", fetchTVDetailsTMDb);
});
