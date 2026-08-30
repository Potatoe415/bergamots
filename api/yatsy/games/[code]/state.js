import {
  readJsonBody,
  sendError,
  sendJson,
  withErrorHandling
} from "../../../_lib/http.js";
import { getServiceClient } from "../../../_lib/supabase.js";
import {
  CODE_LENGTH,
  insertTick,
  normalizeCode,
  seatTokenColumn
} from "../../../_lib/yatzyGames.js";

// A real Yatzy state serializes to a few KB. The cap stops a seated player from
// using their own room as unbounded storage in the shared Supabase project.
const MAX_GAME_STATE_BYTES = 65536;

function isAcceptableGameState(gameState) {
  if (gameState === null || gameState === undefined) {
    return true;
  }

  if (typeof gameState !== "object" || Array.isArray(gameState)) {
    return false;
  }

  return JSON.stringify(gameState).length <= MAX_GAME_STATE_BYTES;
}

async function handler(req, res) {
  if (req.method !== "PUT") {
    sendError(res, "method-not-allowed", "Use PUT to update game state.");
    return;
  }

  const code = normalizeCode(req.query.code);

  if (code.length !== CODE_LENGTH) {
    sendError(res, "invalid-code", "Game code must contain exactly 3 letters.");
    return;
  }

  const body = await readJsonBody(req);
  const { role, resumeToken, gameState } = body;

  if (!isAcceptableGameState(gameState)) {
    sendError(
      res,
      "invalid-state",
      "gameState must be a JSON object under 64 KB."
    );
    return;
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("yatzy_games")
    .select("version, creator_token, joiner_token")
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

  const column = seatTokenColumn(role);
  const seatToken = column ? data[column] : null;

  if (!seatToken || seatToken !== resumeToken) {
    sendError(res, "resume-denied", "This seat belongs to another player.");
    return;
  }

  const nextVersion = (data.version || 0) + 1;
  const { error: updateError } = await supabase
    .from("yatzy_games")
    .update({ game_state: gameState, version: nextVersion })
    .eq("code", code);

  if (updateError) {
    sendError(res, "server-error", updateError.message);
    return;
  }

  await insertTick(supabase, code, nextVersion);

  sendJson(res, 200, { code, version: nextVersion });
}

export default withErrorHandling(handler);
