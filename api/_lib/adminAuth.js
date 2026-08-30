import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 3600000; // 1h, then the admin logs in again.

/**
 * Admin access is a single shared password (see docs/DECISIONS.md 2026-08-30).
 * The browser posts it once to api/admin/login.js and gets back a short-lived
 * signed token, so the password itself is never stored client-side. The token
 * is self-contained (HMAC over its own expiry), which keeps this stateless:
 * no session table, no store to keep in sync.
 */
export function hasAdminPassword() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function readSecret() {
  return process.env.ADMIN_PASSWORD || "";
}

// Length is not secret here, but the comparison itself must not leak how many
// leading characters matched.
function equalsInConstantTime(left, right) {
  const leftBytes = Buffer.from(String(left), "utf8");
  const rightBytes = Buffer.from(String(right), "utf8");

  if (leftBytes.length !== rightBytes.length) {
    return false;
  }

  return timingSafeEqual(leftBytes, rightBytes);
}

export function isCorrectPassword(candidate) {
  return (
    typeof candidate === "string" &&
    equalsInConstantTime(candidate, readSecret())
  );
}

function signPayload(payload) {
  return createHmac("sha256", readSecret()).update(payload).digest("hex");
}

export function issueSessionToken() {
  const payload = `${Date.now() + TOKEN_TTL_MS}.${randomBytes(8).toString("hex")}`;
  return `${payload}.${signPayload(payload)}`;
}

export function isValidSessionToken(token) {
  if (typeof token !== "string") {
    return false;
  }

  const [expiresAt, nonce, signature] = token.split(".");

  if (!expiresAt || !nonce || !signature) {
    return false;
  }

  if (!equalsInConstantTime(signature, signPayload(`${expiresAt}.${nonce}`))) {
    return false;
  }

  return Number(expiresAt) > Date.now();
}
