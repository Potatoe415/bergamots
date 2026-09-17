const HUB_NAME_KEY = 'tranquil-hub-name';
const HUB_AVATAR_KEY = 'tranquil-hub-avatar';
const MAX_HUB_AVATAR_CHARS = 8000;

/** Hub `?name=` is for this browser only. Ignore it on invite links (`?room=`). */
export function readHubName() {
  return readHubParam('name', HUB_NAME_KEY, (value) => value.length > 0);
}

/** Tiny JPEG from the Bergamots hub `?avatar=` launch param. Session-only. */
export function readHubAvatar() {
  return readHubParam(
    'avatar',
    HUB_AVATAR_KEY,
    (value) => value.startsWith('data:image/') && value.length <= MAX_HUB_AVATAR_CHARS,
  );
}

function isInviteUrl() {
  return Boolean(new URLSearchParams(window.location.search).get('room'));
}

function readHubParam(
  queryKey: string,
  storageKey: string,
  accept: (value: string) => boolean,
) {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(queryKey)?.trim() || '';
    if (!isInviteUrl() && accept(fromUrl)) {
      sessionStorage.setItem(storageKey, fromUrl);
      return fromUrl;
    }
    const stored = sessionStorage.getItem(storageKey) || '';
    return accept(stored) ? stored : '';
  } catch {
    return '';
  }
}
