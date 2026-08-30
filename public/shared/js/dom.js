export function qs(selector, parent) {
  return (parent || document).querySelector(selector);
}

export function qsa(selector, parent) {
  return Array.from((parent || document).querySelectorAll(selector));
}

export function on(target, eventName, handler, options) {
  target.addEventListener(eventName, handler, options);
  return () => target.removeEventListener(eventName, handler, options);
}
