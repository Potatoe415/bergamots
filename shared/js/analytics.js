const TRACK_ENDPOINT = "/api/track";

/**
 * Fire-and-forget game launch ping. Uses sendBeacon rather than fetch because
 * the click that triggers it immediately navigates away, which would cancel a
 * normal request. Never throws: analytics must not block a game launch.
 */
export function trackGameLaunch(gameId) {
  if (!navigator.sendBeacon) return;

  try {
    navigator.sendBeacon(TRACK_ENDPOINT, JSON.stringify({ gameId }));
  } catch {
    // Beacon queue full or endpoint unavailable — the launch still proceeds.
  }
}
