(function attachYatzyMatchmaking(global) {
  const FIREBASE_VERSION = "9.23.0";
  const GAME_TTL_MS = 10800000;
  const PURGE_AFTER_MS = ((global.YATZY_CONFIG?.matchmaking?.purgeAfterHours) || 48) * 60 * 60 * 1000;
  const CODE_LENGTH = 3;
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const TOKEN_BYTES = 16;

  let sdkPromise = null;
  let activeListener = null;
  let activeCode = "";

  function createMatchmakingError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function normalizeCode(code) {
    return String(code || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, CODE_LENGTH);
  }

  function isExpired(record) {
    return !record || !record.createdAt || (Date.now() - record.createdAt) > GAME_TTL_MS;
  }

  function randomCode() {
    let code = "";

    for (let index = 0; index < CODE_LENGTH; index += 1) {
      const randomIndex = Math.floor(Math.random() * LETTERS.length);
      code += LETTERS[randomIndex];
    }

    return code;
  }

  function randomSeatToken() {
    const bytes = new Uint8Array(TOKEN_BYTES);
    global.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function loadSdk() {
    if (sdkPromise) {
      return sdkPromise;
    }

    sdkPromise = Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-database.js`)
    ]).then(([appSdk, databaseSdk]) => {
      if (!global.firebaseConfig) {
        throw createMatchmakingError(
          "missing-config",
          "window.firebaseConfig must be defined before matchmaking is used."
        );
      }

      const app = appSdk.getApps().length
        ? appSdk.getApp()
        : appSdk.initializeApp(global.firebaseConfig);

      return {
        database: databaseSdk.getDatabase(app),
        ref: databaseSdk.ref,
        get: databaseSdk.get,
        set: databaseSdk.set,
        update: databaseSdk.update,
        remove: databaseSdk.remove,
        onValue: databaseSdk.onValue,
        off: databaseSdk.off
      };
    });

    return sdkPromise;
  }

  async function readGameRecord(code) {
    const sdk = await loadSdk();
    const snapshot = await sdk.get(sdk.ref(sdk.database, `games/${code}`));
    return {
      sdk,
      exists: snapshot.exists(),
      value: snapshot.val()
    };
  }

  async function cleanupExpiredRecord(sdk, code, record) {
    if (!record || !isExpired(record)) {
      return false;
    }

    await sdk.remove(sdk.ref(sdk.database, `games/${code}`));
    return true;
  }

  async function purgeOldGames(sdk, olderThanMs = PURGE_AFTER_MS) {
    const snapshot = await sdk.get(sdk.ref(sdk.database, "games"));

    if (!snapshot.exists()) {
      return;
    }

    const games = snapshot.val();
    const now = Date.now();
    const removals = Object.entries(games)
      .filter(([, record]) => record?.createdAt && (now - record.createdAt) > olderThanMs)
      .map(([code]) => sdk.remove(sdk.ref(sdk.database, `games/${code}`)));

    await Promise.all(removals);
  }

  function stopListening() {
    if (typeof activeListener === "function") {
      activeListener();
    }

    activeListener = null;
    activeCode = "";
  }

  async function startListening(code, callbacks = {}, sessionSeat = null) {
    const sdk = await loadSdk();
    const gameRef = sdk.ref(sdk.database, `games/${code}`);
    let started = false;

    stopListening();
    activeCode = code;

    activeListener = sdk.onValue(gameRef, async (snapshot) => {
      const record = snapshot.val();

      if (!snapshot.exists()) {
        callbacks.gameClosedCallback?.({ code, reason: "missing" });
        return;
      }

      if (await cleanupExpiredRecord(sdk, code, record)) {
        callbacks.gameClosedCallback?.({ code, reason: "expired" });
        return;
      }

      if (sessionSeat?.role && sessionSeat?.resumeToken) {
        const currentSeatToken = record?.seats?.[sessionSeat.role]?.token || null;

        if (!currentSeatToken || currentSeatToken !== sessionSeat.resumeToken) {
          stopListening();
          callbacks.gameClosedCallback?.({ code, reason: "replaced" });
          return;
        }
      }

      const payload = {
        code,
        createdAt: record.createdAt,
        status: record.status,
        gameState: record.gameState || null
      };

      callbacks.stateChangeCallback?.(payload);

      if (record.status === "playing" && !started) {
        started = true;
        callbacks.startGameCallback?.(payload);
      }
    });
  }

  async function createGame(callbacks = {}) {
    const sdk = await loadSdk();

    for (let attempt = 0; attempt < 250; attempt += 1) {
      const code = randomCode();
      const gameRef = sdk.ref(sdk.database, `games/${code}`);
      const snapshot = await sdk.get(gameRef);
      const creatorToken = randomSeatToken();

      if (snapshot.exists()) {
        const existing = snapshot.val();

        if (!isExpired(existing)) {
          continue;
        }
      }

      await sdk.set(gameRef, {
        createdAt: Date.now(),
        status: "waiting",
        gameState: null,
        seats: {
          creator: {
            token: creatorToken
          },
          joiner: {
            token: null
          }
        }
      });

      await startListening(code, callbacks, {
        role: "creator",
        resumeToken: creatorToken
      });
      return {
        code,
        role: "creator",
        localPlayerIndex: 0,
        resumeToken: creatorToken
      };
    }

    throw createMatchmakingError("code-exhausted", "Unable to reserve a free game code.");
  }

  async function joinGame(code, callbacks = {}) {
    const normalizedCode = normalizeCode(code);

    if (normalizedCode.length !== CODE_LENGTH) {
      throw createMatchmakingError("invalid-code", "Game code must contain exactly 3 letters.");
    }

    const { sdk, exists, value } = await readGameRecord(normalizedCode);

    if (!exists) {
      throw createMatchmakingError("game-not-found", "Game not found.");
    }

    if (await cleanupExpiredRecord(sdk, normalizedCode, value)) {
      throw createMatchmakingError("game-expired", "Game expired.");
    }

    if (value.status === "waiting") {
      const joinerToken = randomSeatToken();

      await sdk.update(sdk.ref(sdk.database, `games/${normalizedCode}`), {
        status: "playing",
        "seats/joiner/token": joinerToken
      });

      await startListening(normalizedCode, callbacks, {
        role: "joiner",
        resumeToken: joinerToken
      });

      return {
        code: normalizedCode,
        role: "joiner",
        localPlayerIndex: 1,
        resumeToken: joinerToken
      };
    }

    const activePlayerIndex = value?.gameState?.currentPlayerIndex === 0 ? 0 : 1;
    const replacementRole = activePlayerIndex === 0 ? "creator" : "joiner";
    const replacementToken = randomSeatToken();

    await sdk.update(sdk.ref(sdk.database, `games/${normalizedCode}`), {
      [`seats/${replacementRole}/token`]: replacementToken
    });

    await startListening(normalizedCode, callbacks, {
      role: replacementRole,
      resumeToken: replacementToken
    });

    return {
      code: normalizedCode,
      role: replacementRole,
      localPlayerIndex: activePlayerIndex,
      resumeToken: replacementToken
    };
  }

  async function resumeGame(code, role, resumeToken, callbacks = {}) {
    const normalizedCode = normalizeCode(code);

    if (normalizedCode.length !== CODE_LENGTH) {
      throw createMatchmakingError("invalid-code", "Game code must contain exactly 3 letters.");
    }

    if (!role || !resumeToken) {
      throw createMatchmakingError("resume-denied", "Missing resume credentials.");
    }

    const { sdk, exists, value } = await readGameRecord(normalizedCode);

    if (!exists) {
      throw createMatchmakingError("game-not-found", "Game not found.");
    }

    if (await cleanupExpiredRecord(sdk, normalizedCode, value)) {
      throw createMatchmakingError("game-expired", "Game expired.");
    }

    const seatToken = value?.seats?.[role]?.token || null;

    if (!seatToken || seatToken !== resumeToken) {
      throw createMatchmakingError("resume-denied", "This seat belongs to another player.");
    }

    await startListening(normalizedCode, callbacks, {
      role,
      resumeToken
    });
    return {
      code: normalizedCode,
      status: value.status,
      gameState: value.gameState || null
    };
  }

  async function updateGameState(code, stateObject) {
    const normalizedCode = normalizeCode(code);

    if (!normalizedCode) {
      throw createMatchmakingError("missing-code", "A game code is required.");
    }

    const sdk = await loadSdk();
    await sdk.set(
      sdk.ref(sdk.database, `games/${normalizedCode}/gameState`),
      JSON.parse(JSON.stringify(stateObject))
    );
  }

  async function leaveGame(options = {}) {
    const code = activeCode;
    stopListening();

    const sdk = await loadSdk();

    if (code) {
      const { exists, value } = await readGameRecord(code);

      if (exists) {
        if (options.deleteCurrent || value.status === "waiting") {
          await sdk.remove(sdk.ref(sdk.database, `games/${code}`));
        }
      }
    }

    if (options.purgeOlderThanMs) {
      await purgeOldGames(sdk, options.purgeOlderThanMs);
    }
  }

  global.YATZY_MATCHMAKING = {
    GAME_TTL_MS,
    PURGE_AFTER_MS,
    normalizeCode,
    createGame,
    joinGame,
    resumeGame,
    updateGameState,
    leaveGame
  };
}(window));
