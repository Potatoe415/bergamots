// Player identity fields on the profile page: "Nom" and Avatar. Both are
// client-only (localStorage, via /shared/js/player-profile.js — loaded as a
// classic script right before this module, see index.html), same pattern as
// the auth email in /auth.js. The name is read by Yatzy (same origin) and,
// as a `?name=` URL param, by the external games launched from the hub
// (see hub.js). The avatar stays Bergamots-only: an image is too large to
// travel through a URL, so it is not propagated to other games.

import { initLaunchStats } from "./profile-stats.js";

const NOTICE_TIMEOUT_MS = 1800;
const MAX_AVATAR_BYTES = 50 * 1024;
const AVATAR_MAX_DIMENSION_PX = 256;
const AVATAR_MIN_DIMENSION_PX = 64;
const LANG_STORAGE_KEY = "bergamots-lang";
const LANGS = ["fr", "en", "es"];

const MESSAGES = {
  fr: {
    documentTitle: "Profil — Bergamots",
    title: "Profil",
    avatarAlt: "Avatar du joueur",
    changeAvatar: "Changer l'avatar",
    removeAvatar: "Retirer",
    nameLabel: "Nom",
    namePlaceholder: "Ton nom",
    save: "Enregistrer",
    saved: "Enregistré ✓",
    back: "← Retour à l'accueil",
    imageOnly: "Choisis un fichier image.",
    imageLoadError: "Impossible de charger cette image.",
    launchesZero: "Aucun jeu lancé",
    launchesOne: "1 jeu lancé",
    launchesMany: "{count} jeux lancés",
    favoritesTitle: "Jeux préférés",
    favoritesEmpty: "Tes jeux les plus lancés apparaîtront ici."
  },
  en: {
    documentTitle: "Profile — Bergamots",
    title: "Profile",
    avatarAlt: "Player avatar",
    changeAvatar: "Change avatar",
    removeAvatar: "Remove",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    save: "Save",
    saved: "Saved ✓",
    back: "← Back to hub",
    imageOnly: "Choose an image file.",
    imageLoadError: "Could not load that image.",
    launchesZero: "No games launched",
    launchesOne: "1 game launched",
    launchesMany: "{count} games launched",
    favoritesTitle: "Favorite games",
    favoritesEmpty: "Your most launched games will show up here."
  },
  es: {
    documentTitle: "Perfil — Bergamots",
    title: "Perfil",
    avatarAlt: "Avatar del jugador",
    changeAvatar: "Cambiar avatar",
    removeAvatar: "Quitar",
    nameLabel: "Nombre",
    namePlaceholder: "Tu nombre",
    save: "Guardar",
    saved: "Guardado ✓",
    back: "← Volver al inicio",
    imageOnly: "Elige un archivo de imagen.",
    imageLoadError: "No se pudo cargar esa imagen.",
    launchesZero: "Ningún juego iniciado",
    launchesOne: "1 juego iniciado",
    launchesMany: "{count} juegos iniciados",
    favoritesTitle: "Juegos favoritos",
    favoritesEmpty: "Tus juegos más lanzados aparecerán aquí."
  }
};

const copy = MESSAGES[readStoredLang()] || MESSAGES.fr;

document.addEventListener("DOMContentLoaded", () => {
  applyProfileCopy();
  initNameForm();
  initAvatarUpload();
  initLaunchStats(copy);
});

function readStoredLang() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    return LANGS.includes(stored) ? stored : "fr";
  } catch {
    return "fr";
  }
}

function applyProfileCopy() {
  document.documentElement.lang = readStoredLang();
  document.title = copy.documentTitle;
  setText("profile-title", copy.title);
  setText("profile-name-label", copy.nameLabel);
  setText("profile-name-save-button", copy.save);
  setText("profile-name-saved-notice", copy.saved);
  setText("profile-back-to-hub", copy.back);
  setText("profile-avatar-remove-button", copy.removeAvatar);
  setText("profile-favorites-title", copy.favoritesTitle);

  const nameInput = document.getElementById("profile-name-input");
  if (nameInput) {
    nameInput.placeholder = copy.namePlaceholder;
  }

  const preview = document.getElementById("profile-avatar-preview");
  if (preview) {
    preview.alt = copy.avatarAlt;
  }

  const avatarButton = document.getElementById("profile-avatar-button");
  if (avatarButton) {
    avatarButton.setAttribute("aria-label", copy.changeAvatar);
    avatarButton.title = copy.changeAvatar;
  }
}

function setText(dataId, text) {
  const node = document.querySelector(`[data-id="${dataId}"]`);
  if (node) {
    node.textContent = text;
  }
}

function initNameForm() {
  const form = document.getElementById("profile-name-form");
  const input = document.getElementById("profile-name-input");
  const notice = document.getElementById("profile-name-saved-notice");

  if (!form || !input) return;

  input.value = window.PlayerProfile.getName();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    window.PlayerProfile.setName(input.value.trim());
    showNotice(notice);
  });
}

function initAvatarUpload() {
  const fileInput = document.getElementById("profile-avatar-input");
  const removeButton = document.getElementById("profile-avatar-remove-button");
  const errorNotice = document.getElementById("profile-avatar-error");

  if (!fileInput || !removeButton) return;

  renderAvatarPreview();

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = "";
    if (!file) return;

    hideError(errorNotice);

    if (!file.type.startsWith("image/")) {
      showError(errorNotice, copy.imageOnly);
      return;
    }

    try {
      const dataUrl = await compressImageToDataUrl(file);
      window.PlayerProfile.setAvatar(dataUrl);
      renderAvatarPreview();
    } catch {
      showError(errorNotice, copy.imageLoadError);
    }
  });

  removeButton.addEventListener("click", () => {
    window.PlayerProfile.setAvatar("");
    renderAvatarPreview();
  });
}

function renderAvatarPreview() {
  const preview = document.getElementById("profile-avatar-preview");
  const placeholder = document.getElementById("profile-avatar-placeholder");
  const removeButton = document.getElementById("profile-avatar-remove-button");
  const avatar = window.PlayerProfile.getAvatar();

  const hasAvatar = Boolean(avatar);
  preview.src = avatar;
  preview.hidden = !hasAvatar;
  placeholder.hidden = hasAvatar;
  removeButton.hidden = !hasAvatar;
}

// Center-crops to a square, paints a white JPEG background, then shrinks
// quality and size until the file is under MAX_AVATAR_BYTES (~50 KB).
async function compressImageToDataUrl(file) {
  const image = await loadImageFromFile(file);
  let size = AVATAR_MAX_DIMENSION_PX;
  let quality = 0.85;
  let dataUrl = encodeJpegAvatar(image, size, quality);

  while (estimateDataUrlBytes(dataUrl) > MAX_AVATAR_BYTES) {
    if (quality > 0.4) {
      quality -= 0.15;
    } else if (size > AVATAR_MIN_DIMENSION_PX) {
      size = Math.max(AVATAR_MIN_DIMENSION_PX, Math.round(size * 0.75));
      quality = 0.7;
    } else {
      break;
    }
    dataUrl = encodeJpegAvatar(image, size, quality);
  }

  return dataUrl;
}

function encodeJpegAvatar(image, size, quality) {
  return drawSquareCanvas(image, size).toDataURL("image/jpeg", quality);
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function drawSquareCanvas(image, size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);

  const source = Math.min(image.width, image.height);
  const sx = (image.width - source) / 2;
  const sy = (image.height - source) / 2;
  context.drawImage(image, sx, sy, source, source, 0, 0, size, size);
  return canvas;
}

function estimateDataUrlBytes(dataUrl) {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.round((base64.length * 3) / 4);
}

let noticeTimeoutId;

function showNotice(notice) {
  if (!notice) return;
  notice.hidden = false;
  clearTimeout(noticeTimeoutId);
  noticeTimeoutId = setTimeout(() => {
    notice.hidden = true;
  }, NOTICE_TIMEOUT_MS);
}

function showError(notice, message) {
  if (!notice) return;
  notice.textContent = message;
  notice.hidden = false;
}

function hideError(notice) {
  if (!notice) return;
  notice.hidden = true;
}
