import { games } from "./games.js";
import { qs, on } from "../../shared/js/dom.js";

function createGameCard(game) {
  const card = document.createElement("article");
  card.className = "game-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Open ${game.title}`);

  card.innerHTML = `
    <div class="game-card__body">
      <div class="game-card__meta">
        <span class="game-card__badge">Mini game</span>
      </div>
      <h2 class="game-card__title">${game.title}</h2>
      <p class="game-card__description">${game.description}</p>
    </div>
    <div class="game-card__footer">
      <span class="game-card__cta">Play</span>
      <span aria-hidden="true" class="game-card__chevron">↗</span>
    </div>
  `;

  const openGame = () => {
    window.location.href = game.path;
  };

  on(card, "click", openGame);
  on(card, "keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openGame();
    }
  });

  return card;
}

function renderHubGrid() {
  const grid = qs("#games-grid");
  if (!grid) {
    return;
  }

  grid.innerHTML = "";

  games.forEach((game) => {
    const card = createGameCard(game);
    grid.appendChild(card);
  });
}

renderHubGrid();

