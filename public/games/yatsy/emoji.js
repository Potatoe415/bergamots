(function attachYatzyEmoji(global) {
  // Small, family-friendly reaction set. Each entry pairs the emoji sent
  // over the wire with a stable kebab-case id used for its data-id.
  const EMOJIS = [
    { emoji: "👍", id: "thumbs-up" },
    { emoji: "😂", id: "laughing" },
    { emoji: "😮", id: "surprised" },
    { emoji: "😢", id: "crying" },
    { emoji: "🔥", id: "fire" },
    { emoji: "👏", id: "clapping" },
    { emoji: "🎲", id: "dice" },
    { emoji: "🥳", id: "party" }
  ];
  // Long enough to be noticed over a real network round trip, short enough
  // to stay a quick reaction rather than a lingering banner.
  const REACTION_TTL_MS = 2600;
  const GIF_REACTION_TTL_MS = 5000;

  function isKnownEmoji(candidate) {
    return EMOJIS.some((option) => option.emoji === candidate);
  }

  function isGiphyMediaUrl(raw) {
    return Boolean(global.YATZY_GIF?.isGiphyMediaUrl(raw));
  }

  function parseReactionPayload(payload) {
    if (!payload || typeof payload !== "object") return null;
    if (payload.kind === "gif") {
      if (!isGiphyMediaUrl(payload.gifUrl)) return null;
      return { kind: "gif", gifUrl: payload.gifUrl };
    }
    if (!isKnownEmoji(payload.emoji)) return null;
    return { kind: "emoji", emoji: payload.emoji };
  }

  function createEmojiController({
    buttonElement,
    pickerElement,
    backdropElement,
    onPick,
    getText,
    getLang
  }) {
    let isOpen = false;
    let gifHandle = null;
    pickerElement.innerHTML = "";
    pickerElement.classList.add("emoji-picker-panel");

    const tabBar = buildTabBar();
    const emojiGrid = buildEmojiGrid((emoji) => {
      setOpen(false);
      onPick({ kind: "emoji", emoji });
    });
    const gifPane = document.createElement("div");
    gifPane.className = "gif-pane is-hidden";
    gifPane.dataset.id = "gif-picker";
    pickerElement.append(tabBar.root, emojiGrid, gifPane);

    buttonElement.addEventListener("click", () => setOpen(!isOpen));
    backdropElement.addEventListener("click", () => setOpen(false));
    syncLabels();
    showTab("emoji");
    showTab("emoji");

    function setOpen(nextOpen) {
      isOpen = nextOpen;
      pickerElement.classList.toggle("is-hidden", !isOpen);
      backdropElement.classList.toggle("is-hidden", !isOpen);
      buttonElement.setAttribute("aria-expanded", String(isOpen));
    }

    function showTab(tab) {
      tabBar.setActive(tab);
      emojiGrid.classList.toggle("is-hidden", tab !== "emoji");
      gifPane.classList.toggle("is-hidden", tab !== "gif");
      if (tab === "gif") mountGifPane();
    }

    function mountGifPane() {
      if (gifHandle || !global.YATZY_GIF) return;
      gifHandle = global.YATZY_GIF.mount(gifPane, {
        getText,
        getLang,
        onSelect: (gifUrl) => {
          setOpen(false);
          onPick({ kind: "gif", gifUrl });
        }
      });
    }

    function syncLabels() {
      tabBar.syncLabels();
      gifHandle?.syncLabels();
    }

    function buildTabBar() {
      const root = document.createElement("div");
      root.className = "reaction-tabs";
      root.dataset.id = "reaction-tabs";
      const emojiBtn = tabButton("reaction-tab-emoji", () => showTab("emoji"));
      const gifBtn = tabButton("reaction-tab-gif", () => showTab("gif"));
      root.append(emojiBtn, gifBtn);
      return {
        root,
        setActive(tab) {
          emojiBtn.classList.toggle("is-active", tab === "emoji");
          gifBtn.classList.toggle("is-active", tab === "gif");
        },
        syncLabels() {
          emojiBtn.textContent = getText("controls.emojiTab");
          gifBtn.textContent = getText("controls.gifTab");
        }
      };
    }

    return {
      close() {
        setOpen(false);
      },
      syncLabels
    };
  }

  function tabButton(dataId, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reaction-tab";
    button.dataset.id = dataId;
    button.addEventListener("click", onClick);
    return button;
  }

  function buildEmojiGrid(onPickEmoji) {
    const grid = document.createElement("div");
    grid.className = "emoji-grid";
    grid.dataset.id = "emoji-grid";
    EMOJIS.forEach(({ emoji, id }) => {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "emoji-option";
      optionButton.dataset.id = `emoji-option-${id}`;
      optionButton.textContent = emoji;
      optionButton.setAttribute("aria-label", emoji);
      optionButton.addEventListener("click", () => onPickEmoji(emoji));
      grid.appendChild(optionButton);
    });
    return grid;
  }

  global.YATZY_EMOJI = {
    EMOJIS,
    REACTION_TTL_MS,
    GIF_REACTION_TTL_MS,
    isKnownEmoji,
    isGiphyMediaUrl,
    parseReactionPayload,
    createEmojiController
  };
}(window));
