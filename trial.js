document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const authorInput = document.querySelector("#author");
  const titleInput = document.querySelector("#title");
  const authorsBlock = document.querySelector(".authors-block");
  const sidebarList = document.querySelector(".sidebar ul");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const authorQuery = authorInput.value.trim();
    const titleQuery = titleInput.value.trim();

    if (!authorQuery) return;

    authorsBlock.innerHTML = "Loading...";
    sidebarList.innerHTML = "";

    const authors = await fetchAuthors(authorQuery);
    const filtered = titleQuery
      ? authors.filter(author =>
          author.top_work?.toLowerCase().includes(titleQuery.toLowerCase())
        )
      : authors;

    renderAuthors(filtered);
  });

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
        <button class="like-btn">❤️ Like</button>
        <div class="books"></div>
      `;

      // Like button event
      card.querySelector(".like-btn").addEventListener("click", () => {
        alert(`You liked ${author.name}!`);
      });

      authorsBlock.appendChild(card);

      // Add to sidebar
      const li = document.createElement("li");
      li.textContent = author.name;
      sidebarList.appendChild(li);

      // Fetch books using author.key (e.g. /authors/OL1234A)
      if (author.key) {
        try {
          const res = await fetch(`https://openlibrary.org${author.key}/works.json`);
          const data = await res.json();

          const booksDiv = card.querySelector(".books");
          const books = data.entries.slice(0, 3); // First 3 books only

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
            `;

            booksDiv.appendChild(bookDiv);
          });
        } catch (err) {
          console.error("Error fetching books:", err);
        }
      }
    }
  }
});
