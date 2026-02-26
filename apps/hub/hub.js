import { games } from "./games.js";
import { qs, qsa, on } from "../../shared/js/dom.js";

const LANG_STORAGE_KEY = "lang";
const SUPPORTED_LANGS = ["en", "fr", "es"];
const DEFAULT_LANG = "en";

let currentLang = DEFAULT_LANG;

function getLocalizedText(entry) {
  if (!entry) {
    return "";
  }

  return entry[currentLang] || entry[DEFAULT_LANG] || "";
}

function createGameCard(game) {
  const card = document.createElement("article");
  const title = getLocalizedText(game.title) || game.id;

  card.className = "game-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Open ${title}`);

  card.innerHTML = `
    <div class="game-card__image-shell">
      <img
        src="${game.image}"
        alt="${title}"
        class="game-card__image"
      />
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

function setActiveLanguage(lang) {
  currentLang = lang;
  window.localStorage.setItem(LANG_STORAGE_KEY, lang);

  const buttons = qsa("[data-lang-toggle]");
  buttons.forEach((button) => {
    const buttonLang = button.getAttribute("data-lang");
    if (buttonLang === lang) {
      button.classList.add("lang-toggle--active");
    } else {
      button.classList.remove("lang-toggle--active");
    }
  });

  renderHubGrid();
}

function applyStoredLanguage() {
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
  if (stored && SUPPORTED_LANGS.includes(stored)) {
    currentLang = stored;
  } else {
    currentLang = DEFAULT_LANG;
  }
}

function initLanguageControls() {
  const buttons = qsa("[data-lang-toggle]");
  buttons.forEach((button) => {
    const buttonLang = button.getAttribute("data-lang");
    if (!buttonLang || !SUPPORTED_LANGS.includes(buttonLang)) {
      return;
    }

    on(button, "click", () => {
      if (buttonLang !== currentLang) {
        setActiveLanguage(buttonLang);
      }
    });
  });
}

function init() {
  applyStoredLanguage();
  initLanguageControls();
  setActiveLanguage(currentLang);
}

init();

