// Google Sign-In status widget for the hub only (see docs/DECISIONS.md).
// No backend, no session, no personal data stored: the credential Google
// returns is never read, verified or sent anywhere. Its mere presence in
// `handleCredentialResponse` means the sign-in succeeded, so we keep only a
// boolean "logged in" flag — no email, name or picture.

// Not a secret: this is the public OAuth Client ID, meant to be visible in
// browser code and restricted by its Authorized JavaScript origins (Google
// Cloud project "muchogames"). The paired client_secret from that project is
// never used here (no backend token exchange) and must never be committed.
const GOOGLE_CLIENT_ID =
  "45336592595-v4odhca7f963n784u3f8g8aoj6odns5h.apps.googleusercontent.com";

const GSI_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const AUTH_STORAGE_KEY = "bergamots-auth";
const WIDGET_ID = "auth-widget";
const GOOGLE_BUTTON_CONTAINER_ID = "auth-google-button";

const ACCOUNT_ICON_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
  <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.24-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.76-3.6-5-8-5Z"/>
</svg>`;

const authState = {
  isLoggedIn: readStoredAuth()
};

export function initAuthWidget() {
  renderAuthWidget();
  loadGoogleScript(() => {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    if (!authState.isLoggedIn) {
      renderGoogleButton();
    }
  });
}

function readStoredAuth() {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) === "in";
  } catch {
    return false;
  }
}

function persistAuth(isLoggedIn) {
  try {
    if (isLoggedIn) {
      localStorage.setItem(AUTH_STORAGE_KEY, "in");
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Storage unavailable (private mode, etc.) — status just won't persist.
  }
}

function loadGoogleScript(onLoaded) {
  const script = document.createElement("script");
  script.src = GSI_SCRIPT_URL;
  script.async = true;
  script.defer = true;
  script.onload = onLoaded;
  document.head.appendChild(script);
}

function handleCredentialResponse() {
  authState.isLoggedIn = true;
  persistAuth(true);
  closePopover();
  renderAuthWidget();
}

function logout() {
  authState.isLoggedIn = false;
  persistAuth(false);
  if (window.google?.accounts?.id) {
    window.google.accounts.id.disableAutoSelect();
  }
  closePopover();
  renderAuthWidget();
  renderGoogleButton();
}

function closePopover() {
  document.getElementById(WIDGET_ID)?.classList.remove("is-open");
}

function renderAuthWidget() {
  const wrap = document.getElementById(WIDGET_ID);
  if (!wrap) return;

  wrap.innerHTML = "";
  wrap.classList.toggle("is-logged-in", authState.isLoggedIn);

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "auth-trigger";
  trigger.setAttribute("aria-label", "Compte");
  trigger.innerHTML = ACCOUNT_ICON_SVG;
  trigger.addEventListener("click", () => wrap.classList.toggle("is-open"));
  wrap.appendChild(trigger);

  wrap.appendChild(createPopoverNode());
}

function createPopoverNode() {
  const popover = document.createElement("div");
  popover.className = "auth-popover";

  if (authState.isLoggedIn) {
    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.className = "auth-logout";
    logoutButton.textContent = "Se déconnecter";
    logoutButton.addEventListener("click", logout);
    popover.appendChild(logoutButton);
  } else {
    const googleButtonContainer = document.createElement("div");
    googleButtonContainer.id = GOOGLE_BUTTON_CONTAINER_ID;
    popover.appendChild(googleButtonContainer);
  }

  return popover;
}

function renderGoogleButton() {
  const container = document.getElementById(GOOGLE_BUTTON_CONTAINER_ID);
  if (!container || !window.google?.accounts?.id) return;

  window.google.accounts.id.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "medium",
    text: "signin_with",
    locale: "fr"
  });
}
