/* Shared behavior for the options panel opened by the header's gear button.
   Plain global script (no ES module) so both module and classic game
   scripts can call it. */
(function () {
  function initOptionsPanel(triggerEl, panelEl) {
    if (!triggerEl || !panelEl) return null;

    function open() {
      panelEl.hidden = false;
      triggerEl.setAttribute("aria-expanded", "true");
    }

    function close() {
      panelEl.hidden = true;
      triggerEl.setAttribute("aria-expanded", "false");
    }

    function toggle() {
      if (panelEl.hidden) open();
      else close();
    }

    triggerEl.addEventListener("click", toggle);
    panelEl.querySelectorAll("[data-options-close]").forEach(function (el) {
      el.addEventListener("click", close);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !panelEl.hidden) close();
    });

    return { open: open, close: close, toggle: toggle };
  }

  window.GameHeader = { initOptionsPanel: initOptionsPanel };
})();
