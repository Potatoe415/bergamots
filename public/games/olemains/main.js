/**
 * Main game controller for Olemains
 * Coordinates game state, UI, and timer
 */

import { DOM } from './dom.js';
import { GameState } from './gameState.js';
import { GameTimer } from './timer.js';
import { buildDeckMenu, readTimerInput, updateHUD, showGameOver, showWord, showSetupView, showGameView, showError } from './ui.js';
import { isValidGameData } from './validation.js';
import { loadRulesIfExists } from '../../shared/js/engine.js';

function readHubLanguage() {
  try {
    const stored = localStorage.getItem('bergamots-lang');
    return ['fr', 'en', 'es'].includes(stored) ? stored : 'fr';
  } catch {
    return 'fr';
  }
}

class OlemainsGame {
  constructor() {
    this.gameState = new GameState();
    this.timer = new GameTimer();
    this.isGameActive = false;
    this.rulesHtml = null;
  }

  /**
   * Initialize the game
   */
  async init() {
    document.documentElement.lang = readHubLanguage();
    this.gameState.language = document.documentElement.lang;

    this.setupEventListeners();
    await this.initRulesSupport();
    
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

  async initRulesSupport() {
    const button = document.getElementById('olemains-options-button');
    const panel = document.getElementById('olemains-options-panel');
    const section = document.getElementById('olemains-rules-section');
    const content = document.getElementById('olemains-rules-content');

    if (!button || !panel || !section || !content) {
      return;
    }

    const language = document.documentElement.lang || 'fr';
    this.rulesHtml = await loadRulesIfExists('olemains', language);

    if (!this.rulesHtml) {
      section.style.display = 'none';
      return;
    }

    content.innerHTML = this.rulesHtml;
    button.style.display = 'flex';

    if (window.GameHeader) {
      window.GameHeader.initOptionsPanel(button, panel);
    }
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