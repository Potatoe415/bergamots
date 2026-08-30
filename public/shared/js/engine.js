/**
 * Shared game engine utilities (copied from root `shared/js/engine.js`)
 */
export async function loadGameData(jsonPath) {
  try {
    const response = await fetch(jsonPath);

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} for path: ${jsonPath}`
      );
    }

    const rawGameData = await response.json();
    const gameData = normalizeGameData(rawGameData);
    validateGameData(gameData);

    return gameData;
  } catch (error) {
    console.error("Critical failure loading game data:", error);
    displayErrorState("Impossible de charger les données du jeu.");
    throw error;
  }
}

function normalizeGameData(rawData) {
  if (!rawData || typeof rawData !== "object") {
    throw new Error(
      "Invalid game data schema: root payload must be an object."
    );
  }

  if (Array.isArray(rawData.words) && rawData.words.length > 0) {
    return rawData;
  }

  if (Array.isArray(rawData.cards) && rawData.cards.length > 0) {
    const languages =
      Array.isArray(rawData.supportedLanguages) &&
      rawData.supportedLanguages.length > 0
        ? rawData.supportedLanguages
        : ["fr"];
    const defaultLanguage =
      rawData.defaultLanguage && languages.includes(rawData.defaultLanguage)
        ? rawData.defaultLanguage
        : languages[0];

    const mappedWords = rawData.cards.map((card) => {
      const word = { id: card.id };
      const prompt = card && typeof card === "object" ? card.prompt : null;

      if (prompt && typeof prompt === "object") {
        languages.forEach((code) => {
          if (prompt[code]) {
            word[code] = prompt[code];
          }
        });
        word.text = prompt[defaultLanguage] || word.fr || word.en || "";
      }

      if (card.meta) {
        word.meta = card.meta;
      }

      return word;
    });

    return { ...rawData, words: mappedWords };
  }

  throw new Error(
    "Invalid game data schema: missing non-empty 'words' or 'cards' collection."
  );
}

function validateGameData(data) {
  if (!data || !Array.isArray(data.words) || data.words.length === 0) {
    throw new Error(
      "Invalid game data schema: 'words' array is missing or empty."
    );
  }
}

export function pullRandomWord(wordsArray) {
  if (wordsArray.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * wordsArray.length);
  const selectedWord = wordsArray[randomIndex];

  wordsArray.splice(randomIndex, 1);

  return selectedWord;
}

export function renderWordToScreen(targetElementId, wordText) {
  const targetElement = document.getElementById(targetElementId);

  if (!targetElement) {
    throw new Error(
      `DOM target missing: element with ID '${targetElementId}' not found.`
    );
  }

  targetElement.textContent = wordText;
}

export function getWordText(wordObject, language) {
  return wordObject[language] || wordObject.fr || wordObject.text;
}

export function getTabooWords(wordObject, language) {
  if (!wordObject || !wordObject.meta || !wordObject.meta.taboo) {
    return [];
  }

  const taboo = wordObject.meta.taboo;
  const languageList = Array.isArray(taboo[language]) ? taboo[language] : null;
  const fallbackList = Array.isArray(taboo.fr)
    ? taboo.fr
    : Array.isArray(taboo.en)
      ? taboo.en
      : null;
  const baseList = languageList || fallbackList || [];

  return baseList
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

const CATEGORY_COLOR_MAP = {
  yellow: { background: "#FFE9A3", text: "#4C3A05" },
  blue: { background: "#C7E3FF", text: "#0F314B" },
  green: { background: "#C7F1D4", text: "#154227" },
  red: { background: "#FFC6C6", text: "#5A1515" },
  orange: { background: "#FFD0A6", text: "#5A2E09" },
  purple: { background: "#E3D3FF", text: "#312056" },
  pink: { background: "#FFC9E2", text: "#5A1435" }
};

export function applyCategoryColorToElement(element, rawCategory) {
  if (!element) return;

  const category =
    typeof rawCategory === "string" ? rawCategory.trim().toLowerCase() : "";
  const style = CATEGORY_COLOR_MAP[category];

  if (!style) {
    element.style.backgroundColor = "";
    element.style.color = "";
    return;
  }

  element.style.backgroundColor = style.background;
  element.style.color = style.text;
}

function displayErrorState(message) {
  const body = document.querySelector("body");
  body.innerHTML = `<div class="error-screen"><h1>Erreur Système</h1><p>${message}</p></div>`;
}

export async function loadRulesIfExists(gameId, languageCode) {
  const safeId = typeof gameId === "string" ? gameId.trim() : "";
  const safeLang = typeof languageCode === "string" ? languageCode.trim() : "";

  if (!safeId || !safeLang) {
    return null;
  }

  const rulesPath = `/data/${safeId}/rules_${safeLang}.html`;

  try {
    const response = await fetch(rulesPath);

    if (!response.ok) {
      if (response.status !== 404) {
        console.warn(`Rules fetch failed for ${rulesPath}: ${response.status}`);
      }
      return null;
    }

    const content = await response.text();
    const trimmed = content.trim();

    if (!trimmed) {
      return null;
    }

    return trimmed;
  } catch (error) {
    console.warn("Rules fetch error:", error);
    return null;
  }
}
