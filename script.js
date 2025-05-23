const API_KEY = '488eb36776275b8ae18600751059fb49';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const PROXY_URL = 'https://nerflixnew.vercel.app/api/proxy?id=';

let currentPage = 1;
let currentQuery = '';
let isFetching = false;
let timeout = null;

// Fetch movies
async function fetchMovies(query = '', page = 1) {
    if (isFetching) return;
    isFetching = true;
    document.getElementById("loading").style.display = "block";

    let url = query
        ? `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${query}&page=${page}`
        : `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&page=${page}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        document.getElementById("loading").style.display = "none";

        if (!data.results || data.results.length === 0) {
            document.getElementById("error").innerText = "No results found!";
            return;
        }

        document.getElementById("error").innerText = "";
        displayMovies(data.results, page === 1);
    } catch (err) {
        document.getElementById("error").innerText = "Error fetching data!";
        document.getElementById("loading").style.display = "none";
    } finally {
        isFetching = false;
    }
}

// Display movies
function displayMovies(movies, clear = false) {
    const moviesDiv = document.getElementById("movies");

    if (clear) moviesDiv.innerHTML = ""; // Clear previous results when searching

    movies.forEach(movie => {
        if (!movie.poster_path) return;

        const movieEl = document.createElement("div");
        movieEl.classList.add("movie");
        movieEl.innerHTML = `
            <img src="${IMG_URL}${movie.poster_path}" alt="${movie.title || movie.name}" loading="lazy">
            <div class="overlay">${movie.title || movie.name}</div>
        `;
        movieEl.onclick = () => {
            window.open(`${PROXY_URL}${movie.id}`, "_blank");
        };

        moviesDiv.appendChild(movieEl);
    });
}

// Search function with debounce
function debounceSearch() {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        const query = document.getElementById("search").value.trim();
        if (query.length > 2) {
            currentQuery = query;
            currentPage = 1;
            fetchMovies(currentQuery, currentPage);
        }
    }, 300);
}

// Infinite Scroll
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        currentPage++;
        fetchMovies(currentQuery, currentPage);
    }
});

// Load initial movies
fetchMovies();
