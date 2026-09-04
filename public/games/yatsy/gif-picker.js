(function attachYatzyGifPicker(global) {
  const GIPHY_HOST = /^(media\d*\.giphy\.com|i\.giphy\.com)$/i;

  function isGiphyMediaUrl(raw) {
    try {
      const url = new URL(raw);
      return url.protocol === "https:" && GIPHY_HOST.test(url.hostname);
    } catch {
      return false;
    }
  }

  async function searchGifs(query, lang) {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim().slice(0, 50));
    params.set("lang", lang || "fr");
    const res = await fetch(`/api/yatsy/gifs?${params.toString()}`);
    if (!res.ok) throw new Error("giphy_failed");
    const body = await res.json();
    return Array.isArray(body.gifs) ? body.gifs.filter(isSafeHit) : [];
  }

  function isSafeHit(hit) {
    return (
      hit &&
      typeof hit.id === "string" &&
      isGiphyMediaUrl(hit.previewUrl) &&
      isGiphyMediaUrl(hit.url)
    );
  }

  function mount(pane, { getText, getLang, onSelect }) {
    pane.innerHTML = "";
    const input = document.createElement("input");
    input.type = "search";
    input.className = "gif-search-input";
    input.dataset.id = "gif-search-input";
    const status = document.createElement("p");
    status.className = "gif-search-status";
    const grid = document.createElement("div");
    grid.className = "gif-search-grid";
    grid.dataset.id = "gif-search-grid";
    const mark = document.createElement("a");
    mark.href = "https://giphy.com";
    mark.target = "_blank";
    mark.rel = "noopener noreferrer";
    mark.className = "giphy-attribution";
    mark.dataset.id = "giphy-attribution";
    pane.append(input, status, grid, mark);

    let reqId = 0;
    let timer = null;

    function syncLabels() {
      input.placeholder = getText("controls.searchGifs");
      mark.textContent = getText("controls.poweredByGiphy");
    }

    async function load(query) {
      const myId = ++reqId;
      showStatus(status, "gif-search-loading", getText("controls.gifSearchLoading"));
      try {
        const gifs = await searchGifs(query, getLang());
        if (myId !== reqId) return;
        fillGrid(gifs, status, grid, getText, onSelect);
      } catch {
        if (myId !== reqId) return;
        grid.innerHTML = "";
        showStatus(status, "gif-search-error", getText("controls.gifSearchError"));
      }
    }

    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => void load(input.value), 300);
    });

    syncLabels();
    void load("");
    return { syncLabels };
  }

  function showStatus(status, dataId, text) {
    status.hidden = false;
    status.dataset.id = dataId;
    status.textContent = text;
  }

  function fillGrid(gifs, status, grid, getText, onSelect) {
    grid.innerHTML = "";
    if (gifs.length === 0) {
      showStatus(status, "gif-search-empty", getText("controls.gifSearchEmpty"));
      return;
    }
    status.hidden = true;
    gifs.forEach((gif) => grid.appendChild(gifButton(gif, getText, onSelect)));
  }

  function gifButton(gif, getText, onSelect) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gif-option";
    button.dataset.id = `gif-pick-${gif.id}`;
    button.setAttribute("aria-label", gif.title || getText("controls.sendGif"));
    const img = document.createElement("img");
    img.src = gif.previewUrl;
    img.alt = "";
    button.appendChild(img);
    button.addEventListener("click", () => onSelect(gif.url));
    return button;
  }

  global.YATZY_GIF = { isGiphyMediaUrl, mount };
}(window));
