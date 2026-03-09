/**
 * UI management for Olemains game
 */

import { DOM, showElement, hideElement, setElementText, setElementStyle } from './dom.js';

/**
 * Color mapping utility
 * @param {string} colorString - Color name
 * @returns {string} Hex color code
 */
export function mapColor(colorString) {
  const colors = {
    green: '#28a745',
    orange: '#fd7e14', 
    pink: '#e83e8c',
    blue: '#007bff'
  };
  return colors[colorString] || '#6c757d';
}

/**
 * Build deck selection menu
 * @param {Array} decks - Array of deck objects
 * @param {Function} onDeckSelect - Callback when deck is selected
 */
export function buildDeckMenu(decks, onDeckSelect) {
  DOM.deckGrid.innerHTML = '';
  
  decks.forEach(deck => {
    const btn = document.createElement('button');
    btn.className = 'deck-btn';
    btn.textContent = deck.title;

    const bgColor = mapColor(deck.color);
    btn.style.backgroundColor = bgColor;

    btn.addEventListener('click', () => onDeckSelect(deck, bgColor));
    DOM.deckGrid.appendChild(btn);
  });
}

/**
 * Read timer input value with validation
 * @returns {number} Valid timer duration (10-300 seconds)
 */
export function readTimerInput() {
  const raw = DOM.timerInput.valueAsNumber;
  const isValid = !isNaN(raw) && raw >= 10 && raw <= 300;
  return isValid ? Math.round(raw) : 60;
}

/**
 * Update game HUD (Heads Up Display)
 * @param {number} score - Current score
 * @param {number} timeLeft - Time remaining
 */
export function updateHUD(score, timeLeft) {
  setElementText(DOM.scoreDisplay, score);
  setElementText(DOM.timerDisplay, timeLeft);
}

/**
 * Show game over message
 * @param {string} message - Game over message
 * @param {string} bgColor - Background color
 */
export function showGameOver(message, bgColor = '#333') {
  setElementText(DOM.wordDisplay, message);
  setElementStyle(DOM.cardBackground, {
    backgroundColor: bgColor,
    color: '#ffffff'
  });
}

/**
 * Show current word
 * @param {string} word - Word to display
 */
export function showWord(word) {
  setElementText(DOM.wordDisplay, word);
}

/**
 * Show setup view (deck selection)
 */
export function showSetupView() {
  hideElement(DOM.gameView);
  showElement(DOM.setupView);
}

/**
 * Show game view
 * @param {string} bgColor - Background color for the deck
 */
export function showGameView(bgColor) {
  setElementStyle(DOM.cardBackground, {
    backgroundColor: bgColor,
    color: '#ffffff'
  });
  
  hideElement(DOM.setupView);
  showElement(DOM.gameView);
}

/**
 * Display error message
 * @param {string} message - Error message
 */
export function showError(message) {
  DOM.deckGrid.innerHTML = `<p style="color:red; font-weight:bold; text-align:center;">Erreur : ${message}</p>`;
}