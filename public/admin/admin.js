const LOGIN_ENDPOINT = "/api/admin/login";
const STATS_ENDPOINT = "/api/admin/stats";
const HUB_CONFIG_URL = "/hub-config.json";
// Only the short-lived token issued by /api/admin/login is kept here. The
// password is never stored, so an XSS on this origin cannot steal it.
const TOKEN_STORAGE_KEY = "muchogames-admin-token";
const OFFLINE_MESSAGE =
  "Impossible de joindre le serveur. Les fonctions /api ne tournent pas sous `npm run dev`.";

const titlesByGameId = new Map();

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("admin-login-form")
    .addEventListener("submit", submitLogin);
  document
    .getElementById("admin-logout-button")
    .addEventListener("click", logout);
  document
    .getElementById("admin-refresh-button")
    .addEventListener("click", () => {
      loadStats(readStoredToken());
    });

  const storedToken = readStoredToken();

  if (storedToken) {
    loadStats(storedToken);
  }
});

async function submitLogin(event) {
  event.preventDefault();

  const passwordInput = document.getElementById("admin-password-input");
  showError("");

  try {
    const response = await fetch(LOGIN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passwordInput.value })
    });

    if (!response.ok) {
      handleFailure(await readErrorMessage(response), response.status);
      return;
    }

    const { token } = await response.json();
    storeToken(token);
    passwordInput.value = "";
    await loadStats(token);
  } catch {
    showError(OFFLINE_MESSAGE);
  }
}

function logout() {
  clearToken();
  document.getElementById("admin-password-input").value = "";
  document.getElementById("admin-dashboard").hidden = true;
  document.getElementById("admin-login").hidden = false;
  showError("");
}

async function loadStats(token) {
  if (!token) return;

  showError("");

  try {
    const response = await fetch(STATS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      handleFailure(await readErrorMessage(response), response.status);
      return;
    }

    const stats = await response.json();
    await loadGameTitles();
    render(stats);
  } catch {
    showError(OFFLINE_MESSAGE);
  }
}

function handleFailure(message, status) {
  if (status === 401) {
    clearToken();
    document.getElementById("admin-dashboard").hidden = true;
    document.getElementById("admin-login").hidden = false;
  }

  if (status === 404) {
    showError(
      "Endpoints /api/admin/* introuvables. Sous `npm run dev` les fonctions serverless ne tournent pas : utilise `vercel dev`."
    );
    return;
  }

  showError(message);
}

async function readErrorMessage(response) {
  try {
    const payload = await response.json();
    return payload.error?.message || `Erreur HTTP ${response.status}.`;
  } catch {
    return `Erreur HTTP ${response.status}.`;
  }
}

function render(stats) {
  document.getElementById("admin-login").hidden = true;
  document.getElementById("admin-dashboard").hidden = false;
  document.getElementById("admin-total-launches").textContent =
    stats.totalLaunches;

  const list = document.getElementById("admin-ranking");
  list.innerHTML = "";

  document.getElementById("admin-empty").hidden = stats.ranking.length > 0;

  const topCount = stats.ranking[0]?.launches || 1;
  const fragment = document.createDocumentFragment();

  stats.ranking.forEach((entry, index) => {
    fragment.appendChild(createRankingRow(entry, index + 1, topCount));
  });

  list.appendChild(fragment);
}

function createRankingRow(entry, rank, topCount) {
  const row = document.createElement("li");
  row.className = "admin-ranking-row";
  row.dataset.id = `admin-ranking-row-${entry.gameId}`;

  const rankLabel = document.createElement("span");
  rankLabel.className = "admin-ranking-rank";
  rankLabel.textContent = rank;

  const details = document.createElement("div");
  const name = document.createElement("p");
  name.className = "admin-ranking-name";
  name.textContent = titlesByGameId.get(entry.gameId) || entry.gameId;

  const bar = document.createElement("div");
  bar.className = "admin-ranking-bar";
  const fill = document.createElement("span");
  fill.style.width = `${Math.round((entry.launches / topCount) * 100)}%`;
  bar.appendChild(fill);

  details.append(name, bar);

  const count = document.createElement("span");
  count.className = "admin-ranking-count";
  count.textContent = entry.launches;

  row.append(rankLabel, details, count);
  return row;
}

async function loadGameTitles() {
  if (titlesByGameId.size > 0) return;

  try {
    const response = await fetch(HUB_CONFIG_URL);
    if (!response.ok) return;

    const games = await response.json();
    games.forEach((game) => titlesByGameId.set(game.id, game.title));
  } catch {
    // Titles are cosmetic: fall back to raw game ids.
  }
}

function readStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function storeToken(token) {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage unavailable (private mode): the session just won't survive a reload.
  }
}

function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

function showError(message) {
  const banner = document.getElementById("admin-error");
  banner.textContent = message;
  banner.hidden = !message;
}
