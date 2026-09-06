const TRACK_ENDPOINT = "/api/track";
const LAUNCH_COUNTS_KEY = "bergamots-launch-counts";

/**
 * Fire-and-forget game launch ping. Uses sendBeacon rather than fetch because
 * the click that triggers it immediately navigates away, which would cancel a
 * normal request. Also increments a client-only per-game counter used by
 * `/profile` (never sent to the server). Never throws: analytics must not
 * block a game launch.
 */
export function trackGameLaunch(gameId) {
  recordLocalLaunch(gameId);
  if (!navigator.sendBeacon) return;

  try {
    navigator.sendBeacon(TRACK_ENDPOINT, JSON.stringify({ gameId }));
  } catch {
    // Beacon queue full or endpoint unavailable — the launch still proceeds.
  }
}

function recordLocalLaunch(gameId) {
  if (!gameId || typeof gameId !== "string") return;
  try {
    const counts = readLocalLaunchCounts();
    counts[gameId] = (counts[gameId] || 0) + 1;
    localStorage.setItem(LAUNCH_COUNTS_KEY, JSON.stringify(counts));
  } catch {
    // Storage unavailable — the profile page just stays at zero.
  }
}

function readLocalLaunchCounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LAUNCH_COUNTS_KEY) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}
