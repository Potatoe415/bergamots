import { sendError, sendJson } from "../../../_lib/http.js";
import { getServiceClient } from "../../../_lib/supabase.js";
import { CODE_LENGTH, insertTick, isExpired, normalizeCode, randomSeatToken } from "../../../_lib/yatzyGames.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST to join a game.");
    return;
  }

  const code = normalizeCode(req.query.code);

  if (code.length !== CODE_LENGTH) {
    sendError(res, "invalid-code", "Game code must contain exactly 3 letters.");
    return;
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("yatzy_games")
    .select("created_at, status, version, game_state")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  if (!data) {
    sendError(res, "game-not-found", "Game not found.");
    return;
  }

  if (isExpired(data.created_at)) {
    await supabase.from("yatzy_games").delete().eq("code", code);
    sendError(res, "game-expired", "Game expired.");
    return;
  }

  const nextVersion = (data.version || 0) + 1;

  if (data.status === "waiting") {
    const joinerToken = randomSeatToken();
    const { error: updateError } = await supabase
      .from("yatzy_games")
      .update({ status: "playing", joiner_token: joinerToken, version: nextVersion })
      .eq("code", code);

    if (updateError) {
      sendError(res, "server-error", updateError.message);
      return;
    }

    await insertTick(supabase, code, nextVersion);

    sendJson(res, 200, {
      code,
      role: "joiner",
      localPlayerIndex: 1,
      resumeToken: joinerToken
    });
    return;
  }

  // Game already playing: reconnect by replacing whichever seat is not the
  // current turn's seat, mirroring the pre-migration "replace inactive seat"
  // behavior.
  const activePlayerIndex = data.game_state?.currentPlayerIndex === 0 ? 0 : 1;
  const replacementRole = activePlayerIndex === 0 ? "creator" : "joiner";
  const replacementToken = randomSeatToken();
  const tokenColumn = replacementRole === "creator" ? "creator_token" : "joiner_token";

  const { error: replaceError } = await supabase
    .from("yatzy_games")
    .update({ [tokenColumn]: replacementToken, version: nextVersion })
    .eq("code", code);

  if (replaceError) {
    sendError(res, "server-error", replaceError.message);
    return;
  }

  await insertTick(supabase, code, nextVersion);

  sendJson(res, 200, {
    code,
    role: replacementRole,
    localPlayerIndex: activePlayerIndex,
    resumeToken: replacementToken
  });
}
