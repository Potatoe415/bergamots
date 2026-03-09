import { loadGameData, pullRandomWord, renderWordToScreen } from '../../shared/js/engine.js';

const CONFIG_PATH = './config/words.json';
const DISPLAY_TARGET_ID = 'word-display';
const NEXT_BUTTON_ID = 'next-word-button';

let currentAvailableWords = [];

async function initializeGame() {
  const gameData = await loadGameData(CONFIG_PATH);
  currentAvailableWords = [...gameData.words];
  
  setupEventListeners();
  displayNextWord();
}

function displayNextWord() {
  const nextWordObject = pullRandomWord(currentAvailableWords);
  
  if (!nextWordObject) {
    renderWordToScreen(DISPLAY_TARGET_ID, "Fin de la partie !");
    document.getElementById(NEXT_BUTTON_ID).disabled = true;
    return;
  }

  renderWordToScreen(DISPLAY_TARGET_ID, nextWordObject.text);
}

function setupEventListeners() {
  const nextButton = document.getElementById(NEXT_BUTTON_ID);
  
  if (!nextButton) {
    throw new Error(`Initialization failed: Button ID '${NEXT_BUTTON_ID}' not found.`);
  }

  nextButton.addEventListener('click', displayNextWord);
}

document.addEventListener('DOMContentLoaded', initializeGame);