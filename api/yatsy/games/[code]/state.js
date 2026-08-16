import { readJsonBody, sendError, sendJson } from "../../../_lib/http.js";
import { getServiceClient } from "../../../_lib/supabase.js";
import { CODE_LENGTH, insertTick, normalizeCode, seatTokenColumn } from "../../../_lib/yatzyGames.js";

export default async function handler(req, res) {
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
