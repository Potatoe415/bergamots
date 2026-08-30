import {
  hasAdminPassword,
  isCorrectPassword,
  issueSessionToken
} from "../_lib/adminAuth.js";
import {
  readJsonBody,
  sendError,
  sendJson,
  withErrorHandling
} from "../_lib/http.js";
import { clientKey, isRateLimited } from "../_lib/rateLimit.js";

const THROTTLE = { maxHits: 10, windowMs: 600000 }; // 10 attempts per 10 min.

/**
 * Trades the shared admin password for a short-lived signed token, so the page
 * never has to keep the password around. Throttled, because a single shared
 * password with unlimited attempts is a password with no strength at all.
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST to log in.");
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

  if (isRateLimited(`admin-login:${clientKey(req)}`, THROTTLE)) {
    sendError(res, "too-many-requests", "Too many attempts. Try again later.");
    return;
  }

  const body = await readJsonBody(req);

  if (!isCorrectPassword(body.password)) {
    sendError(res, "unauthorized", "Wrong password.");
    return;
  }

  sendJson(res, 200, { token: issueSessionToken() });
}

export default withErrorHandling(handler);
