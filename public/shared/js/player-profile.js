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
  const AVATAR_THUMB_KEY = "bergamots-player-avatar-thumb";
  const LAUNCH_COUNTS_KEY = "bergamots-launch-counts";

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

  function setAvatar(dataUrl, thumbUrl) {
    try {
      if (dataUrl) {
        localStorage.setItem(AVATAR_KEY, dataUrl);
        if (thumbUrl) {
          localStorage.setItem(AVATAR_THUMB_KEY, thumbUrl);
        }
      } else {
        localStorage.removeItem(AVATAR_KEY);
        localStorage.removeItem(AVATAR_THUMB_KEY);
      }
    } catch {
      // Storage unavailable, or quota exceeded — avatar just won't persist.
    }
  }

  function getAvatarThumb() {
    try {
      const stored = localStorage.getItem(AVATAR_THUMB_KEY) || "";
      return stored.startsWith("data:image/") ? stored : "";
    } catch {
      return "";
    }
  }

  function readLaunchCounts() {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(LAUNCH_COUNTS_KEY) || "{}"
      );
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {};
      }
      const counts = {};
      Object.keys(parsed).forEach((id) => {
        const n = Number(parsed[id]);
        if (id && Number.isFinite(n) && n > 0) {
          counts[id] = Math.floor(n);
        }
      });
      return counts;
    } catch {
      return {};
    }
  }

  function getLaunchTotal() {
    return Object.values(readLaunchCounts()).reduce(
      (sum, count) => sum + count,
      0
    );
  }

  function getFavoriteLaunches(limit) {
    const cap = Number.isFinite(limit) && limit > 0 ? limit : 5;
    return Object.entries(readLaunchCounts())
      .map(([id, count]) => ({ id: id, count: count }))
      .sort(
        (left, right) =>
          right.count - left.count || left.id.localeCompare(right.id)
      )
      .slice(0, cap);
  }

  window.PlayerProfile = {
    NAME_KEY: NAME_KEY,
    AVATAR_KEY: AVATAR_KEY,
    AVATAR_THUMB_KEY: AVATAR_THUMB_KEY,
    LAUNCH_COUNTS_KEY: LAUNCH_COUNTS_KEY,
    getName: getName,
    setName: setName,
    getAvatar: getAvatar,
    getAvatarThumb: getAvatarThumb,
    setAvatar: setAvatar,
    getLaunchTotal: getLaunchTotal,
    getFavoriteLaunches: getFavoriteLaunches
  };
})();
