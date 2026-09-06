/**
 * iOS WebKit (Safari and Chrome-on-iOS both use it) can leave `100dvh`/`100vh`
 * stale after the toolbar shows/hides, drawing the hand under the browser
 * chrome. We recompute the real visible height in JS and expose it as
 * `--app-height`, applied to a normal in-flow element (NOT `position: fixed`
 * — a fixed element gets GPU-composited and iOS can cache a stale frame for
 * it, which only gets flushed by backgrounding/foregrounding the app; a
 * plain block re-layouts safely on every resize).
 */
function apply(): void {
  const root = document.documentElement;
  const height = window.visualViewport?.height ?? window.innerHeight;
  root.style.setProperty('--app-height', `${Math.round(height)}px`);
}

function applySoon(): void {
  apply();
  requestAnimationFrame(apply);
  setTimeout(apply, 300);
}

export function syncViewportHeight(): void {
  apply();
  window.addEventListener('resize', applySoon);
  window.addEventListener('orientationchange', applySoon);
  window.addEventListener('pageshow', applySoon);
  window.addEventListener('focus', applySoon);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') applySoon();
  });
  window.visualViewport?.addEventListener('resize', apply);
}
