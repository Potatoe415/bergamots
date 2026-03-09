/**
 * Loads game configuration and words from a JSON file.
 * Throws explicit errors to prevent silent UI failures if assets are missing.
 */
export async function loadGameData(jsonPath) {
    try {
      const response = await fetch(jsonPath);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for path: ${jsonPath}`);
      }
      
      const gameData = await response.json();
      validateGameData(gameData);
      
      return gameData;
    } catch (error) {
      console.error("Critical failure loading game data:", error);
      displayErrorState("Impossible de charger les données du jeu.");
      throw error;
    }
  }
  
  /**
   * Ensures the JSON payload matches the expected schema before execution.
   */
  function validateGameData(data) {
    if (!data || !Array.isArray(data.words) || data.words.length === 0) {
      throw new Error("Invalid game data schema: 'words' array is missing or empty.");
    }
  }
  
  /**
   * Selects a random word from the provided array and removes it to prevent duplicates.
   */
  export function pullRandomWord(wordsArray) {
    if (wordsArray.length === 0) {
      return null; 
    }
  
    const randomIndex = Math.floor(Math.random() * wordsArray.length);
    const selectedWord = wordsArray[randomIndex];
    
    wordsArray.splice(randomIndex, 1);
    
    return selectedWord;
  }
  
  /**
   * Updates the DOM. Isolated to keep logic and rendering separate.
   */
  export function renderWordToScreen(targetElementId, wordText) {
    const targetElement = document.getElementById(targetElementId);
    
    if (!targetElement) {
      throw new Error(`DOM target missing: element with ID '${targetElementId}' not found.`);
    }
  
    targetElement.textContent = wordText;
  }
  
/**
 * Returns the localized text for a word object, falling back to French then the base text field.
 */
export function getWordText(wordObject, language) {
  return wordObject[language] || wordObject.fr || wordObject.text;
}

  function displayErrorState(message) {
    const body = document.querySelector('body');
    body.innerHTML = `<div class="error-screen"><h1>Erreur Système</h1><p>${message}</p></div>`;
  }