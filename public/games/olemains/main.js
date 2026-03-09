/**
 * Main game controller for Olemains
 * Coordinates game state, UI, and timer
 */

import { DOM } from './dom.js';
import { GameState } from './gameState.js';
import { GameTimer } from './timer.js';
import { buildDeckMenu, readTimerInput, updateHUD, showGameOver, showWord, showSetupView, showGameView, showError } from './ui.js';
import { isValidGameData } from './validation.js';

class OlemainsGame {
  constructor() {
    this.gameState = new GameState();
    this.timer = new GameTimer();
    this.isGameActive = false;
  }

  /**
   * Initialize the game
   */
  async init() {
    this.setupEventListeners();
    
    try {
      await this.gameState.loadGameData();
      
      if (!isValidGameData(this.gameState.gameData)) {
        throw new Error('Invalid game data structure');
      }
      
      this.showDeckSelection();
    } catch (error) {
      console.error('Game initialization failed:', error);
      showError(error.message);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    DOM.btnValid.addEventListener('click', () => this.processTurn(1));
    DOM.btnPass.addEventListener('click', () => this.processTurn(0));
    DOM.btnQuit.addEventListener('click', () => this.quitGame());
  }

  /**
   * Show deck selection menu
   */
  showDeckSelection() {
    buildDeckMenu(this.gameState.gameData.decks, (deck, bgColor) => {
      this.startGame(deck, bgColor);
    });
  }

  /**
   * Start a new game with selected deck
   * @param {Object} deck - The deck to use
   * @param {string} bgColor - Background color for the deck
   */
  startGame(deck, bgColor) {
    try {
      const timerDuration = readTimerInput();
      this.gameState.startGame(deck, bgColor, timerDuration);
      
      showGameView(bgColor);
      this.updateDisplay();
      this.pullNextWord();
      this.startTimer();
      
      this.isGameActive = true;
    } catch (error) {
      console.error('Failed to start game:', error);
      showError(error.message);
    }
  }

  /**
   * Process a game turn
   * @param {number} points - Points to award (1 for valid, 0 for pass)
   */
  processTurn(points) {
    if (!this.isGameActive || this.gameState.isGameOver()) {
      return;
    }

    this.gameState.updateScore(points);
    this.updateDisplay();
    this.pullNextWord();
  }

  /**
   * Get and display the next word
   */
  pullNextWord() {
    if (this.gameState.isGameOver()) {
      this.endGame("Fin du paquet !");
      return;
    }

    const nextWord = this.gameState.getNextWord();
    if (nextWord) {
      showWord(nextWord);
    }
  }

  /**
   * Start the game timer
   */
  startTimer() {
    this.timer.start(
      this.gameState.timeLeft,
      (remaining) => {
        this.gameState.timeLeft = remaining;
        this.updateDisplay();
      },
      () => {
        this.endGame("Temps écoulé !");
      }
    );
  }

  /**
   * Update game display
   */
  updateDisplay() {
    updateHUD(this.gameState.score, this.gameState.timeLeft);
  }

  /**
   * End the current game
   * @param {string} reason - Reason for game end
   */
  endGame(reason) {
    this.isGameActive = false;
    this.timer.stop();
    
    showGameOver(reason, this.gameState.deckColor);
    
    setTimeout(() => {
      this.quitGame();
    }, 3000);
  }

  /**
   * Quit current game and return to setup
   */
  quitGame() {
    this.isGameActive = false;
    this.timer.stop();
    this.gameState.reset();
    
    showSetupView();
    this.showDeckSelection();
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new OlemainsGame();
  game.init();
});