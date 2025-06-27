document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const authorInput = document.querySelector("#author");
  const titleInput = document.querySelector("#title");
  const authorsBlock = document.querySelector(".authors-block");
  const sidebarList = document.querySelector(".sidebar ul");
  const resetBtn = document.querySelector("#reset-btn");
  const historyList = document.querySelector("#search-history");
  const clearHistoryBtn = document.querySelector("#clear-history-btn");

  const favoriteAuthorsList = document.querySelector("#favorite-authors");
  const favoriteBooksList = document.querySelector("#favorite-books");

  const favoriteAuthors = new Set();
  const favoriteBooks = new Set();

  let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
  let debounceTimer;

  renderHistory(); // Show saved searches on page load

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const authorQuery = authorInput.value.trim();
    const titleQuery = titleInput.value.trim();
    if (authorQuery) handleSearch(authorQuery, titleQuery);
  });

  authorInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const authorQuery = authorInput.value.trim();
      const titleQuery = titleInput.value.trim();
      if (authorQuery) handleSearch(authorQuery, titleQuery);
    }, 500);
  });

  resetBtn?.addEventListener("click", () => {
    authorInput.value = "";
    titleInput.value = "";
    authorsBlock.innerHTML = "";
    sidebarList.innerHTML = "";
  });

  clearHistoryBtn?.addEventListener("click", () => {
    localStorage.removeItem("searchHistory");
    searchHistory = [];
    renderHistory();
  });

  function addToHistory(query) {
    if (!searchHistory.includes(query)) {
      searchHistory.unshift(query);
      searchHistory = searchHistory.slice(0, 5);
      localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
      renderHistory();
    }
  }

  function renderHistory() {
    historyList.innerHTML = "";
    searchHistory.forEach((query) => {
      const li = document.createElement("li");
      li.textContent = query;
      li.style.cursor = "pointer";
      li.addEventListener("click", () => {
        authorInput.value = query;
        handleSearch(query, titleInput.value.trim());
      });
      historyList.appendChild(li);
    });
  }

  async function handleSearch(authorQuery, titleQuery) {
    authorsBlock.innerHTML = "Loading...";
    sidebarList.innerHTML = "";

    addToHistory(authorQuery);

    const authors = await fetchAuthors(authorQuery);
    const filtered = titleQuery
      ? authors.filter((author) =>
          author.top_work?.toLowerCase().includes(titleQuery.toLowerCase())
        )
      : authors;

    renderAuthors(filtered.slice(0,5)); // Limit to 5 authors for performance
  }

  async function fetchAuthors(query) {
    try {
      const response = await fetch(
        `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      return data.docs;
    } catch (error) {
      console.error("Fetch error:", error);
      authorsBlock.innerHTML = "Failed to fetch data.";
      return [];
    }
  }

  async function renderAuthors(authors) {
    authorsBlock.innerHTML = "";

    if (authors.length === 0) {
      authorsBlock.textContent = "No authors found.";
      return;
    }

    for (const author of authors) {
      const card = document.createElement("div");
      card.className = "author-card";
      card.innerHTML = `
        <h3>${author.name}</h3>
        <p><strong>Top Work:</strong> ${author.top_work || "N/A"}</p>
        <p><strong>Work Count:</strong> ${author.work_count}</p>
        <button class="like-author-btn">❤️ Add Author</button>

        <div class="books"><em>Loading books...</em></div>
      `;

      authorsBlock.appendChild(card);

      const li = document.createElement("li");
      li.textContent = author.name;
      sidebarList.appendChild(li);

      card.querySelector(".like-author-btn").addEventListener("click", () => {
        if (!favoriteAuthors.has(author.name)) {
          favoriteAuthors.add(author.name);
          renderFavorites();
        }
      });

      if (author.key) {
        try {
          const res = await fetch(`https://openlibrary.org${author.key}/works.json`);
          const data = await res.json();

          const booksDiv = card.querySelector(".books");
          booksDiv.innerHTML = "";

          const books = data.entries?.slice(0, 4) || [];
          if (books.length === 0) {
            booksDiv.innerHTML = "<p>No books found.</p>";
            continue;
          }

          books.forEach((book) => {
            const title = book.title;
            const coverId = book.covers?.[0];

            const bookDiv = document.createElement("div");
            bookDiv.className = "book";
            bookDiv.innerHTML = `
              <p>${title}</p>
              ${
                coverId
                  ? `<img src="https://covers.openlibrary.org/b/id/${coverId}-M.jpg" alt="${title} cover" />`
                  : `<p>No cover available</p>`
              }
              <button class="like-book-btn">💖 Add Book</button>
            `;

            bookDiv.querySelector(".like-book-btn").addEventListener("click", () => {
              if (!favoriteBooks.has(title)) {
                favoriteBooks.add(title);
                renderFavorites();
              }
            });

            booksDiv.appendChild(bookDiv);
          });
        } catch (err) {
          console.error("Error fetching books:", err);
          const booksDiv = card.querySelector(".books");
          booksDiv.innerHTML = "<p>Error loading books.</p>";
        }
      }
    }
  }

  function renderFavorites() {
    favoriteAuthorsList.innerHTML = "";
    favoriteBooksList.innerHTML = "";

    favoriteAuthors.forEach((name) => {
      const li = document.createElement("li");
      li.textContent = name;
      favoriteAuthorsList.appendChild(li);
    });

    favoriteBooks.forEach((title) => {
      const li = document.createElement("li");
      li.textContent = title;
      favoriteBooksList.appendChild(li);
    });
  }
});
