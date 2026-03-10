import {
  loadGameData,
  pullRandomWord,
  renderWordToScreen,
  applyCategoryColorToElement,
  loadRulesIfExists
} from '../../shared/js/engine.js';

const CONFIG_PATH = '../../data/pictionary/words.json';
const DISPLAY_TARGET_ID = 'word-display';
const NEXT_BUTTON_ID = 'next-word-button';
const GAME_ID = 'pictionary';

let currentAvailableWords = [];
let rulesHtml = null;

async function initializeGame() {
  const gameData = await loadGameData(CONFIG_PATH);
  currentAvailableWords = [...gameData.words];

  await initRulesSupport();
  setupEventListeners();
  displayNextWord();
}

function displayNextWord() {
  const nextWordObject = pullRandomWord(currentAvailableWords);
  const displayElement = document.getElementById(DISPLAY_TARGET_ID);
  
  if (!nextWordObject) {
    renderWordToScreen(DISPLAY_TARGET_ID, "Fin de la partie !");
    if (displayElement) {
      applyCategoryColorToElement(displayElement, null);
    }
    document.getElementById(NEXT_BUTTON_ID).disabled = true;
    return;
  }

  renderWordToScreen(DISPLAY_TARGET_ID, nextWordObject.text);

  if (!displayElement) {
    return;
  }

  const category =
    nextWordObject.meta && nextWordObject.meta.category
      ? nextWordObject.meta.category
      : null;
  applyCategoryColorToElement(displayElement, category);
}

function setupEventListeners() {
  const nextButton = document.getElementById(NEXT_BUTTON_ID);
  
  if (!nextButton) {
    throw new Error(`Initialization failed: Button ID '${NEXT_BUTTON_ID}' not found.`);
  }

  nextButton.addEventListener('click', displayNextWord);
}

async function initRulesSupport() {
  const button = document.getElementById('pictionary-rules-button');

  if (!button) {
    return;
  }

  const language = document.documentElement.lang || 'fr';
  rulesHtml = await loadRulesIfExists(GAME_ID, language);

  if (!rulesHtml) {
    button.style.display = 'none';
    return;
  }

  button.style.display = 'flex';

  if (!button.dataset.bound) {
    button.addEventListener('click', openPictionaryRulesModal);
    button.dataset.bound = 'true';
  }
}

function openPictionaryRulesModal() {
  if (!rulesHtml) {
    return;
  }

  const existing = document.querySelector('.rules-modal-backdrop');
  if (existing) {
    existing.remove();
  }

  const backdrop = document.createElement('div');
  backdrop.className = 'rules-modal-backdrop';

  const dialog = document.createElement('div');
  dialog.className = 'rules-modal';

  const header = document.createElement('header');
  const title = document.createElement('div');
  title.className = 'rules-modal-title';
  title.textContent = 'Règles du jeu';

  const closeButton = document.createElement('button');
  closeButton.className = 'rules-modal-close';
  closeButton.type = 'button';
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', () => closeRulesModal(backdrop));

  header.appendChild(title);
  header.appendChild(closeButton);

  const content = document.createElement('div');
  content.className = 'rules-modal-content';
  content.innerHTML = rulesHtml;

  dialog.appendChild(header);
  dialog.appendChild(content);
  backdrop.appendChild(dialog);

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) {
      closeRulesModal(backdrop);
    }
  });

  document.body.appendChild(backdrop);
}

function closeRulesModal(backdropElement) {
  const target = backdropElement || document.querySelector('.rules-modal-backdrop');
  if (target && target.parentNode) {
    target.parentNode.removeChild(target);
  }
}

document.addEventListener('DOMContentLoaded', initializeGame);