import { loadGameData, pullRandomWord, renderWordToScreen, getWordText } from './shared/js/engine.js';

const DOM = {
  wordDisplay: 'word-display',
  controlsContainer: 'controls-container',
  banner: 'game-banner',
  score: 'score-display',
  langSelector: 'lang-selector',
  timerDisplay: 'timer-display'
};

const TIMER_OPTIONS = [0, 30, 60, 90, 120];

const LANG_LABELS = {
  fr: { ready: 'Prêt ?',    finished: 'Partie Terminée !', next: 'Mot Suivant', pass: 'Passer',  validate: 'Valider',   start: 'Démarrer', noTimer: 'Sans minuteur' },
  en: { ready: 'Ready?',    finished: 'Game Over!',         next: 'Next Word',   pass: 'Skip',    validate: 'Validate',  start: 'Start',    noTimer: 'No timer'      },
  es: { ready: '¿Listo?',   finished: '¡Juego Terminado!', next: 'Siguiente',   pass: 'Saltar',  validate: 'Validar',   start: 'Empezar',  noTimer: 'Sin tiempo'    }
};

const LANGUAGE_FLAGS = [
  { code: 'fr', flag: '🇫🇷' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'es', flag: '🇪🇸' }
];

const gameState = {
  availableWords: [],
  score: 0,
  controls: [],
  currentLanguage: 'fr',
  currentWord: null,
  phase: 'setup',
  timerDuration: 0,
  timerRemaining: 0,
  timerInterval: null
};

document.addEventListener('DOMContentLoaded', initializeWordPlayer);

async function initializeWordPlayer() {
  const urlParams = new URLSearchParams(window.location.search);
  const gameIdentifier = urlParams.get('game');

  if (!gameIdentifier) {
    handleFatalError("Erreur : Aucun jeu sélectionné dans l'URL.");
    return;
  }

  try {
    const gameConfiguration = await loadGameData(`./games/${gameIdentifier}/config/words.json`);

    gameState.availableWords = [...gameConfiguration.words];
    gameState.controls = gameConfiguration.controls || ['next'];

    hydrateUserInterface(gameIdentifier, gameConfiguration.title);
    initLanguageSelector();
    renderSetupScreen();
  } catch (error) {
    console.error(error);
    handleFatalError(`Impossible de charger : ${gameIdentifier}`);
  }
}

function hydrateUserInterface(gameIdentifier, gameTitle) {
  document.title = `${gameTitle} - Games Hub`;

  const bannerElement = document.getElementById(DOM.banner);
  if (bannerElement) {
    bannerElement.src = `./games/${gameIdentifier}/assets/thumbnail.jpg`;
  }
}

function initLanguageSelector() {
  const selectorElement = document.getElementById(DOM.langSelector);
  if (!selectorElement) return;

  LANGUAGE_FLAGS.forEach(({ code, flag }) => {
    const button = document.createElement('button');
    button.textContent = flag;
    button.className = `lang-btn${code === gameState.currentLanguage ? ' active' : ''}`;
    button.dataset.lang = code;
    button.addEventListener('click', () => handleLanguageChange(code));
    selectorElement.appendChild(button);
  });
}

function handleLanguageChange(language) {
  gameState.currentLanguage = language;

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === language);
  });

  if (gameState.phase === 'setup') {
    renderSetupScreen();
    return;
  }

  if (gameState.currentWord) {
    renderWordToScreen(DOM.wordDisplay, getWordText(gameState.currentWord, language));
  }

  renderControls(gameState.controls);
}

function renderSetupScreen() {
  gameState.phase = 'setup';
  const labels = LANG_LABELS[gameState.currentLanguage];

  renderWordToScreen(DOM.wordDisplay, labels.ready);

  const container = document.getElementById(DOM.controlsContainer);
  if (!container) return;
  container.innerHTML = '';

  const timerGroup = document.createElement('div');
  timerGroup.className = 'timer-selector';

  TIMER_OPTIONS.forEach(seconds => {
    const btn = document.createElement('button');
    btn.className = `timer-option${seconds === gameState.timerDuration ? ' active' : ''}`;
    btn.dataset.seconds = seconds;
    btn.textContent = seconds === 0 ? labels.noTimer : `${seconds}s`;
    btn.addEventListener('click', () => selectTimerOption(seconds));
    timerGroup.appendChild(btn);
  });

  container.appendChild(timerGroup);
  container.appendChild(createActionButton(labels.start, 'btn-start', startGame));
}

function selectTimerOption(seconds) {
  gameState.timerDuration = seconds;
  document.querySelectorAll('.timer-option').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.seconds) === seconds);
  });
}

function startGame() {
  gameState.phase = 'playing';
  gameState.score = 0;
  updateScoreDisplay();
  renderControls(gameState.controls);
  displayNextWord();
}

function renderControls(controlsArray) {
  const containerElement = document.getElementById(DOM.controlsContainer);
  if (!containerElement) return;

  containerElement.innerHTML = '';
  const labels = LANG_LABELS[gameState.currentLanguage];

  if (controlsArray.includes('next')) {
    containerElement.appendChild(createActionButton(labels.next, 'btn-next', displayNextWord));
  }

  if (controlsArray.includes('pass') && controlsArray.includes('validate')) {
    document.getElementById(DOM.score).style.display = 'block';
    containerElement.appendChild(createActionButton(labels.pass, 'btn-pass', () => processTurn(0)));
    containerElement.appendChild(createActionButton(labels.validate, 'btn-validate', () => processTurn(1)));
  }
}

function createActionButton(buttonText, buttonId, clickHandler) {
  const button = document.createElement('button');
  button.textContent = buttonText;
  button.id = buttonId;
  button.className = 'action-button';
  button.addEventListener('click', clickHandler);
  return button;
}

function processTurn(pointsToAdd) {
  gameState.score += pointsToAdd;
  updateScoreDisplay();
  displayNextWord();
}

function updateScoreDisplay() {
  const scoreElement = document.getElementById(DOM.score);
  if (scoreElement) {
    scoreElement.textContent = gameState.score;
  }
}

function displayNextWord() {
  const nextWord = pullRandomWord(gameState.availableWords);

  if (!nextWord) {
    executeEndGameSequence();
    return;
  }

  gameState.currentWord = nextWord;
  renderWordToScreen(DOM.wordDisplay, getWordText(nextWord, gameState.currentLanguage));
  startTimer();
}

function executeEndGameSequence() {
  stopTimer();
  hideTimerDisplay();
  gameState.currentWord = null;
  renderWordToScreen(DOM.wordDisplay, LANG_LABELS[gameState.currentLanguage].finished);

  const containerElement = document.getElementById(DOM.controlsContainer);
  if (containerElement) containerElement.innerHTML = '';
}

function startTimer() {
  if (gameState.timerDuration === 0) return;

  stopTimer();
  gameState.timerRemaining = gameState.timerDuration;
  showTimerDisplay();
  updateTimerDisplay();

  gameState.timerInterval = setInterval(() => {
    gameState.timerRemaining -= 1;
    updateTimerDisplay();

    if (gameState.timerRemaining <= 0) {
      stopTimer();
      onTimerExpired();
    }
  }, 1000);
}

function stopTimer() {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
}

function showTimerDisplay() {
  const el = document.getElementById(DOM.timerDisplay);
  if (!el) return;
  el.innerHTML = '<div class="timer-track"><div class="timer-bar"></div></div><span class="timer-count"></span>';
  el.classList.add('visible');
}

function hideTimerDisplay() {
  const el = document.getElementById(DOM.timerDisplay);
  if (el) el.classList.remove('visible');
}

function updateTimerDisplay() {
  const el = document.getElementById(DOM.timerDisplay);
  if (!el) return;

  const bar = el.querySelector('.timer-bar');
  const count = el.querySelector('.timer-count');
  const percentage = (gameState.timerRemaining / gameState.timerDuration) * 100;

  if (bar) {
    bar.style.width = `${percentage}%`;
    const urgency = percentage <= 25 ? ' danger' : percentage <= 50 ? ' warning' : '';
    bar.className = `timer-bar${urgency}`;
  }

  if (count) count.textContent = gameState.timerRemaining;
}

function onTimerExpired() {
  if (gameState.controls.includes('pass') && gameState.controls.includes('validate')) {
    processTurn(0);
  } else {
    displayNextWord();
  }
}

function handleFatalError(errorMessage) {
  const display = document.getElementById(DOM.wordDisplay);
  if (display) {
    display.innerHTML = `<span style="color: red; font-size: 1.5rem;">${errorMessage}</span>`;
  }
}
