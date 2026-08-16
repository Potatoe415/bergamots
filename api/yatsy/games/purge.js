import { readJsonBody, sendError, sendJson } from "../../_lib/http.js";
import { getServiceClient } from "../../_lib/supabase.js";

/**
 * Client-triggered bulk purge of old rooms, kept for parity with the
 * pre-migration behavior (see leaveGame's `purgeOlderThanMs` option). The
 * hourly pg_cron job in supabase/migrations/0001_yatzy.sql is the primary
 * cleanup mechanism; this endpoint is a lightweight, optional supplement.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST to purge old games.");
    return;
  }

  const body = await readJsonBody(req);
  const olderThanMs = Number(body.olderThanMs);

  if (!Number.isFinite(olderThanMs) || olderThanMs <= 0) {
    sendError(res, "invalid-code", "olderThanMs must be a positive number.");
    return;
  }

  const supabase = getServiceClient();
  const cutoffIso = new Date(Date.now() - olderThanMs).toISOString();

  const { error } = await supabase.from("yatzy_games").delete().lt("created_at", cutoffIso);

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  sendJson(res, 200, { purged: true });
}
