// Player name field on the profile page. Client-only (localStorage), same
// pattern as the auth email in /auth.js. Not consumed by any game yet — that
// wiring (pre-filling the name field in each game) is a separate task; this
// only saves the value so it is there when that wiring happens.

const NAME_STORAGE_KEY = "bergamots-player-name";
const NOTICE_TIMEOUT_MS = 1800;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profile-name-form");
  const input = document.getElementById("profile-name-input");
  const notice = document.getElementById("profile-name-saved-notice");

  if (!form || !input) return;

  input.value = readStoredName();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    persistName(input.value.trim());
    showSavedNotice(notice);
  });
});

function readStoredName() {
  try {
    return localStorage.getItem(NAME_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function persistName(name) {
  try {
    if (name) {
      localStorage.setItem(NAME_STORAGE_KEY, name);
    } else {
      localStorage.removeItem(NAME_STORAGE_KEY);
    }
  } catch {
    // Storage unavailable (private mode, etc.) — name just won't persist.
  }
}

let noticeTimeoutId;

function showSavedNotice(notice) {
  if (!notice) return;
  notice.hidden = false;
  clearTimeout(noticeTimeoutId);
  noticeTimeoutId = setTimeout(() => {
    notice.hidden = true;
  }, NOTICE_TIMEOUT_MS);
}
