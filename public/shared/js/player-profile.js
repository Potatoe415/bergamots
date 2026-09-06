/* Canonical reader/writer for the player's Bergamots profile (name + avatar),
   shared by every unbundled page under public/ (the profile page itself,
   and any custom game — Yatzy is the first). Plain global script (same
   pattern as game-header.js) so classic, non-module game scripts can use it
   via a plain <script src> tag, same as the profile page.

   auth.js (root-level, bundled by Vite for the hub only) keeps its own
   duplicated NAME_KEY constant on purpose — see docs/DECISIONS.md
   2026-09-05 — since it cannot reach files under public/ at build time. */
(function () {
  const NAME_KEY = "bergamots-player-name";
  const AVATAR_KEY = "bergamots-player-avatar";

  function getName(fallback) {
    try {
      return localStorage.getItem(NAME_KEY) || fallback || "";
    } catch {
      return fallback || "";
    }
  }

  function setName(name) {
    try {
      if (name) {
        localStorage.setItem(NAME_KEY, name);
      } else {
        localStorage.removeItem(NAME_KEY);
      }
    } catch {
      // Storage unavailable (private mode, etc.) — name just won't persist.
    }
  }

  function getAvatar() {
    try {
      return localStorage.getItem(AVATAR_KEY) || "";
    } catch {
      return "";
    }
  }

  function setAvatar(dataUrl) {
    try {
      if (dataUrl) {
        localStorage.setItem(AVATAR_KEY, dataUrl);
      } else {
        localStorage.removeItem(AVATAR_KEY);
      }
    } catch {
      // Storage unavailable, or quota exceeded — avatar just won't persist.
    }
  }

  window.PlayerProfile = {
    NAME_KEY: NAME_KEY,
    AVATAR_KEY: AVATAR_KEY,
    getName: getName,
    setName: setName,
    getAvatar: getAvatar,
    setAvatar: setAvatar
  };
})();
