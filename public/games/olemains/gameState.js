/**
 * Game state management for Olemains
 */

export class GameState {
  constructor() {
    this.gameData = null;
    this.currentWords = [];
    this.score = 0;
    this.timeLeft = 60;
    this.currentDeck = null;
    this.deckColor = null;
  }

  /**
   * Load game data from JSON file
   * Uses an absolute path so it works both locally and on Firebase.
   * @param {string} url - Path to words.json
   * @returns {Promise<void>}
   */
  async loadGameData(url = '/data/olemains/words.json') {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load game data: ${response.status}`);
      }
      this.gameData = await response.json();
      return this.gameData;
    } catch (error) {
      console.error('Error loading game data:', error);
      throw error;
    }
  }

  /**
   * Start a new game with the selected deck
   * @param {Object} deck - The deck to use
   * @param {string} bgColor - Background color for the deck
   * @param {number} timerDuration - Timer duration in seconds
   */
  startGame(deck, bgColor, timerDuration) {
    if (!deck?.words || deck.words.length === 0) {
      throw new Error('Deck has no words');
    }

    this.currentDeck = deck;
    this.deckColor = bgColor;
    this.currentWords = [...deck.words].sort(() => Math.random() - 0.5);
    this.score = 0;
    this.timeLeft = timerDuration;
  }

  /**
   * Get the next word from the current deck
   * @returns {string|null} The next word or null if deck is empty
   */
  getNextWord() {
    if (this.currentWords.length === 0) {
      return null;
    }
    return this.currentWords.pop().fr;
  }

  /**
   * Update score based on turn result
   * @param {number} points - Points to add (1 for valid, 0 for pass)
   */
  updateScore(points) {
    this.score += points;
  }

  /**
   * Decrement timer
   */
  decrementTime() {
    if (this.timeLeft > 0) {
      this.timeLeft--;
    }
  }

  /**
   * Check if game is over
   * @returns {boolean}
   */
  isGameOver() {
    return this.timeLeft <= 0 || this.currentWords.length === 0;
  }

  /**
   * Reset game state
   */
  reset() {
    this.currentWords = [];
    this.score = 0;
    this.timeLeft = 60;
    this.currentDeck = null;
    this.deckColor = null;
  }
}