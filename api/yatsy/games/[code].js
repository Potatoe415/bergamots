import {
  readJsonBody,
  sendError,
  sendJson,
  withErrorHandling
} from "../../_lib/http.js";
import { getServiceClient } from "../../_lib/supabase.js";
import {
  CODE_LENGTH,
  isExpired,
  normalizeCode,
  seatTokenColumn
} from "../../_lib/yatzyGames.js";

async function handleGet(req, res, supabase, code) {
  const { data, error } = await supabase
    .from("yatzy_games")
    .select("created_at, status, game_state")
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

  sendJson(res, 200, {
    code,
    createdAt: new Date(data.created_at).getTime(),
    status: data.status,
    gameState: data.game_state || null
  });
}

async function handleDelete(req, res, supabase, code) {
  const body = await readJsonBody(req);

  const { data, error } = await supabase
    .from("yatzy_games")
    .select("status, creator_token, joiner_token")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  if (!data) {
    sendJson(res, 200, { code, removed: false });
    return;
  }

  // Only a seated player may destroy a room. Without this, knowing a 3-letter
  // code was enough to wipe any game in progress.
  const column = seatTokenColumn(body.role);
  const seatToken = column ? data[column] : null;

  if (!seatToken || seatToken !== body.resumeToken) {
    sendError(res, "resume-denied", "This seat belongs to another player.");
    return;
  }

  if (body.deleteCurrent || data.status === "waiting") {
    await supabase.from("yatzy_games").delete().eq("code", code);
    sendJson(res, 200, { code, removed: true });
    return;
  }

  sendJson(res, 200, { code, removed: false });
}

async function handler(req, res) {
  const code = normalizeCode(req.query.code);

  if (code.length !== CODE_LENGTH) {
    sendError(res, "invalid-code", "Game code must contain exactly 3 letters.");
    return;
  }

  const supabase = getServiceClient();

  if (req.method === "GET") {
    await handleGet(req, res, supabase, code);
    return;
  }

  if (req.method === "DELETE") {
    await handleDelete(req, res, supabase, code);
    return;
  }

  sendError(res, "method-not-allowed", "Use GET or DELETE.");
}

export default withErrorHandling(handler);
