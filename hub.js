const CONFIG_URL = '/hub-config.json';
const GRID_ID = 'games-grid';
const TABS_ID = 'category-tabs';
const LANG_SWITCHER_ID = 'lang-switcher';
const LANG_STORAGE_KEY = 'bergamots-lang';

const LANGS = ['fr', 'en', 'es'];
const CATEGORY_ORDER = ['cartes', 'mots', 'autres'];
const CATEGORY_LABELS = {
  fr: { cartes: 'Cartes', mots: 'Mots', autres: 'Autres' },
  en: { cartes: 'Cards', mots: 'Words', autres: 'Other' },
  es: { cartes: 'Cartas', mots: 'Palabras', autres: 'Otros' }
};

const state = {
  games: [],
  category: 'cartes',
  lang: readStoredLang()
};

document.addEventListener('DOMContentLoaded', initializeDashboard);

async function initializeDashboard() {
  const gridElement = document.getElementById(GRID_ID);

  if (!gridElement) {
    throw new Error(`Élément DOM manquant : '${GRID_ID}'`);
  }

  try {
    const response = await fetch(CONFIG_URL);

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status} lors de la lecture du fichier de configuration.`);
    }

    state.games = await response.json();
    renderLangSwitcher();
    renderCategoryTabs();
    renderGames();
  } catch (error) {
    gridElement.innerHTML = '<p>Erreur critique : Impossible de charger la liste des jeux.</p>';
    console.error("Échec de l'initialisation du Dashboard :", error);
  }
}

function readStoredLang() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    return LANGS.includes(stored) ? stored : 'fr';
  } catch {
    return 'fr';
  }
}

function selectLang(lang) {
  state.lang = lang;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Storage unavailable (private mode, etc.) — language just won't persist.
  }
  renderLangSwitcher();
  renderCategoryTabs();
}

function selectCategory(category) {
  state.category = category;
  renderCategoryTabs();
  renderGames();
}

function renderLangSwitcher() {
  const wrap = document.getElementById(LANG_SWITCHER_ID);
  if (!wrap) return;

  wrap.innerHTML = '';
  wrap.classList.remove('is-open');

  const activeFlag = createLangFlagButton(state.lang, true);
  activeFlag.addEventListener('click', () => wrap.classList.toggle('is-open'));
  wrap.appendChild(activeFlag);

  LANGS.filter((lang) => lang !== state.lang).forEach((lang) => {
    const optionFlag = createLangFlagButton(lang, false);
    optionFlag.addEventListener('click', () => selectLang(lang));
    wrap.appendChild(optionFlag);
  });
}

function createLangFlagButton(lang, isActive) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `lang-flag flag-${lang} ${isActive ? 'lang-flag--active' : 'lang-flag--option'}`;
  button.setAttribute('aria-label', lang.toUpperCase());
  return button;
}

function renderCategoryTabs() {
  const nav = document.getElementById(TABS_ID);
  if (!nav) return;

  const labels = CATEGORY_LABELS[state.lang];
  nav.innerHTML = '';

  CATEGORY_ORDER.forEach((category) => {
    const isActive = category === state.category;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `category-tab category-tab--${category}${isActive ? ' is-active' : ''}`;
    button.textContent = labels[category];
    button.addEventListener('click', () => selectCategory(category));
    nav.appendChild(button);
  });
}

function renderGames() {
  const gridElement = document.getElementById(GRID_ID);
  const gamesInCategory = state.games.filter((game) => game.category === state.category);

  gridElement.innerHTML = '';

  if (gamesInCategory.length === 0) {
    gridElement.innerHTML = '<p>Aucun jeu disponible dans cette catégorie.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  gamesInCategory.forEach((game) => fragment.appendChild(createTileNode(game)));
  gridElement.appendChild(fragment);
}

function createTileNode(game) {
  const anchor = document.createElement('a');
  anchor.href = determineTargetUrl(game);
  anchor.className = 'game-tile';

  if (isExternalLaunch(game.launch)) {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }

  const media = document.createElement('div');
  media.className = 'game-tile__media';

  const img = document.createElement('img');
  img.className = 'game-tile__thumb';
  img.src = game.thumbnail || '';
  img.alt = `Miniature de ${game.title}`;
  img.loading = 'lazy';
  attachThumbnailFallback(img);

  const overlay = document.createElement('div');
  overlay.className = 'game-tile__overlay';

  const title = document.createElement('div');
  title.className = 'game-tile__title';
  title.textContent = game.title;

  media.appendChild(img);
  media.appendChild(overlay);
  media.appendChild(title);
  anchor.appendChild(media);

  return anchor;
}

function attachThumbnailFallback(img) {
  img.onerror = () => {
    const currentSource = typeof img.src === 'string' ? img.src : '';
    const hasTriedPngFallback = img.dataset.triedPngFallback === 'true';

    if (!hasTriedPngFallback && currentSource.endsWith('.jpg')) {
      img.dataset.triedPngFallback = 'true';
      img.src = currentSource.replace(/\.jpg$/, '.png');
      return;
    }

    img.src = generateBlackFallbackSVG();
  };
}

function isExternalLaunch(launchUrl) {
  if (!launchUrl || typeof launchUrl !== 'string') return false;
  return launchUrl.startsWith('http://') || launchUrl.startsWith('https://');
}

function determineTargetUrl(game) {
  if (game.launch) {
    return game.launch;
  }
  if (game.type === 'custom' && game.indexPath) {
    return game.indexPath;
  }
  return `./wordplayer.html?game=${game.id}`;
}

function generateBlackFallbackSVG() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150">
    <rect width="300" height="150" fill="#111"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#555" font-family="sans-serif" font-size="14">Image Manquante</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
