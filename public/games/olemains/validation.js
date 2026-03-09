/**
 * Validation utilities for Olemains game
 */

/**
 * Validate timer input
 * @param {number} timerValue - Timer value to validate
 * @returns {boolean}
 */
export function isValidTimer(timerValue) {
  return !isNaN(timerValue) && timerValue >= 10 && timerValue <= 300;
}

/**
 * Validate deck object
 * @param {Object} deck - Deck to validate
 * @returns {boolean}
 */
export function isValidDeck(deck) {
  return deck && 
         typeof deck === 'object' &&
         deck.title && 
         typeof deck.title === 'string' &&
         Array.isArray(deck.words) &&
         deck.words.length > 0 &&
         deck.words.every(word => word && typeof word.fr === 'string');
}

/**
 * Validate game data structure
 * @param {Object} gameData - Game data to validate
 * @returns {boolean}
 */
export function isValidGameData(gameData) {
  return gameData &&
         Array.isArray(gameData.decks) &&
         gameData.decks.every(isValidDeck);
}

/**
 * Safe timer input reading with fallback
 * @param {HTMLInputElement} inputElement - Timer input element
 * @param {number} fallback - Fallback value if invalid
 * @returns {number}
 */
export function safeReadTimerInput(inputElement, fallback = 60) {
  try {
    const value = inputElement.valueAsNumber;
    return isValidTimer(value) ? Math.round(value) : fallback;
  } catch (error) {
    console.warn('Error reading timer input:', error);
    return fallback;
  }
}