import {
  readJsonBody,
  sendError,
  sendJson,
  withErrorHandling
} from "./_lib/http.js";
import { clientKey, isRateLimited } from "./_lib/rateLimit.js";
import { getServiceClient } from "./_lib/supabase.js";

const MAX_GAME_ID_LENGTH = 64;
const THROTTLE = { maxHits: 60, windowMs: 60000 }; // 60 launches per min per IP.

/**
 * Records one game launch from the hub. Public and unauthenticated on purpose:
 * anyone who finds this URL can inflate the counters. Accepted trade-off for a
 * zero-cost, zero-auth setup (see docs/DECISIONS.md 2026-08-30).
 *
 * Called via navigator.sendBeacon, which posts a JSON string as text/plain.
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST to record an event.");
    return;
  }

  // Still unauthenticated by design, but no longer an unbounded write path into
  // the Supabase project shared with coinchapp.
  if (isRateLimited(`track:${clientKey(req)}`, THROTTLE)) {
    sendError(res, "too-many-requests", "Too many events. Try again later.");
    return;
  }

  const body = await readJsonBody(req);
  const gameId = typeof body.gameId === "string" ? body.gameId.trim() : "";

  if (!gameId || gameId.length > MAX_GAME_ID_LENGTH) {
    sendError(
      res,
      "invalid-event",
      `gameId must be 1 to ${MAX_GAME_ID_LENGTH} chars.`
    );
    return;
  }

  const { error } = await getServiceClient()
    .from("muchogames_events")
    .insert({ type: "game_launch", game_id: gameId });

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  sendJson(res, 200, { recorded: true });
}

export default withErrorHandling(handler);
