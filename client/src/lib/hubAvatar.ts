const HUB_AVATAR_KEY = 'tranquil-hub-avatar';
const MAX_HUB_AVATAR_CHARS = 8000;

/** Tiny JPEG from the Bergamots hub `?avatar=` launch param. Session-only. */
export function readHubAvatar() {
  const fromUrl = new URLSearchParams(window.location.search).get('avatar')?.trim() || '';
  if (fromUrl.startsWith('data:image/') && fromUrl.length <= MAX_HUB_AVATAR_CHARS) {
    try { sessionStorage.setItem(HUB_AVATAR_KEY, fromUrl); } catch { /* storage unavailable */ }
    return fromUrl;
  }
  try {
    const stored = sessionStorage.getItem(HUB_AVATAR_KEY) || '';
    if (stored.startsWith('data:image/') && stored.length <= MAX_HUB_AVATAR_CHARS) {
      return stored;
    }
  } catch {
    return '';
  }
  return '';
}
