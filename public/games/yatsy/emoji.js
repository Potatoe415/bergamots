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
  const REACTION_TTL_MS = 1800;

  function isKnownEmoji(candidate) {
    return EMOJIS.some((option) => option.emoji === candidate);
  }

  function createEmojiController({ buttonElement, pickerElement, backdropElement, onPick }) {
    let isOpen = false;

    EMOJIS.forEach(({ emoji, id }) => {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "emoji-option";
      optionButton.dataset.id = `emoji-option-${id}`;
      optionButton.textContent = emoji;
      optionButton.setAttribute("aria-label", emoji);
      optionButton.addEventListener("click", () => {
        setOpen(false);
        onPick(emoji);
      });
      pickerElement.appendChild(optionButton);
    });

    buttonElement.addEventListener("click", () => setOpen(!isOpen));
    backdropElement.addEventListener("click", () => setOpen(false));

    function setOpen(nextOpen) {
      isOpen = nextOpen;
      pickerElement.classList.toggle("is-hidden", !isOpen);
      backdropElement.classList.toggle("is-hidden", !isOpen);
      buttonElement.setAttribute("aria-expanded", String(isOpen));
    }

    return {
      close() {
        setOpen(false);
      }
    };
  }

  global.YATZY_EMOJI = {
    EMOJIS,
    REACTION_TTL_MS,
    isKnownEmoji,
    createEmojiController
  };
}(window));
