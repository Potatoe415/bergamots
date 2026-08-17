const CONFIG = window.YATZY_CONFIG;
const I18N = window.YATZY_I18N || {
  t(_language, key, params = {}) {
    return String(key).replace(/\{(\w+)\}/g, (_, name) => (
      Object.prototype.hasOwnProperty.call(params, name) ? params[name] : `{${name}}`
    ));
  }
};
const MATCHMAKING = window.YATZY_MATCHMAKING;
const SCORING = window.YATZY_SCORING || {
  calculateCategoryScore() { return 0; },
  calculateUpperSection() { return 0; },
  calculateGrandTotal() { return 0; },
  calculateMinMaxDelta() { return 0; },
  isScoreboardFull() { return false; },
  isYatzyHand() { return false; }
};
const RANDOM = window.YATZY_RANDOM || {
  randomDieValue() {
    return Math.floor(Math.random() * 6) + 1;
  }
};
const ROBOT_API = window.YATZY_ROBOT || null;
const PLAYER_META = CONFIG.players;
const BONUS_CONFIG = CONFIG.bonus;
const ROBOT_CONFIG = CONFIG.robot;
const STORAGE_KEY = "yatzy-online-session";
const RULE_SETTINGS_STORAGE_KEY = "yatzy-rule-settings";
const REVERSE_SELECTION_STORAGE_KEY = "yatzy-reverse-selection";
const LOWER_RULE_OPTIONS = [
  { key: "fullHouse", scoreRule: "fullHouse", defaultEnabled: true, defaultPoints: 30, iconText: "FULL" },
  { key: "fourKind", scoreRule: "fourKind", defaultEnabled: true, defaultPoints: 40, iconText: "FOUR" },
  { key: "largeStraight", scoreRule: "straight", defaultEnabled: true, defaultPoints: 40, iconText: "LARGE" },
  { key: "smallStraight", scoreRule: "smallStraight", defaultEnabled: false, defaultPoints: 30, iconText: "SMALL" },
  { key: "threeKind", scoreRule: "threeKind", defaultEnabled: false, defaultPoints: 20, iconText: "3KIND" },
  { key: "min", scoreRule: "sumWeighted", defaultEnabled: true, defaultPoints: 1, iconText: "MIN" },
  { key: "max", scoreRule: "sumWeighted", defaultEnabled: true, defaultPoints: 1, iconText: "MAX" },
  { key: "luck", scoreRule: "sumWeighted", defaultEnabled: false, defaultPoints: 1, iconText: "LUCK" }
];
const BASE_LOWER_CATEGORY_BY_KEY = Object.fromEntries(
  CONFIG.categories.filter((category) => category.type === "lower").map((category) => [category.key, category])
);
let CATEGORIES = [];
let CATEGORY_MAP = {};
let UPPER_CATEGORIES = [];
let LOWER_CATEGORIES = [];
let robotEngine = null;
const persistedRuleSettings = readPersistedRuleSettings();
const persistedReverseDiceSelection = readPersistedReverseDiceSelection();
initializeRuntimeDefinitions(buildDefaultRuleSettings());
if (persistedRuleSettings) {
  initializeRuntimeDefinitions(persistedRuleSettings);
}

// This one object is the entire gameplay source of truth.
// The renderer reads from it, event handlers update it, and nothing in the UI
// is treated as stored game state. That keeps the architecture deterministic.
const state = createInitialState();

const elements = {
  homeButton: document.getElementById("home-button"),
  splashScreen: document.getElementById("splash-screen"),
  splashTitle: document.getElementById("splash-title"),
  localLabel: document.getElementById("local-label"),
  soloGameButton: document.getElementById("solo-game-button"),
  robotGameButton: document.getElementById("robot-game-button"),
  createGameButton: document.getElementById("create-game-button"),
  shareGameButton: document.getElementById("share-game-button"),
  cancelCreateButton: document.getElementById("cancel-create-button"),
  joinLabel: document.getElementById("join-label"),
  joinCodeInput: document.getElementById("join-code-input"),
  joinGameButton: document.getElementById("join-game-button"),
  splashStatus: document.getElementById("splash-status"),
  splashError: document.getElementById("splash-error"),
  languageLabel: document.getElementById("language-label"),
  langEn: document.getElementById("lang-en"),
  langFr: document.getElementById("lang-fr"),
  splashBackButton: document.getElementById("splash-back-button"),
  settingsButton: document.getElementById("settings-button"),
  settingsPanel: document.getElementById("settings-panel"),
  settingsList: document.getElementById("settings-list"),
  scoreSummary: document.getElementById("score-summary"),
  scoreboard: document.getElementById("scoreboard"),
  diceRow: document.getElementById("dice-row"),
  rollButton: document.getElementById("roll-button"),
  goBackButton: document.getElementById("go-back-button"),
  rollLabel: document.getElementById("roll-label"),
  rollIndicators: document.getElementById("roll-indicators"),
  celebrationLayer: document.getElementById("celebration-layer"),
  gameCard: document.getElementById("game-card"),
  gameTitle: document.getElementById("game-title"),
  restartButton: document.getElementById("restart-button")
};

let yatzyCelebrationTimeoutId = null;
let robotTurnTimeoutId = null;
let undoScoreTimeoutId = null;
let robotStepDelayMs = getRobotDelayMs(ROBOT_CONFIG.rollDelayMs);
let robotQueuedScoreCategory = null;
let remoteSyncPromise = Promise.resolve();
let pendingRemoteSyncCount = 0;
let scoringAnimationInFlight = false;
let remoteApplyInFlight = false;
const UNDO_SCORE_WINDOW_MS = 5000;

elements.soloGameButton.addEventListener("click", () => handleLocalStart("solo"));
elements.robotGameButton.addEventListener("click", () => handleLocalStart("robot"));
elements.createGameButton.addEventListener("click", handleCreateGame);
elements.shareGameButton.addEventListener("click", handleShareGame);
elements.cancelCreateButton.addEventListener("click", handleWaitingCancel);
elements.joinGameButton.addEventListener("click", handleJoinGame);
elements.joinCodeInput.addEventListener("input", handleJoinCodeInput);
elements.joinCodeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleJoinGame();
  }
});
elements.langEn.addEventListener("click", () => handleLanguageSelection("en"));
elements.langFr.addEventListener("click", () => handleLanguageSelection("fr"));
if (elements.splashBackButton) {
  elements.splashBackButton.addEventListener("click", navigateToHub);
}
if (elements.settingsButton) {
  elements.settingsButton.addEventListener("click", handleSettingsToggle);
}
if (elements.settingsList) {
  elements.settingsList.addEventListener("change", handleSettingsInputChange);
}
elements.homeButton.addEventListener("click", handleHomeNavigation);
elements.rollButton.addEventListener("click", handleRoll);
elements.goBackButton.addEventListener("click", handleSelectionCancel);
elements.restartButton.addEventListener("click", handleRestart);

render();
restoreOnlineSession();
handleDeepLinkJoin();
registerOfflineSupport();

function getRobotDelayMs(delayMs, enforceMinimum = true) {
  if (!enforceMinimum) {
    return Math.max(0, delayMs || 0);
  }

  return Math.max(ROBOT_CONFIG.minStepDelayMs || 0, delayMs || 0);
}

function clearUndoWindow() {
  clearTimeout(undoScoreTimeoutId);
  undoScoreTimeoutId = null;
}

function startUndoWindow() {
  clearUndoWindow();
  undoScoreTimeoutId = setTimeout(() => {
    state.lastCommittedTurn = null;
    undoScoreTimeoutId = null;
    render();
  }, UNDO_SCORE_WINDOW_MS);
}

function buildDefaultRuleSettings() {
  return LOWER_RULE_OPTIONS.reduce((settings, option) => {
    settings[option.key] = {
      enabled: option.defaultEnabled,
      points: option.defaultPoints
    };
    return settings;
  }, {});
}

function cloneRuleSettings(settings) {
  return LOWER_RULE_OPTIONS.reduce((copy, option) => {
    const current = settings?.[option.key];
    copy[option.key] = {
      enabled: typeof current?.enabled === "boolean" ? current.enabled : option.defaultEnabled,
      points: normalizePoints(current?.points ?? option.defaultPoints)
    };
    return copy;
  }, {});
}

function initializeRuntimeDefinitions(ruleSettings) {
  const upperCategories = CONFIG.categories.filter((category) => category.type === "upper");
  const lowerCategories = buildConfiguredLowerCategories(ruleSettings);
  CATEGORIES = [...upperCategories, ...lowerCategories];
  CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((category) => [category.key, category]));
  UPPER_CATEGORIES = CATEGORIES.filter((category) => category.type === "upper");
  LOWER_CATEGORIES = CATEGORIES.filter((category) => category.type === "lower");
  robotEngine = createRobotEngine();
}

function createRobotEngine() {
  if (ROBOT_API?.createEngine) {
    return ROBOT_API.createEngine({
      categories: CATEGORIES,
      bonus: BONUS_CONFIG,
      robot: ROBOT_CONFIG,
      evaluateCategoryScore: calculateCategoryScore,
      calculateUpperSection,
      calculateGrandTotal
    });
  }

  return {
    getDecision() {
      const availableCategory = CATEGORIES.find((category) => category.type === "lower")?.key || CATEGORIES[0]?.key || "ones";
      return {
        type: "score",
        categoryKey: availableCategory
      };
    }
  };
}

function buildConfiguredLowerCategories(ruleSettings) {
  const categories = [];

  LOWER_RULE_OPTIONS.forEach((option) => {
    const current = ruleSettings[option.key];
    if (!current?.enabled) {
      return;
    }

    const configuredPoints = normalizePoints(current.points);
    const source = BASE_LOWER_CATEGORY_BY_KEY[option.key];
    if (source) {
      categories.push({
        ...source,
        scoreRule: option.scoreRule,
        fixedScore: option.scoreRule === "sumWeighted" ? source.fixedScore : configuredPoints,
        multiplier: option.scoreRule === "sumWeighted" ? configuredPoints : source.multiplier
      });
      return;
    }

    categories.push({
      key: option.key,
      label: option.key,
      type: "lower",
      scoreRule: option.scoreRule,
      fixedScore: option.scoreRule === "sumWeighted" ? 0 : configuredPoints,
      multiplier: option.scoreRule === "sumWeighted" ? configuredPoints : 0,
      icon: { kind: "word", text: option.iconText }
    });
  });

  const hasYatzy = categories.some((category) => category.key === "yatzy");
  if (!hasYatzy && BASE_LOWER_CATEGORY_BY_KEY.yatzy) {
    categories.push(BASE_LOWER_CATEGORY_BY_KEY.yatzy);
  }

  return categories;
}

function normalizePoints(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function createInitialState() {
  // Null score slots matter because 0 is a valid Yatzy result.
  // Using null lets the app distinguish "not played yet" from "played for zero".
  const initialState = {
    screen: "splash",
    setup: {
      mode: "solo",
      language: "fr",
      settingsOpen: false,
      reverseDiceSelection: persistedReverseDiceSelection,
      rules: cloneRuleSettings(persistedRuleSettings || buildDefaultRuleSettings())
    },
    session: {
      mode: "online",
      gameCode: "",
      joinCode: "",
      role: null,
      resumeToken: "",
      localPlayerIndex: null,
      splashStatus: "",
      splashError: "",
      connectionState: "idle"
    },
    players: PLAYER_META.map((player) => ({
      name: player.name,
      isRobot: Boolean(player.isRobotDefault)
    })),
    currentPlayerIndex: 0,
    dice: Array.from({ length: 5 }, () => ({ value: null, locked: false, lastRolled: false })),
    rollsRemaining: 3,
    turnPhase: "rolling",
    scores: PLAYER_META.map(() => buildEmptyScorecard()),
    pendingScoreSelection: null,
    lastCommittedTurn: null,
    animateDiceOnRender: false,
    yatzyCelebration: null,
    gameOver: false,
    winner: null,
    statusMessage: ""
  };

  applySetupSettings(initialState);
  return initialState;
}

function t(key, params = {}, language = state.setup.language) {
  return I18N.t(language, key, params);
}

function applySetupSettings(targetState) {
  targetState.players = PLAYER_META.map((player, index) => ({
    name: t(`players.player${index + 1}`, {}, targetState.setup.language),
    isRobot: index === 1 && targetState.setup.mode === "robot"
  }));
}

function categoryIconText(categoryKey) {
  const translated = t(`categoryIcons.${categoryKey}`);
  if (translated.startsWith("categoryIcons.")) {
    return categoryLabel(categoryKey).toUpperCase().slice(0, 6);
  }
  return translated;
}

function buildEmptyScorecard() {
  return CATEGORIES.reduce((card, category) => {
    card[category.key] = null;
    return card;
  }, {});
}

function render() {
  // Centralized rendering makes the UI a pure projection of current state.
  // Any state mutation is followed by a render so visuals always stay in sync.
  renderTheme();
  renderSplash();
  elements.homeButton.classList.toggle("is-hidden", state.screen !== "game");

  elements.gameCard.classList.toggle("is-hidden", state.screen !== "game");
  if (state.screen !== "game") {
    return;
  }

  renderHeader();
  renderScoreSummary();
  renderScoreboard();
  renderDice();
  renderRollControls();
  renderCelebration();
  scheduleRobotTurnIfNeeded();
}

function renderTheme() {
  document.documentElement.lang = state.setup.language;
  document.title = t("meta.title");

  if (state.screen !== "game") {
    document.body.classList.remove("player-two-turn", "player-one-turn", "scoring-phase");
    elements.gameCard.classList.remove("yatzy-hit");
    return;
  }

  const isPlayerTwoTurn = !state.gameOver && state.currentPlayerIndex === 1;
  const isPlayerOneTurn = !state.gameOver && state.currentPlayerIndex === 0;
  const isScoringPhase = state.turnPhase === "scoring" || Boolean(state.pendingScoreSelection);

  document.body.classList.toggle("player-two-turn", isPlayerTwoTurn);
  document.body.classList.toggle("player-one-turn", isPlayerOneTurn);
  document.body.classList.toggle("scoring-phase", isScoringPhase);
  elements.gameCard.classList.toggle("yatzy-hit", Boolean(state.yatzyCelebration));
}

function isOnlineGame() {
  return Boolean(state.session.gameCode);
}

function isLocalPlayersTurn() {
  if (!isOnlineGame()) {
    return true;
  }

  return state.currentPlayerIndex === state.session.localPlayerIndex;
}

function isInteractionLocked() {
  return state.gameOver || !isLocalPlayersTurn();
}

function isRobotTurn() {
  return state.screen === "game" && !isOnlineGame() && !state.gameOver && state.players[state.currentPlayerIndex].isRobot;
}

function renderSplash() {
  const inGame = state.screen === "game";
  elements.splashScreen.classList.toggle("is-hidden", inGame);
  elements.splashTitle.textContent = t("splash.title");
  elements.localLabel.textContent = t("splash.localLabel");
  elements.soloGameButton.textContent = t("splash.soloGame");
  elements.robotGameButton.textContent = t("splash.robotGame");
  elements.joinLabel.textContent = t("splash.joinLabel");
  elements.languageLabel.textContent = t("splash.language");
  elements.langEn.setAttribute("aria-label", t("splash.english"));
  elements.langFr.setAttribute("aria-label", t("splash.french"));
  elements.langEn.setAttribute("title", t("splash.english"));
  elements.langFr.setAttribute("title", t("splash.french"));
  elements.langEn.classList.toggle("is-selected", state.setup.language === "en");
  elements.langFr.classList.toggle("is-selected", state.setup.language === "fr");
  elements.joinCodeInput.placeholder = t("splash.codePlaceholder");
  elements.joinCodeInput.value = state.session.joinCode;
  if (elements.settingsButton) {
    elements.settingsButton.setAttribute("aria-label", t("splash.settings"));
    elements.settingsButton.setAttribute("title", t("splash.settings"));
  }
  if (elements.splashBackButton) {
    elements.splashBackButton.setAttribute("aria-label", t("splash.backToHub"));
    elements.splashBackButton.setAttribute("title", t("splash.backToHub"));
  }
  elements.splashStatus.textContent = state.session.splashStatus;
  elements.splashError.textContent = state.session.splashError;
  elements.splashStatus.classList.toggle("is-visible", Boolean(state.session.splashStatus));
  elements.splashError.classList.toggle("is-visible", Boolean(state.session.splashError));

  const isCreating = state.session.connectionState === "creating";
  const isJoining = state.session.connectionState === "joining";
  const isRestoring = state.session.connectionState === "restoring";
  const isWaiting = state.session.connectionState === "waiting";
  const isBusy = isCreating || isJoining || isRestoring || isWaiting;
  if (elements.settingsPanel) {
    elements.settingsPanel.classList.toggle("is-visible", state.setup.settingsOpen);
  }
  renderSettingsRows();

  elements.soloGameButton.disabled = isBusy;
  elements.robotGameButton.disabled = isBusy;
  elements.createGameButton.textContent = isCreating
    ? t("splash.createBusy")
    : isWaiting
      ? state.session.gameCode
      : t("splash.createGame");
  elements.createGameButton.classList.toggle("is-waiting-code", isWaiting);
  elements.shareGameButton.textContent = t("splash.shareLink");
  elements.cancelCreateButton.textContent = t("splash.cancelWaiting");
  elements.joinGameButton.textContent = isJoining ? t("splash.joinBusy") : t("splash.joinGame");
  elements.shareGameButton.classList.toggle("is-visible", isWaiting);
  elements.shareGameButton.disabled = !isWaiting;
  elements.cancelCreateButton.classList.toggle("is-visible", isWaiting);
  elements.cancelCreateButton.disabled = !isWaiting;
  elements.createGameButton.disabled = isBusy;
  elements.joinCodeInput.disabled = isBusy;
  elements.joinGameButton.disabled = isBusy || state.session.joinCode.length !== 3;
  if (elements.settingsButton) {
    elements.settingsButton.disabled = isBusy;
  }
}

function renderSettingsRows() {
  if (!elements.settingsList) {
    return;
  }

  elements.settingsList.innerHTML = "";

  LOWER_RULE_OPTIONS.forEach((option) => {
    const setting = state.setup.rules[option.key];
    const row = document.createElement("label");
    row.className = "settings-row";
    row.innerHTML = `
      <span class="settings-check">
        <input type="checkbox" data-rule-key="${option.key}" data-rule-field="enabled" ${setting.enabled ? "checked" : ""}>
      </span>
      <span class="settings-name">${getRuleDisplayName(option.key)}</span>
      <input class="settings-points" type="number" min="0" step="1" data-rule-key="${option.key}" data-rule-field="points" value="${setting.points}">
    `;
    elements.settingsList.appendChild(row);
  });

  const reverseRow = document.createElement("label");
  reverseRow.className = "settings-row settings-row-toggle";
  reverseRow.innerHTML = `
    <span class="settings-check">
      <input type="checkbox" data-setting-key="reverseDiceSelection" ${state.setup.reverseDiceSelection ? "checked" : ""}>
    </span>
    <span class="settings-name">${t("splash.reverseSelection")}</span>
    <span class="settings-points settings-pill">${state.setup.reverseDiceSelection ? "ON" : "OFF"}</span>
  `;
  elements.settingsList.appendChild(reverseRow);
}

function renderHeader() {
  elements.gameTitle.textContent = isOnlineGame()
    ? `${t("splash.title")} - ${state.session.gameCode}`
    : t("splash.title");
  elements.restartButton.textContent = isOnlineGame() ? t("controls.leaveGame") : t("controls.restart");
}

function renderScoreSummary() {
  const playerOneTotal = calculateGrandTotal(state.scores[0]);
  const playerTwoTotal = calculateGrandTotal(state.scores[1]);
  const activeClass = !state.gameOver ? "is-active" : "";

  elements.scoreSummary.innerHTML = `
    <article class="score-card ${activeClass}">
      <div class="score-card-header">
        <span class="score-card-scoreline">
          <span class="score-card-value player-one-score">${playerOneTotal}</span>
          <span class="score-card-divider">/</span>
          <span class="score-card-value player-two-score">${playerTwoTotal}</span>
        </span>
      </div>
    </article>
  `;
}

function renderScoreboard() {
  // Rebuilding the board from state each time keeps move legality simple:
  // if a slot is scoreable in state, it becomes interactive in the DOM.
  elements.scoreboard.innerHTML = "";
  const targetRowCount = Math.max(
    UPPER_CATEGORIES.length + 1,
    LOWER_CATEGORIES.length
  );

  elements.scoreboard.appendChild(buildScoreGroup(UPPER_CATEGORIES, true, targetRowCount));
  elements.scoreboard.appendChild(buildScoreGroup(LOWER_CATEGORIES, false, targetRowCount));

  if (state.gameOver) {
    elements.scoreboard.appendChild(buildWinnerBanner());
  }
}

function buildScoreGroup(categories, includeBonusRow, targetRowCount) {
  const group = document.createElement("div");
  group.className = "score-group";
  let renderedRows = 0;

  categories.forEach((category) => {
    group.appendChild(buildCategoryCell(category));

    PLAYER_META.forEach((playerMeta, playerIndex) => {
      group.appendChild(buildScoreCell(category, playerIndex, playerMeta.className));
    });

    renderedRows += 1;
  });

  if (includeBonusRow) {
    group.appendChild(buildBonusLabelCell());

    PLAYER_META.forEach((playerMeta, playerIndex) => {
      group.appendChild(buildBonusProgressCell(playerIndex, playerMeta.className));
    });

    renderedRows += 1;
  }

  while (renderedRows < targetRowCount) {
    group.appendChild(buildSpacerCell());
    group.appendChild(buildSpacerCell("player-one"));
    group.appendChild(buildSpacerCell("player-two"));
    renderedRows += 1;
  }

  return group;
}

function buildCategoryCell(category) {
  const cell = document.createElement("div");
  cell.className = "score-cell category-cell";
  cell.setAttribute("title", categoryLabel(category.key));

  if (isCategoryScoreable(state.currentPlayerIndex, category.key) && !isRobotTurn()) {
    const scorePreview = previewScore(category.key);
    cell.classList.add("interactive", "valid");
    cell.setAttribute("role", "button");
    cell.setAttribute("tabindex", "0");
    cell.setAttribute("aria-label", t("aria.categoryScore", {
      category: categoryLabel(category.key),
      score: scorePreview
    }));
    cell.addEventListener("click", () => handleScoreSelection(category.key));
    cell.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleScoreSelection(category.key);
      }
    });
  }

  cell.appendChild(createCategoryIcon(category));
  return cell;
}

function buildScoreCell(category, playerIndex, className) {
  const cell = document.createElement("button");
  cell.type = "button";
  cell.className = `score-cell player-cell ${className}`;
  cell.dataset.categoryKey = category.key;
  cell.dataset.playerIndex = String(playerIndex);

  const isCurrentPlayer = playerIndex === state.currentPlayerIndex;
  const scoreValue = state.scores[playerIndex][category.key];
  const canScore = isCategoryScoreable(playerIndex, category.key);

  if (scoreValue !== null) {
    cell.classList.add("filled");
    cell.textContent = scoreValue;
    cell.disabled = true;
  } else if (canScore && !isRobotTurn()) {
    // The preview value is derived live from the dice so players can see
    // exactly what each category would score before committing the turn.
    const scorePreview = previewScore(category.key);
    cell.classList.add("interactive", "valid");
    cell.classList.add(scorePreview === 0 ? "preview-zero" : "preview-positive");
    cell.textContent = scorePreview;
    cell.addEventListener("click", () => handleScoreSelection(category.key));
    cell.setAttribute("aria-label", t("aria.playerCategoryScore", {
      player: state.players[playerIndex].name,
      category: categoryLabel(category.key),
      score: scorePreview
    }));
  } else {
    cell.classList.add("blocked");
    cell.textContent = "";
    cell.disabled = true;
  }

  if ((!isCurrentPlayer || !isLocalPlayersTurn()) && scoreValue === null) {
    cell.classList.add("blocked");
  }

  return cell;
}

function buildBonusLabelCell() {
  const cell = document.createElement("div");
  cell.className = "score-cell category-cell bonus-label";

  const wrapper = document.createElement("div");
  wrapper.className = "bonus-stack";
  wrapper.innerHTML = `
    <span class="bonus-title">${t("labels.bonus")}</span>
    <span class="bonus-value">+${BONUS_CONFIG.points}</span>
  `;

  cell.appendChild(wrapper);
  return cell;
}

function buildBonusProgressCell(playerIndex, className) {
  // Bonus display is derived each render from the recorded upper-section values.
  // That avoids mirrored aggregate state that could drift out of sync.
  const progress = calculateUpperSection(state.scores[playerIndex]);

  const cell = document.createElement("div");
  cell.className = `score-cell player-cell ${className}`;

  const bubble = document.createElement("div");
  bubble.className = "bonus-progress";
  bubble.textContent = `${progress}/${BONUS_CONFIG.threshold}`;

  cell.appendChild(bubble);
  return cell;
}

function buildSpacerCell(playerClassName = "") {
  const cell = document.createElement("div");
  cell.className = `score-cell ${playerClassName ? `player-cell spacer-cell ${playerClassName}` : "category-cell spacer-cell"}`;
  cell.setAttribute("aria-hidden", "true");
  return cell;
}

function buildWinnerBanner() {
  const overlay = document.createElement("div");
  overlay.className = "winner-banner";

  const card = document.createElement("div");
  card.className = "winner-card";

  const totals = PLAYER_META.map((_, playerIndex) => calculateGrandTotal(state.scores[playerIndex]));
  const isTie = totals[0] === totals[1];
  const headline = isTie ? t("winner.tie") : t("winner.win", { name: state.winner });

  card.innerHTML = `
    <h2>${headline}</h2>
    <p>${state.players[0].name}: ${totals[0]}</p>
    <p>${state.players[1].name}: ${totals[1]}</p>
    <p>${t("winner.useRestart")}</p>
  `;

  overlay.appendChild(card);
  return overlay;
}

function createCategoryIcon(category) {
  // The reference art uses symbolic category tiles rather than text labels,
  // so these helpers build visual icons while the game rules stay data-driven.
  if (category.face) {
    return createDieFace(category.face);
  }

  const tile = document.createElement("div");

  if (category.icon?.kind === "yatzy") {
    tile.className = "icon-tile yatzy-mark";

    const word = document.createElement("div");
    word.className = "yatzy-word";
    word.textContent = categoryIconText(category.key);
    tile.appendChild(word);
    return tile;
  }

  if (category.icon?.kind === "word") {
    tile.className = "icon-tile word-icon";
    tile.textContent = categoryIconText(category.key);
    return tile;
  }

  tile.className = "icon-tile";
  const mark = document.createElement("div");
  mark.className = "question-mark";
  mark.textContent = "?";
  tile.appendChild(mark);
  return tile;
}

function createDieFace(value) {
  const die = document.createElement("div");
  die.className = "face-die";

  const pipMap = {
    1: [5],
    2: [3, 7],
    3: [3, 5, 7],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9]
  };

  for (let index = 1; index <= 9; index += 1) {
    const slot = document.createElement("div");
    slot.className = "pip-slot";
    if (pipMap[value].includes(index)) {
      const pip = document.createElement("span");
      pip.className = "pip";
      slot.appendChild(pip);
    }
    die.appendChild(slot);
  }

  return die;
}

function renderDice() {
  elements.diceRow.innerHTML = "";
  const reverseSelectionEnabled = state.setup.reverseDiceSelection;

  state.dice.forEach((die, index) => {
    const dieTile = document.createElement("button");
    dieTile.type = "button";
    dieTile.className = "game-die";

    const turnStarted = state.rollsRemaining < 3 || state.dice.some((item) => item.value !== null);
    const freshTurn = !turnStarted;
    const finalRollState = state.rollsRemaining === 0 && die.value !== null;
    const canToggle = !state.gameOver && !state.pendingScoreSelection && turnStarted && state.turnPhase === "rolling" && isLocalPlayersTurn() && !isRobotTurn();

    const shouldReroll = reverseSelectionEnabled ? die.locked : !die.locked;
    dieTile.style.setProperty("--die-delay", `${index * 70}ms`);
    if (state.animateDiceOnRender && shouldReroll) {
      dieTile.classList.add("rolling");
    }

    if (die.locked) {
      dieTile.classList.add("locked");
      if (reverseSelectionEnabled) {
        dieTile.classList.add("reverse-selected");
      }
    }

    if (freshTurn) {
      dieTile.classList.add("armed");
    }

    if (finalRollState) {
      dieTile.classList.add("final-selected");
    }

    if (finalRollState && die.lastRolled) {
      dieTile.classList.add("final-rolled");
    }

    if (!canToggle) {
      dieTile.classList.add("not-rollable");
      dieTile.disabled = true;
    }

    dieTile.setAttribute("aria-pressed", die.locked ? "true" : "false");
    dieTile.setAttribute("aria-label", getDieAriaLabel(die, index));
    dieTile.appendChild(createGameDieContent(die));
    dieTile.addEventListener("click", () => handleDieToggle(index));
    elements.diceRow.appendChild(dieTile);
  });
}

function createGameDieContent(die) {
  const wrapper = document.createElement("div");
  wrapper.className = "die-value";

  if (die.value === null) {
    const star = document.createElement("div");
    star.className = "star-shape";
    wrapper.appendChild(star);
    return wrapper;
  }

  wrapper.appendChild(createDieFace(die.value));
  return wrapper;
}

function renderRollControls() {
  const shortLabel = PLAYER_META[state.currentPlayerIndex].shortLabel || `P${state.currentPlayerIndex + 1}`;
  elements.rollLabel.textContent = `${shortLabel} - ${t("controls.roll")}`;
  elements.rollIndicators.innerHTML = "";

  for (let rollNumber = 1; rollNumber <= 3; rollNumber += 1) {
    const chip = document.createElement("span");
    chip.className = "roll-chip";
    chip.textContent = rollNumber;

    if (rollNumber <= state.rollsRemaining) {
      chip.classList.add("active");
    }

    elements.rollIndicators.appendChild(chip);
  }

  const canRoll = !state.gameOver && state.turnPhase === "rolling" && state.rollsRemaining > 0 && isLocalPlayersTurn() && !isRobotTurn();
  const showGoBack = Boolean(state.lastCommittedTurn) && !state.gameOver && !isOnlineGame();
  const controlsLocked = isInteractionLocked() || scoringAnimationInFlight;
  elements.rollButton.disabled = !canRoll;
  elements.goBackButton.textContent = t("controls.goBack");
  elements.goBackButton.disabled = controlsLocked;
  elements.goBackButton.classList.toggle("is-hidden", !showGoBack);
}

function renderCelebration() {
  if (!state.yatzyCelebration) {
    elements.celebrationLayer.innerHTML = "";
    return;
  }

  const particleMarkup = Array.from({ length: 18 }, (_, index) => (
    `<span style="--i:${index}"></span>`
  )).join("");

  elements.celebrationLayer.innerHTML = `
    <div class="yatzy-celebration">
      <div class="yatzy-burst"></div>
      <div class="yatzy-particles">${particleMarkup}</div>
      <div class="yatzy-banner">
        <strong>YATZY!</strong>
        <span>${t("celebration.rolledFiveKind", {
          playerName: state.yatzyCelebration.playerName,
          faceLabel: state.yatzyCelebration.faceLabel
        })}</span>
      </div>
    </div>
  `;
}

function handleLanguageSelection(language) {
  state.setup.language = language;
  applySetupSettings(state);
  render();
}

function handleSettingsToggle() {
  state.setup.settingsOpen = !state.setup.settingsOpen;
  render();
}

function handleSettingsInputChange(event) {
  const target = event.target;
  const settingKey = target.dataset.settingKey;
  if (settingKey === "reverseDiceSelection") {
    state.setup.reverseDiceSelection = Boolean(target.checked);
    persistReverseDiceSelection(state.setup.reverseDiceSelection);
    render();
    return;
  }

  const ruleKey = target.dataset.ruleKey;
  const field = target.dataset.ruleField;

  if (!ruleKey || !field || !state.setup.rules[ruleKey]) {
    return;
  }

  if (field === "enabled") {
    state.setup.rules[ruleKey].enabled = Boolean(target.checked);
  } else if (field === "points") {
    state.setup.rules[ruleKey].points = normalizePoints(target.value);
    target.value = state.setup.rules[ruleKey].points;
  }

  initializeRuntimeDefinitions(state.setup.rules);
  persistRuleSettings(state.setup.rules);
  state.scores = PLAYER_META.map(() => buildEmptyScorecard());
  state.pendingScoreSelection = null;
  state.lastCommittedTurn = null;
  clearUndoWindow();
  clearUndoWindow();
  state.currentPlayerIndex = 0;
  state.dice = Array.from({ length: 5 }, () => ({ value: null, locked: false, lastRolled: false }));
  state.rollsRemaining = 3;
  state.turnPhase = "rolling";
  state.gameOver = false;
  state.winner = null;
  render();
}

function syncRuntimeRulesFromSetup() {
  state.setup.rules = cloneRuleSettings(state.setup.rules);
  initializeRuntimeDefinitions(state.setup.rules);
  persistRuleSettings(state.setup.rules);
}

function persistRuleSettings(ruleSettings) {
  if (!window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(
      RULE_SETTINGS_STORAGE_KEY,
      JSON.stringify(cloneRuleSettings(ruleSettings))
    );
  } catch (error) {
    // Preferences persistence should never break gameplay.
  }
}

function readPersistedRuleSettings() {
  if (!window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(RULE_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return cloneRuleSettings(parsed);
  } catch (error) {
    return null;
  }
}

function persistReverseDiceSelection(enabled) {
  if (!window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(
      REVERSE_SELECTION_STORAGE_KEY,
      JSON.stringify(Boolean(enabled))
    );
  } catch (error) {
    // Preferences persistence should never break gameplay.
  }
}

function readPersistedReverseDiceSelection() {
  if (!window.localStorage) {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(REVERSE_SELECTION_STORAGE_KEY);
    if (!raw) {
      return false;
    }

    return Boolean(JSON.parse(raw));
  } catch (error) {
    return false;
  }
}

async function handleRestart() {
  if (!isOnlineGame()) {
    resetGame({
      screen: "game",
      language: state.setup.language,
      mode: state.setup.mode
    });
    return;
  }

  await leaveCurrentGame();
  resetGame({
    screen: "splash",
    language: state.setup.language,
    mode: state.setup.mode
  });
}

async function handleHomeNavigation() {
  if (isOnlineGame()) {
    await leaveCurrentGame();
  }

  resetGame({
    screen: "splash",
    language: state.setup.language,
    mode: state.setup.mode
  });
}

function navigateToHub() {
  window.location.href = "/";
}

function handleLocalStart(mode) {
  syncRuntimeRulesFromSetup();
  resetGame({
    screen: "game",
    language: state.setup.language,
    mode
  });
}

async function handleWaitingCancel() {
  await leaveCurrentGame({
    deleteCurrent: true,
    purgeOlderThanMs: MATCHMAKING?.PURGE_AFTER_MS
  });
  clearDeepLinkFromUrl();
  resetGame({
    screen: "splash",
    language: state.setup.language,
    mode: state.setup.mode
  });
}

function handleJoinCodeInput(event) {
  state.session.joinCode = MATCHMAKING.normalizeCode(event.target.value);
  state.session.splashError = "";
  render();
}

async function handleShareGame() {
  if (!state.session.gameCode) {
    return;
  }

  const shareUrl = buildGameShareUrl(state.session.gameCode);

  try {
    if (navigator.share) {
      await navigator.share({
        title: t("splash.title"),
        text: state.session.splashStatus || t("splash.waitingStatus", { code: state.session.gameCode }),
        url: shareUrl
      });
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      state.session.splashStatus = t("splash.shareSuccess");
      render();
    } else {
      window.prompt("Copy this link", shareUrl);
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      return;
    }

    state.session.splashError = t("splash.shareError");
    render();
  }
}

async function handleCreateGame() {
  if (!MATCHMAKING) {
    setSplashError("missing-config");
    return;
  }

  state.setup.mode = "online";
  syncRuntimeRulesFromSetup();
  state.session.connectionState = "creating";
  state.session.role = "creator";
  state.session.resumeToken = "";
  state.session.localPlayerIndex = 0;
  state.session.splashError = "";
  state.session.splashStatus = "";
  render();

  try {
    const createdGame = await MATCHMAKING.createGame(createMatchmakingCallbacks());
    state.session.gameCode = createdGame.code;
    state.session.role = createdGame.role || "creator";
    state.session.localPlayerIndex = createdGame.localPlayerIndex ?? 0;
    state.session.resumeToken = createdGame.resumeToken || "";
    state.session.connectionState = "waiting";
    state.session.splashStatus = t("splash.waitingStatus", { code: createdGame.code });
    updateUrlForGameCode(createdGame.code);
    persistOnlineSession();
    render();
  } catch (error) {
    state.session.connectionState = "idle";
    state.session.role = null;
    state.session.resumeToken = "";
    state.session.localPlayerIndex = null;
    state.session.gameCode = "";
    setSplashError(error?.code);
    render();
  }
}

async function handleJoinGame() {
  if (!MATCHMAKING) {
    setSplashError("missing-config");
    return;
  }

  const code = MATCHMAKING.normalizeCode(state.session.joinCode);

  if (code.length !== 3) {
    setSplashError("invalid-code");
    render();
    return;
  }

  state.setup.mode = "online";
  syncRuntimeRulesFromSetup();
  state.session.connectionState = "joining";
  state.session.role = "joiner";
  state.session.resumeToken = "";
  state.session.localPlayerIndex = 1;
  state.session.gameCode = code;
  state.session.splashError = "";
  state.session.splashStatus = t("splash.joiningStatus", { code });
  render();

  try {
    const joinedGame = await MATCHMAKING.joinGame(code, createMatchmakingCallbacks());
    state.session.gameCode = joinedGame.code;
    state.session.role = joinedGame.role || "joiner";
    state.session.localPlayerIndex = joinedGame.localPlayerIndex ?? 1;
    state.session.resumeToken = joinedGame.resumeToken || "";
    state.session.connectionState = "connected";
    state.session.splashStatus = t("splash.connectedStatus", { code: joinedGame.code });
    updateUrlForGameCode(joinedGame.code);
    persistOnlineSession();
    render();
  } catch (error) {
    state.session.connectionState = "idle";
    state.session.role = null;
    state.session.resumeToken = "";
    state.session.localPlayerIndex = null;
    state.session.gameCode = "";
    state.session.splashStatus = "";
    setSplashError(error?.code);
    render();
  }
}

function handleDeepLinkJoin() {
  if (state.screen !== "splash" || readPersistedOnlineSession()) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const linkedCode = MATCHMAKING?.normalizeCode(params.get("game") || "");

  if (!linkedCode || linkedCode.length !== 3) {
    return;
  }

  state.session.joinCode = linkedCode;
  render();
  handleJoinGame();
}

async function restoreOnlineSession() {
  const persisted = readPersistedOnlineSession();

  if (!persisted || !MATCHMAKING) {
    return;
  }

  state.setup.mode = "online";
  state.session.gameCode = persisted.gameCode;
  state.session.joinCode = persisted.gameCode;
  state.session.role = persisted.role;
  state.session.resumeToken = persisted.resumeToken;
  state.session.localPlayerIndex = persisted.localPlayerIndex;
  state.session.connectionState = "restoring";
  state.session.splashError = "";
  state.session.splashStatus = t("splash.restoringStatus", { code: persisted.gameCode });
  render();

  try {
    const resumed = await MATCHMAKING.resumeGame(
      persisted.gameCode,
      persisted.role,
      persisted.resumeToken,
      createMatchmakingCallbacks()
    );
    state.session.gameCode = resumed.code;
    state.session.joinCode = resumed.code;
    state.session.connectionState = resumed.status === "waiting" ? "waiting" : "connected";
    state.session.splashStatus = resumed.status === "waiting"
      ? t("splash.waitingStatus", { code: resumed.code })
      : t("splash.connectedStatus", { code: resumed.code });
    persistOnlineSession();

    if (resumed.status === "waiting") {
      render();
    }
  } catch (error) {
    clearPersistedOnlineSession();
    state.session.connectionState = "idle";
    state.session.gameCode = "";
    state.session.joinCode = "";
    state.session.role = null;
    state.session.resumeToken = "";
    state.session.localPlayerIndex = null;
    state.session.splashStatus = "";
    setSplashError(error?.code);
    render();
  }
}

function createMatchmakingCallbacks() {
  return {
    startGameCallback: handleMatchStarted,
    stateChangeCallback: handleMatchStateChange,
    gameClosedCallback: handleMatchClosed
  };
}

function handleMatchStarted(payload) {
  const previousSession = { ...state.session };
  const freshState = createInitialState();
  freshState.screen = "game";
  freshState.setup.mode = "online";
  freshState.setup.language = state.setup.language;
  freshState.setup.reverseDiceSelection = state.setup.reverseDiceSelection;
  freshState.setup.rules = cloneRuleSettings(state.setup.rules);
  initializeRuntimeDefinitions(freshState.setup.rules);
  freshState.session = {
    ...freshState.session,
    ...previousSession,
    gameCode: payload.code,
    connectionState: "connected",
    splashError: "",
    splashStatus: t("splash.connectedStatus", { code: payload.code })
  };
  applySetupSettings(freshState);

  if (payload.gameState) {
    hydrateFromRemoteGameState(freshState, payload.gameState);
  }

  Object.assign(state, freshState);
  persistOnlineSession();
  render();

  if (!payload.gameState && state.session.localPlayerIndex === 0) {
    syncOnlineGameState();
  }
}

function handleMatchStateChange(payload) {
  state.session.gameCode = payload.code;
  persistOnlineSession();

  if (state.screen === "splash") {
    if (payload.status === "waiting" && state.session.role === "creator") {
      state.session.connectionState = "waiting";
      state.session.splashStatus = t("splash.waitingStatus", { code: payload.code });
    }

    render();
    return;
  }

  if (payload.gameState) {
    if (isSameGameState(payload.gameState, serializeGameState())) {
      return;
    }

    // While one of our own actions (die toggle/roll/score) is still being
    // written to the DB, an incoming refetch can carry a stale snapshot from
    // before that write. Applying it would visibly un-select a die, or even
    // revert a just-committed turn, since scoring flips currentPlayerIndex
    // locally before the write goes out (so isLocalPlayersTurn() alone can't
    // be used as the guard here). Local state stays authoritative for our
    // own pending action regardless of whose turn it now looks like; the
    // tick broadcast that follows the last write brings the listener back
    // in sync once every pending write has settled.
    // Also skip while an animation is already in flight, local or remote:
    // awaiting the flight animation below opens a window where a second,
    // newer refetch could otherwise interleave and apply out of order, or
    // collide with the local player's own in-progress scoring animation.
    // Dropping it here is safe — the tick broadcast after every write plus
    // the poll timer guarantee a follow-up refetch once this one finishes.
    if (pendingRemoteSyncCount > 0 || remoteApplyInFlight || scoringAnimationInFlight) {
      return;
    }

    applyRemoteGameState(payload.gameState);
  }
}

// Mirrors the local roll/score visuals (same dimmed "not-rollable" look and
// the same dice-spin / flight-to-scorecell animations already used for the
// robot's turn) so the remote player's moves are visible and clearly not the
// local player's own input, instead of the board silently jumping to a new
// state.
async function applyRemoteGameState(remoteState) {
  remoteApplyInFlight = true;
  const previousDiceValues = state.dice.map((die) => die.value);
  const previousScores = state.scores.map((scorecard) => ({ ...scorecard }));
  const previousPlayerIndex = state.currentPlayerIndex;

  // hydrateFromRemoteGameState() reads targetState.players (via
  // applyWinnerFromScores) when the incoming state ends the game, so it
  // must be seeded here even though this object is otherwise just a
  // staging area for the fields hydrate actually writes.
  const nextFields = { players: state.players };
  hydrateFromRemoteGameState(nextFields, remoteState);

  const scoreEvent = findRemoteScoreEvent(previousScores, nextFields.scores);
  if (scoreEvent) {
    await playRemoteScoreAnimation(scoreEvent);
  }

  const rolledRemotely = !scoreEvent
    && previousPlayerIndex === nextFields.currentPlayerIndex
    && nextFields.dice.some((die, index) => die.value !== previousDiceValues[index]);

  Object.assign(state, nextFields);
  state.animateDiceOnRender = rolledRemotely;
  maybeTriggerOnlineYatzyCelebration(previousDiceValues, previousPlayerIndex);
  render();

  if (rolledRemotely) {
    state.animateDiceOnRender = false;
  }

  remoteApplyInFlight = false;
}

async function playRemoteScoreAnimation(scoreEvent) {
  scoringAnimationInFlight = true;
  render();

  try {
    await animateDiceIntoScoreCell(scoreEvent.playerIndex, scoreEvent.categoryKey);
  } finally {
    scoringAnimationInFlight = false;
  }
}

function findRemoteScoreEvent(previousScores, nextScores) {
  for (let playerIndex = 0; playerIndex < nextScores.length; playerIndex += 1) {
    const previousCard = previousScores[playerIndex] || {};
    const nextCard = nextScores[playerIndex] || {};
    const filledCategory = CATEGORIES.find((category) => (
      previousCard[category.key] === null && nextCard[category.key] !== null
    ));

    if (filledCategory) {
      return { playerIndex, categoryKey: filledCategory.key };
    }
  }

  return null;
}

function maybeTriggerOnlineYatzyCelebration(previousDiceValues, previousPlayerIndex) {
  const nextDiceValues = state.dice.map((die) => die.value);
  const hadYatzyBefore = isYatzyHand(previousDiceValues);
  const hasYatzyNow = isYatzyHand(nextDiceValues);
  const sameTurnOwner = previousPlayerIndex === state.currentPlayerIndex;

  if (hadYatzyBefore || !hasYatzyNow || !sameTurnOwner) {
    return;
  }

  clearTimeout(yatzyCelebrationTimeoutId);
  state.yatzyCelebration = {
    playerName: state.players[state.currentPlayerIndex].name,
    faceLabel: numberToWord(nextDiceValues[0])
  };

  yatzyCelebrationTimeoutId = setTimeout(() => {
    state.yatzyCelebration = null;
    render();
  }, 1700);
}

function handleMatchClosed({ reason }) {
  clearPersistedOnlineSession();
  clearDeepLinkFromUrl();
  resetGame({
    screen: "splash",
    language: state.setup.language
  });

  if (reason) {
    setSplashError(reason === "expired" ? "game-expired" : "roomClosed");
    render();
  }
}

async function leaveCurrentGame(options = {}) {
  if (!MATCHMAKING) {
    return;
  }

  try {
    await MATCHMAKING.leaveGame(options);
  } catch (error) {
    // Leaving is best-effort. The local reset below still returns the UI safely.
  }

  clearPersistedOnlineSession();
  clearDeepLinkFromUrl();
}

function setSplashError(errorCode) {
  const translationKey = {
    "missing-config": "splash.missingConfig",
    "invalid-code": "splash.invalidCode",
    "game-not-found": "splash.gameNotFound",
    "game-expired": "splash.gameExpired",
    "game-in-progress": "splash.gameInProgress",
    "resume-denied": "splash.gameInProgress",
    replaced: "splash.sessionReplaced",
    missing: "splash.roomClosed",
    expired: "splash.gameExpired"
  }[errorCode] || "splash.genericError";

  state.session.splashError = t(translationKey);
}

function resetGame({
  screen = state.screen,
  language = state.setup.language,
  mode = state.setup.mode
} = {}) {
  clearTimeout(yatzyCelebrationTimeoutId);
  clearTimeout(robotTurnTimeoutId);
  clearUndoWindow();
  yatzyCelebrationTimeoutId = null;
  robotTurnTimeoutId = null;
  robotQueuedScoreCategory = null;
  robotStepDelayMs = getRobotDelayMs(ROBOT_CONFIG.rollDelayMs);

  const freshState = createInitialState();
  freshState.screen = screen;
  freshState.setup.mode = mode;
  freshState.setup.language = language;
  freshState.setup.reverseDiceSelection = state.setup.reverseDiceSelection;
  freshState.setup.rules = cloneRuleSettings(state.setup.rules);
  initializeRuntimeDefinitions(freshState.setup.rules);
  applySetupSettings(freshState);
  Object.assign(state, freshState);
  if (mode !== "online") {
    clearPersistedOnlineSession();
  }
  render();
}

function persistOnlineSession() {
  if (!window.localStorage || !state.session.gameCode || !isOnlineGame()) {
    return;
  }

  const payload = {
    gameCode: state.session.gameCode,
    role: state.session.role,
    resumeToken: state.session.resumeToken,
    localPlayerIndex: state.session.localPlayerIndex
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function buildGameShareUrl(gameCode) {
  const url = new URL(window.location.href);
  url.searchParams.set("game", gameCode);
  return url.toString();
}

function updateUrlForGameCode(gameCode) {
  const url = new URL(window.location.href);
  url.searchParams.set("game", gameCode);
  window.history.replaceState({}, "", url);
}

function clearDeepLinkFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("game")) {
    return;
  }

  url.searchParams.delete("game");
  window.history.replaceState({}, "", url);
}

function readPersistedOnlineSession() {
  if (!window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.gameCode || !parsed?.role || !parsed?.resumeToken || !Number.isInteger(parsed?.localPlayerIndex)) {
      return null;
    }

    return parsed;
  } catch (error) {
    return null;
  }
}

function clearPersistedOnlineSession() {
  if (!window.localStorage) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

function scheduleRobotTurnIfNeeded() {
  if (!isRobotTurn() || robotTurnTimeoutId) {
    return;
  }

  const delay = robotStepDelayMs;
  robotStepDelayMs = getRobotDelayMs(ROBOT_CONFIG.rollDelayMs);

  robotTurnTimeoutId = setTimeout(() => {
    robotTurnTimeoutId = null;
    runRobotTurnStep();
  }, delay);
}

function runRobotTurnStep() {
  if (!isRobotTurn()) {
    return;
  }

  if (robotQueuedScoreCategory) {
    const queuedCategoryKey = robotQueuedScoreCategory;
    robotQueuedScoreCategory = null;
    handleScoreSelection(queuedCategoryKey);
    return;
  }

  const diceValues = state.dice.map((die) => die.value);
  const turnStarted = diceValues.some((value) => value !== null);

  if (!turnStarted && state.rollsRemaining === 3) {
    robotStepDelayMs = getRobotDelayMs(ROBOT_CONFIG.rollDelayMs);
    handleRoll();
    return;
  }

  const decision = getRobotDecision();

  if (decision.type === "score") {
    robotQueuedScoreCategory = decision.categoryKey;
    robotTurnTimeoutId = setTimeout(() => {
      robotTurnTimeoutId = null;
      runRobotTurnStep();
    }, getRobotDelayMs(ROBOT_CONFIG.scoreChoiceDelayMs));
    return;
  }

  if (decision.type === "hold") {
    const lockPatternChanged = applyRobotHoldPattern(decision.lockMask);
    if (lockPatternChanged) {
      robotStepDelayMs = getRobotDelayMs(ROBOT_CONFIG.holdDelayMs, false);
      render();
      return;
    }
  }

  robotStepDelayMs = getRobotDelayMs(ROBOT_CONFIG.rollDelayMs);
  handleRoll();
}

function getRobotDecision() {
  return robotEngine.getDecision(
    state.scores[state.currentPlayerIndex],
    state.dice.map((die) => die.value),
    state.rollsRemaining
  );
}

function applyRobotHoldPattern(lockMask) {
  let changed = false;
  const reverseSelectionEnabled = state.setup.reverseDiceSelection;

  state.dice = state.dice.map((die, index) => {
    const shouldLock = Boolean(lockMask & (1 << index));
    const nextLocked = reverseSelectionEnabled ? !shouldLock : shouldLock;
    if (die.locked !== nextLocked) {
      changed = true;
    }

    return {
      ...die,
      locked: nextLocked
    };
  });

  return changed;
}

function hydrateFromRemoteGameState(targetState, remoteState) {
  targetState.currentPlayerIndex = remoteState.currentPlayerIndex === 1 ? 1 : 0;
  targetState.rollsRemaining = clampRollsRemaining(remoteState.rollsRemaining);
  targetState.turnPhase = remoteState.turnPhase === "scoring" ? "scoring" : "rolling";
  targetState.pendingScoreSelection = null;
  targetState.lastCommittedTurn = null;
  targetState.animateDiceOnRender = false;
  targetState.yatzyCelebration = null;

  targetState.dice = Array.from({ length: 5 }, (_, index) => {
    const remoteDie = Array.isArray(remoteState.dice) ? remoteState.dice[index] : null;
    const value = Number.isInteger(remoteDie?.value) && remoteDie.value >= 1 && remoteDie.value <= 6
      ? remoteDie.value
      : null;

    return {
      value,
      locked: Boolean(remoteDie?.locked),
      lastRolled: Boolean(remoteDie?.lastRolled)
    };
  });

  targetState.scores = PLAYER_META.map((_, playerIndex) => {
    const emptyCard = buildEmptyScorecard();
    const remoteCard = Array.isArray(remoteState.scores) ? remoteState.scores[playerIndex] : null;

    CATEGORIES.forEach((category) => {
      const value = remoteCard?.[category.key];
      emptyCard[category.key] = Number.isFinite(value) ? value : null;
    });

    return emptyCard;
  });

  targetState.gameOver = Boolean(remoteState.gameOver) || isScoreboardFull(targetState.scores);
  targetState.winner = null;

  if (targetState.gameOver) {
    applyWinnerFromScores(targetState);
  }
}

function clampRollsRemaining(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 3 ? parsed : 3;
}

function serializeGameState() {
  return {
    currentPlayerIndex: state.currentPlayerIndex,
    dice: state.dice.map((die) => ({
      value: die.value,
      locked: die.locked,
      lastRolled: die.lastRolled
    })),
    rollsRemaining: state.rollsRemaining,
    turnPhase: state.turnPhase,
    scores: state.scores.map((scorecard) => ({ ...scorecard })),
    gameOver: state.gameOver
  };
}

function isSameGameState(leftState, rightState) {
  return JSON.stringify(leftState) === JSON.stringify(rightState);
}

function syncOnlineGameState() {
  if (!isOnlineGame() || !MATCHMAKING) {
    return remoteSyncPromise;
  }

  const gameCode = state.session.gameCode;
  pendingRemoteSyncCount += 1;

  // Chain onto the previous send instead of firing in parallel: quick,
  // repeated die clicks must reach the server in the order they happened,
  // otherwise an earlier request finishing last could overwrite a later one.
  // serializeGameState() is read lazily inside the .then, so it always picks
  // up the freshest local state at send time, not at click time.
  remoteSyncPromise = remoteSyncPromise
    .catch(() => {})
    .then(() => MATCHMAKING.updateGameState(gameCode, serializeGameState()))
    .catch(() => {
      // The listener remains authoritative. If one sync fails, the next local
      // state change will attempt to publish again.
    })
    .finally(() => {
      pendingRemoteSyncCount -= 1;
    });

  return remoteSyncPromise;
}

function handleRoll() {
  if (state.gameOver || state.turnPhase !== "rolling" || state.rollsRemaining <= 0 || !isLocalPlayersTurn()) {
    return;
  }

  state.lastCommittedTurn = null;
  clearUndoWindow();

  const firstRollOfTurn = state.rollsRemaining === 3 && state.dice.every((die) => die.value === null);
  const reverseSelectionEnabled = state.setup.reverseDiceSelection;
  state.dice = state.dice.map((die) => {
    const shouldReroll = firstRollOfTurn || (reverseSelectionEnabled ? die.locked : !die.locked);
    if (!shouldReroll) {
      return { ...die, lastRolled: false };
    }

    return { ...die, value: randomDieValue(), lastRolled: true };
  });
  state.animateDiceOnRender = true;

  state.rollsRemaining -= 1;

  const allRollsSpent = state.rollsRemaining === 0;
  const playerName = state.players[state.currentPlayerIndex].name;
  state.turnPhase = allRollsSpent ? "scoring" : "rolling";
  state.statusMessage = allRollsSpent
    ? `${playerName}, choose a category for this turn.`
    : `${playerName}, roll again or score whenever you are ready.`;

  maybeTriggerYatzyCelebration();

  render();
  syncOnlineGameState();
  state.animateDiceOnRender = false;
}

function handleDieToggle(index) {
  const turnStarted = state.rollsRemaining < 3 || state.dice.some((die) => die.value !== null);

  if (!turnStarted || state.turnPhase !== "rolling" || state.gameOver || state.pendingScoreSelection || !isLocalPlayersTurn()) {
    return;
  }

  state.dice = state.dice.map((die, dieIndex) => (
    dieIndex === index
      ? { ...die, locked: !die.locked }
      : die
  ));
  state.lastCommittedTurn = null;
  clearUndoWindow();

  render();
  syncOnlineGameState();
}

function maybeTriggerYatzyCelebration() {
  const values = state.dice.map((die) => die.value);

  if (!isYatzyHand(values)) {
    return;
  }

  clearTimeout(yatzyCelebrationTimeoutId);
  state.yatzyCelebration = {
    playerName: state.players[state.currentPlayerIndex].name,
    faceLabel: numberToWord(values[0])
  };

  yatzyCelebrationTimeoutId = setTimeout(() => {
    state.yatzyCelebration = null;
    render();
  }, 1700);
}

async function handleScoreSelection(categoryKey) {
  if (!isCategoryScoreable(state.currentPlayerIndex, categoryKey) || !isLocalPlayersTurn()) {
    return;
  }

  if (scoringAnimationInFlight) {
    return;
  }

  state.lastCommittedTurn = null;

  if (isRobotTurn()) {
    const score = previewScore(categoryKey);
    commitScoreSelection(state.currentPlayerIndex, categoryKey, score, null);
    return;
  }

  const playerIndex = state.currentPlayerIndex;
  const score = previewScore(categoryKey);
  const turnSnapshot = {
    currentPlayerIndex: state.currentPlayerIndex,
    dice: state.dice.map((die) => ({ ...die })),
    rollsRemaining: state.rollsRemaining,
    turnPhase: state.turnPhase
  };
  scoringAnimationInFlight = true;
  render();
  try {
    await animateDiceIntoScoreCell(playerIndex, categoryKey);
  } finally {
    scoringAnimationInFlight = false;
  }
  commitScoreSelection(playerIndex, categoryKey, score, turnSnapshot);
}

function handleSelectionCancel() {
  if (!state.lastCommittedTurn || isOnlineGame() || scoringAnimationInFlight) {
    return;
  }

  const { playerIndex, categoryKey, score, turnSnapshot } = state.lastCommittedTurn;
  clearUndoWindow();
  state.scores[playerIndex][categoryKey] = null;
  state.currentPlayerIndex = turnSnapshot.currentPlayerIndex;
  state.dice = turnSnapshot.dice.map((die) => ({ ...die }));
  state.rollsRemaining = turnSnapshot.rollsRemaining;
  state.turnPhase = turnSnapshot.turnPhase;
  state.pendingScoreSelection = null;
  state.lastCommittedTurn = null;
  state.statusMessage = `${state.players[playerIndex].name} score ${score} reverted. Choose another category.`;
  render();
}

function getSelectedScoreCell(playerIndex, categoryKey) {
  return elements.scoreboard.querySelector(
    `.player-cell[data-player-index="${playerIndex}"][data-category-key="${categoryKey}"]`
  );
}

function createFlightClone(dieElement) {
  const clone = dieElement.cloneNode(true);
  const dieRect = dieElement.getBoundingClientRect();
  clone.style.position = "fixed";
  clone.style.top = `${dieRect.top}px`;
  clone.style.left = `${dieRect.left}px`;
  clone.style.width = `${dieRect.width}px`;
  clone.style.height = `${dieRect.height}px`;
  clone.style.margin = "0";
  clone.style.pointerEvents = "none";
  clone.style.zIndex = "50";
  return clone;
}

function animateCloneIntoCell(clone, dieRect, cellRect, index, totalCount) {
  const cellCenterX = cellRect.left + (cellRect.width / 2);
  const cellCenterY = cellRect.top + (cellRect.height / 2);
  const spread = (index - ((totalCount - 1) / 2)) * Math.max(10, cellRect.width * 0.08);
  const targetX = (cellCenterX + spread) - (dieRect.left + (dieRect.width / 2));
  const targetY = cellCenterY - (dieRect.top + (dieRect.height / 2));
  const animation = clone.animate([
    { transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
    { transform: `translate3d(${targetX * 0.55}px, ${(targetY * 0.2) - 36}px, 0) scale(0.95) rotate(${(index - 2) * 8}deg)`, opacity: 0.96, offset: 0.62 },
    { transform: `translate3d(${targetX}px, ${targetY}px, 0) scale(0.34) rotate(${(index - 2) * 18}deg)`, opacity: 0.02, offset: 1 }
  ], {
    duration: 500 + (index * 36),
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "forwards"
  });
  return animation.finished.catch(() => undefined);
}

async function animateDiceIntoScoreCell(playerIndex, categoryKey) {
  const targetCell = getSelectedScoreCell(playerIndex, categoryKey);
  const diceElements = Array.from(elements.diceRow.querySelectorAll(".game-die"));
  if (!targetCell || diceElements.length === 0) {
    return;
  }

  const targetRect = targetCell.getBoundingClientRect();
  const clones = diceElements.map((dieElement) => {
    const dieRect = dieElement.getBoundingClientRect();
    const clone = createFlightClone(dieElement);
    document.body.appendChild(clone);
    return { clone, dieRect };
  });

  elements.diceRow.classList.add("is-score-animating");
  targetCell.classList.add("score-cell-catch");
  await Promise.all(clones.map((entry, index) => (
    animateCloneIntoCell(entry.clone, entry.dieRect, targetRect, index, clones.length)
  )));
  clones.forEach((entry) => entry.clone.remove());
  elements.diceRow.classList.remove("is-score-animating");
  targetCell.classList.remove("score-cell-catch");
}

function commitScoreSelection(playerIndex, categoryKey, score, turnSnapshot) {
  state.scores[playerIndex][categoryKey] = score;
  state.pendingScoreSelection = null;
  state.lastCommittedTurn = null;
  clearUndoWindow();

  if (isScoreboardFull()) {
    finishGame();
    render();
    syncOnlineGameState();
    return;
  }

  // A turn ends by resetting all turn-scoped state in one place,
  // which guarantees the next player starts from the same baseline every time.
  const finishedPlayerName = state.players[state.currentPlayerIndex].name;
  state.currentPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  state.dice = Array.from({ length: 5 }, () => ({ value: null, locked: false, lastRolled: false }));
  state.rollsRemaining = 3;
  state.turnPhase = "rolling";
  if (!isOnlineGame() && turnSnapshot) {
    state.lastCommittedTurn = {
      playerIndex,
      categoryKey,
      score,
      turnSnapshot
    };
    startUndoWindow();
  }
  state.statusMessage = `${finishedPlayerName} scored ${score}. ${state.players[state.currentPlayerIndex].name}, press LANCER to start your turn.`;

  render();
  syncOnlineGameState();
}

function isCategoryScoreable(playerIndex, categoryKey) {
  // Legal moves are derived purely from state:
  // active player, open score slot, and a complete rolled hand.
  const isCurrentPlayer = playerIndex === state.currentPlayerIndex;
  const slotEmpty = state.scores[playerIndex][categoryKey] === null;
  const hasRolledThisTurn = state.dice.every((die) => die.value !== null);
  return isCurrentPlayer && slotEmpty && hasRolledThisTurn && isLocalPlayersTurn();
}

function previewScore(categoryKey) {
  return calculateCategoryScore(categoryKey, state.dice.map((die) => die.value));
}

function calculateCategoryScore(categoryKey, values) {
  return SCORING.calculateCategoryScore(CATEGORY_MAP, categoryKey, values);
}

function isYatzyHand(values) {
  return SCORING.isYatzyHand(values);
}

function calculateUpperSection(scorecard) {
  return SCORING.calculateUpperSection(CATEGORIES, scorecard);
}

function calculateGrandTotal(scorecard) {
  return SCORING.calculateGrandTotal(CATEGORIES, BONUS_CONFIG, scorecard);
}

function calculateMinMaxDelta(scorecard) {
  return SCORING.calculateMinMaxDelta(scorecard);
}

function isScoreboardFull(scoreMatrix = state.scores) {
  return SCORING.isScoreboardFull(CATEGORIES, scoreMatrix);
}

function finishGame() {
  state.gameOver = true;
  applyWinnerFromScores(state);
}

function applyWinnerFromScores(targetState) {
  const playerOneTotal = calculateGrandTotal(targetState.scores[0]);
  const playerTwoTotal = calculateGrandTotal(targetState.scores[1]);

  if (playerOneTotal === playerTwoTotal) {
    targetState.winner = t("winner.tie");
    targetState.statusMessage = t("winner.tie");
    return;
  }

  targetState.winner = playerOneTotal > playerTwoTotal ? targetState.players[0].name : targetState.players[1].name;
  targetState.statusMessage = t("winner.win", { name: targetState.winner });
}

function getDieAriaLabel(die, index) {
  const order = index + 1;

  if (die.value === null) {
    return t("aria.dieWaiting", { order });
  }

  return t("aria.dieShowing", {
    order,
    value: die.value,
    state: die.locked ? t("diceState.kept") : t("diceState.free")
  });
}

function randomDieValue() {
  return RANDOM.randomDieValue();
}

function categoryLabel(categoryKey) {
  return t(`categories.${categoryKey}`);
}

function getRuleDisplayName(ruleKey) {
  return t(`categories.${ruleKey}`);
}

function numberToWord(value) {
  return t(`faces.${value}`);
}

function registerOfflineSupport() {
  // A tiny service worker keeps the app runnable offline after the first load
  // when it is served from http(s). Local file:// usage already has the assets.
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Offline caching is a progressive enhancement, so we silently continue.
    });
  });
}
