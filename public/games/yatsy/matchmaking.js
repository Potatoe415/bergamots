(function attachYatzyMatchmaking(global) {
  const SUPABASE_JS_URL = "https://esm.sh/@supabase/supabase-js@2";
  const API_BASE = "/api/yatsy/games";
  const GAME_TTL_MS = 10800000;
  const PURGE_AFTER_MS = ((global.YATZY_CONFIG?.matchmaking?.purgeAfterHours) || 48) * 60 * 60 * 1000;
  const CODE_LENGTH = 3;
  const POLL_INTERVAL_MS = 15000;

  let supabaseClientPromise = null;
  let activeChannel = null;
  let activePollTimer = null;
  let activeVisibilityHandler = null;
  let activeCode = "";
  let activeSession = null;

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

  async function request(method, path, body) {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const errorInfo = payload?.error || {};
      throw createMatchmakingError(
        errorInfo.code || "server-error",
        errorInfo.message || "Matchmaking request failed."
      );
    }

    return payload;
  }

  async function loadSupabaseClient() {
    if (supabaseClientPromise) {
      return supabaseClientPromise;
    }

    supabaseClientPromise = import(SUPABASE_JS_URL).then(({ createClient }) => {
      if (!global.supabaseConfig) {
        throw createMatchmakingError(
          "missing-config",
          "window.supabaseConfig must be defined before matchmaking is used."
        );
      }

      return createClient(global.supabaseConfig.url, global.supabaseConfig.anonKey);
    });

    return supabaseClientPromise;
  }

  async function fetchAuthorizedState(code, sessionSeat) {
    if (sessionSeat?.role && sessionSeat?.resumeToken) {
      return request("POST", `/${code}/resume`, {
        role: sessionSeat.role,
        resumeToken: sessionSeat.resumeToken
      });
    }

    return request("GET", `/${code}`);
  }

  function stopListening() {
    if (activeChannel) {
      activeChannel.unsubscribe();
      activeChannel = null;
    }

    if (activePollTimer) {
      clearInterval(activePollTimer);
      activePollTimer = null;
    }

    if (activeVisibilityHandler) {
      document.removeEventListener("visibilitychange", activeVisibilityHandler);
      activeVisibilityHandler = null;
    }

    activeCode = "";
    activeSession = null;
  }

  async function startListening(code, callbacks = {}, sessionSeat = null) {
    stopListening();
    activeCode = code;
    activeSession = sessionSeat;

    let started = false;
    let lastKnownVersion = -1;

    async function refetch() {
      let record;

      try {
        record = await fetchAuthorizedState(code, sessionSeat);
      } catch (error) {
        if (error.code === "game-not-found") {
          stopListening();
          callbacks.gameClosedCallback?.({ code, reason: "missing" });
          return;
        }

        if (error.code === "game-expired") {
          stopListening();
          callbacks.gameClosedCallback?.({ code, reason: "expired" });
          return;
        }

        if (error.code === "resume-denied") {
          stopListening();
          callbacks.gameClosedCallback?.({ code, reason: "replaced" });
          return;
        }

        return; // Transient/network error: the next tick or poll will retry.
      }

      // refetch() is triggered from four independent sources (poll timer,
      // tab visibility, the postgres_changes INSERT, and the broadcast
      // "tick"), so several requests can be in flight at once with no
      // ordering guarantee. Without this check, a slower response landing
      // after a fresher one would silently roll the UI back to older dice/
      // turn data. `version` only ever increases server-side, so any
      // response carrying a version we've already moved past is stale and
      // gets discarded here instead of being applied.
      if (Number.isInteger(record.version) && record.version < lastKnownVersion) {
        return;
      }

      if (Number.isInteger(record.version)) {
        lastKnownVersion = record.version;
      }

      callbacks.stateChangeCallback?.(record);

      if (record.status === "playing" && !started) {
        started = true;
        callbacks.startGameCallback?.(record);
      }
    }

    activeVisibilityHandler = () => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    };
    document.addEventListener("visibilitychange", activeVisibilityHandler);
    activePollTimer = setInterval(refetch, POLL_INTERVAL_MS);

    const supabase = await loadSupabaseClient();
    activeChannel = supabase
      .channel(`yatzy-game-${code}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "yatzy_game_events", filter: `game_code=eq.${code}` },
        refetch
      )
      .on("broadcast", { event: "tick" }, refetch)
      .subscribe();

    await refetch();
  }

  async function createGame(callbacks = {}) {
    const data = await request("POST", "");

    await startListening(data.code, callbacks, {
      role: "creator",
      resumeToken: data.resumeToken
    });

    return data;
  }

  async function joinGame(code, callbacks = {}) {
    const normalizedCode = normalizeCode(code);

    if (normalizedCode.length !== CODE_LENGTH) {
      throw createMatchmakingError("invalid-code", "Game code must contain exactly 3 letters.");
    }

    const data = await request("POST", `/${normalizedCode}/join`);

    await startListening(normalizedCode, callbacks, {
      role: data.role,
      resumeToken: data.resumeToken
    });

    return data;
  }

  async function resumeGame(code, role, resumeToken, callbacks = {}) {
    const normalizedCode = normalizeCode(code);

    if (normalizedCode.length !== CODE_LENGTH) {
      throw createMatchmakingError("invalid-code", "Game code must contain exactly 3 letters.");
    }

    if (!role || !resumeToken) {
      throw createMatchmakingError("resume-denied", "Missing resume credentials.");
    }

    const data = await request("POST", `/${normalizedCode}/resume`, { role, resumeToken });

    await startListening(normalizedCode, callbacks, { role, resumeToken });

    return {
      code: data.code,
      status: data.status,
      gameState: data.gameState
    };
  }

  async function updateGameState(code, stateObject) {
    const normalizedCode = normalizeCode(code);

    if (!normalizedCode) {
      throw createMatchmakingError("missing-code", "A game code is required.");
    }

    if (!activeSession || normalizedCode !== activeCode) {
      throw createMatchmakingError("resume-denied", "No active session for this game.");
    }

    await request("PUT", `/${normalizedCode}/state`, {
      role: activeSession.role,
      resumeToken: activeSession.resumeToken,
      gameState: JSON.parse(JSON.stringify(stateObject))
    });

    activeChannel?.send({ type: "broadcast", event: "tick", payload: {} });
  }

  async function leaveGame(options = {}) {
    const code = activeCode;
    stopListening();

    if (code) {
      await request("DELETE", `/${code}`, { deleteCurrent: !!options.deleteCurrent });
    }

    if (options.purgeOlderThanMs) {
      await request("POST", "/purge", { olderThanMs: options.purgeOlderThanMs });
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
