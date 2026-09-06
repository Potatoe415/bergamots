// Player identity fields on the profile page: "Nom" and Avatar. Both are
// client-only (localStorage, via /shared/js/player-profile.js — loaded as a
// classic script right before this module, see index.html), same pattern as
// the auth email in /auth.js. The name is read by Yatzy (same origin) and,
// as a `?name=` URL param, by the external games launched from the hub
// (see hub.js). The avatar stays Bergamots-only: an image is too large to
// travel through a URL, so it is not propagated to other games.

const NOTICE_TIMEOUT_MS = 1800;
const MAX_AVATAR_BYTES = 50 * 1024;
const AVATAR_MAX_DIMENSION_PX = 256;

document.addEventListener("DOMContentLoaded", () => {
  initNameForm();
  initAvatarUpload();
});

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
      showError(errorNotice, "Choisis un fichier image.");
      return;
    }

    try {
      const dataUrl = await compressImageToDataUrl(file);
      window.PlayerProfile.setAvatar(dataUrl);
      renderAvatarPreview();
    } catch {
      showError(errorNotice, "Impossible de charger cette image.");
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

// Resizes the image to fit AVATAR_MAX_DIMENSION_PX and re-encodes it as JPEG,
// lowering quality until it fits under MAX_AVATAR_BYTES (or the quality
// floor is reached — good enough for an avatar, not worth failing on).
async function compressImageToDataUrl(file) {
  const image = await loadImageFromFile(file);
  const canvas = drawScaledCanvas(image, AVATAR_MAX_DIMENSION_PX);

  let quality = 0.85;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);

  while (estimateDataUrlBytes(dataUrl) > MAX_AVATAR_BYTES && quality > 0.3) {
    quality -= 0.15;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  return dataUrl;
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

function drawScaledCanvas(image, maxDimension) {
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
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
