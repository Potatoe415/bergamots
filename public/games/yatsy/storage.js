// Raw localStorage primitives for Yatzy. Extracted from app.js: every function
// here only reads/writes window.localStorage, with no knowledge of game state,
// rendering, or the shape of any particular key's value beyond JSON vs boolean.
// Key names and value shapes stay owned by app.js (see its RULE_SETTINGS_STORAGE_KEY,
// REVERSE_SELECTION_STORAGE_KEY, EXTRA_ROLL_EASTER_EGG_STORAGE_KEY, STORAGE_KEY).
window.YATZY_STORAGE = {
  readJSON(key) {
    if (!window.localStorage) {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  writeJSON(key, value) {
    if (!window.localStorage) {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Preferences/session persistence should never break gameplay.
    }
  },

  readBoolean(key) {
    return Boolean(window.YATZY_STORAGE.readJSON(key));
  },

  writeBoolean(key, enabled) {
    window.YATZY_STORAGE.writeJSON(key, Boolean(enabled));
  },

  remove(key) {
    if (!window.localStorage) {
      return;
    }

    window.localStorage.removeItem(key);
  },

  // The hub (index.html/hub.js) writes the player's chosen language under this
  // fixed key so every game can default to it. Not a Yatzy-owned key, so its
  // name is not one of the *_STORAGE_KEY constants in app.js.
  readHubLanguage() {
    if (!window.localStorage) {
      return "fr";
    }

    try {
      const stored = window.localStorage.getItem("bergamots-lang");
      return stored === "en" || stored === "fr" || stored === "es" ? stored : "fr";
    } catch {
      return "fr";
    }
  }
};
