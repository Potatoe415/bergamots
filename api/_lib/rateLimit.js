const MAX_TRACKED_KEYS = 5000;

const hitsByKey = new Map();

/**
 * Best-effort throttle, deliberately in-memory.
 *
 * Limits: state lives in one warm serverless instance, so it resets on cold
 * start and is not shared across concurrent instances. It therefore raises the
 * cost of a brute-force or spam burst without being an airtight guarantee.
 * That trade is intentional at the project's current traffic (very low) — a
 * shared store (Redis/KV) would mean a new vendor and a new bill for a hub of
 * party games. Revisit if traffic grows or an actual abuse attempt shows up.
 */
export function clientKey(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const firstHop = String(forwardedFor || "")
    .split(",")[0]
    .trim();

  return firstHop || req.headers["x-real-ip"] || "unknown";
}

export function isRateLimited(key, { maxHits, windowMs }) {
  const now = Date.now();
  const recentHits = (hitsByKey.get(key) || []).filter(
    (hitAt) => now - hitAt < windowMs
  );

  if (recentHits.length >= maxHits) {
    hitsByKey.set(key, recentHits);
    return true;
  }

  recentHits.push(now);
  hitsByKey.set(key, recentHits);

  if (hitsByKey.size > MAX_TRACKED_KEYS) {
    pruneExpired(now, windowMs);
  }

  return false;
}

function pruneExpired(now, windowMs) {
  hitsByKey.forEach((hits, key) => {
    if (hits.every((hitAt) => now - hitAt >= windowMs)) {
      hitsByKey.delete(key);
    }
  });
}
