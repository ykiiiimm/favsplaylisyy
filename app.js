<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Google Search Console Verification -->
  <meta name="google-site-verification" content="bK4H_h0gQz9YBc08N0XAoZk6x4hesxaDLArOXNcXixw" />
  
  <!-- SEO Metadata -->
  <title>UR FAV'S | Organize & Discover Movies & TV Shows</title>
  <meta name="description" content="Discover, organize, and share your favorite movies and TV shows. Get posters, details and more automatically from TMDB!" />
  <meta name="keywords" content="movies, tv shows, TMDB, poster, Firebase, Google Login, modern design" />

  <!-- Styles & Fonts -->
  <link rel="stylesheet" href="styles.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&family=Poppins:wght@300;600&display=swap" />
</head>
<body>
  <!-- Login Container -->
  <div class="login-container" id="loginContainer">
    <div class="login-box">
      <h2>Login to UR FAV'S</h2>
      <button class="google-btn" id="googleLoginBtn">
        <i class="fab fa-google"></i> Login with Google
      </button>
    </div>
  </div>

  <!-- Main Content -->
  <div class="hidden" id="mainContent">
    <header>
      <h1>UR FAV'S</h1>
      <div class="search-bar">
        <input type="text" placeholder="Search for movies, TV shows, etc..." />
      </div>
      <button id="logoutBtn" class="logout-btn">Logout</button>
    </header>

    <button class="add-card-btn" id="openModalBtn">
      <i class="fas fa-plus"></i> Add New Content
    </button>

    <!-- Add/Edit Modal -->
    <div class="modal" id="modal">
      <div class="modal-content">
        <span class="close-btn" id="closeModalBtn">&times;</span>
        <h2>Add New Content</h2>
        <input type="text" id="title" placeholder="Title" />
        <!-- New selection for content type -->
        <select id="content-type">
          <option value="movie">Movie</option>
          <option value="tv">TV Show</option>
        </select>
        <!-- Season input, visible only for TV Shows -->
        <input type="number" id="season" placeholder="Season (if TV Show)" min="1" style="display:none;" />
        <button id="fetchTmdbBtn">Fetch Info from TMDB</button>
        <!-- Display fetched info preview (optional) -->
        <div id="tmdbPreview" class="tmdb-preview"></div>
        <button id="submitBtn">Submit</button>
      </div>
    </div>

    <!-- Detail Popup Modal -->
    <div class="modal" id="detailModal">
      <div class="modal-content detail-content">
        <span class="close-btn" id="closeDetailModal">&times;</span>
        <div class="detail-img">
          <img id="detailPoster" src="" alt="Poster" />
        </div>
        <div class="detail-info">
          <h2 id="detailTitle"></h2>
          <p id="detailOverview"></p>
          <p id="detailRating"></p>
          <p id="detailRelease"></p>
        </div>
      </div>
    </div>

    <!-- Card Container -->
    <div class="card-container" id="card-container"></div>

    <!-- Footer -->
    <footer>
      <p>
        Created with ❤️ by Hakim &copy; 2025 | 
        <a href="privacy-policy.html">Privacy Policy</a> | 
        <a href="terms-of-service.html">Terms of Service</a>
      </p>
    </footer>
  </div>

  <!-- Scripts -->
  <script type="module" src="firebase.js"></script>
  <script type="module" src="app.js"></script>
</body>
</html>
