import { hasAdminPassword, isValidSessionToken } from "../_lib/adminAuth.js";
import {
  readJsonBody,
  sendError,
  sendJson,
  withErrorHandling
} from "../_lib/http.js";
import { getServiceClient } from "../_lib/supabase.js";

const MAX_ROWS = 10000;

/**
 * Returns the game launch ranking. Gated by the short-lived token issued by
 * api/admin/login.js, so the password itself is never replayed on every read.
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST to read stats.");
    return;
  }

  if (!hasAdminPassword()) {
    sendError(
      res,
      "server-error",
      "Admin access is not configured on this deployment."
    );
    return;
  }

  const body = await readJsonBody(req);

  if (!isValidSessionToken(body.token)) {
    sendError(res, "unauthorized", "Session expired. Log in again.");
    return;
  }

  const { data, error } = await getServiceClient()
    .from("muchogames_events")
    .select("game_id")
    .eq("type", "game_launch")
    .limit(MAX_ROWS);

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  sendJson(res, 200, {
    totalLaunches: data.length,
    ranking: rankByGame(data)
  });
}

export default withErrorHandling(handler);

function rankByGame(rows) {
  const launchesByGame = new Map();

  rows.forEach(({ game_id: gameId }) => {
    launchesByGame.set(gameId, (launchesByGame.get(gameId) || 0) + 1);
  });

  return [...launchesByGame.entries()]
    .map(([gameId, launches]) => ({ gameId, launches }))
    .sort((first, second) => second.launches - first.launches);
}
