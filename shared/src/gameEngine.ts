import {
  Card,
  GameState,
  GridCell,
  ClientGameState,
  ClientPlayerView,
  LegalMove,
  MonsterCount,
  PlayerState,
  StartDiscardState,
} from './types';

// ── Utilities ─────────────────────────────────────────────────────────────────

export function generateId(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Deck ──────────────────────────────────────────────────────────────────────

export function buildDeck(): { deck: Card[]; startCards: [Card, Card] } {
  const islands: Card[] = Array.from({ length: 80 }, (_, i) => ({
    id: `island_${i + 1}`,
    type: 'island' as const,
    value: i + 1,
  }));
  const finishes: Card[] = Array.from({ length: 5 }, (_, i) => ({
    id: `finish_${i + 1}`,
    type: 'finish' as const,
    value: null,
  }));
  const startCards: [Card, Card] = [
    { id: 'start_1', type: 'start', value: null },
    { id: 'start_2', type: 'start', value: null },
  ];
  return { deck: shuffle([...islands, ...finishes]), startCards };
}

function buildMonsterCards(count: MonsterCount): Card[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `monster_${i + 1}`,
    type: 'monster' as const,
    value: null,
  }));
}

// ── Grid helpers ──────────────────────────────────────────────────────────────

export function emptyGrid(): GridCell[] {
  return Array.from({ length: 36 }, (_, i) => ({ position: i, card: null }));
}

function leftIslandValue(grid: GridCell[], pos: number): number | null {
  for (let i = pos - 1; i >= 0; i--) {
    const c = grid[i].card;
    if (c?.type === 'island') return c.value!;
  }
  return null;
}

function rightIslandValue(grid: GridCell[], pos: number): number | null {
  for (let i = pos + 1; i < 36; i++) {
    const c = grid[i].card;
    if (c?.type === 'island') return c.value!;
  }
  return null;
}

export function isValidPlacement(grid: GridCell[], pos: number, value: number): boolean {
  if (pos < 0 || pos > 35) return false;
  if (grid[pos].card !== null) return false;
  const lv = leftIslandValue(grid, pos);
  const rv = rightIslandValue(grid, pos);
  if (lv !== null && value <= lv) return false;
  if (rv !== null && value >= rv) return false;
  // Positional bounds: pos slots to the left need strictly smaller values;
  // (35-pos) slots to the right need strictly larger values (island values 1–80).
  if (value <= pos) return false;       // need at least pos values below → value >= pos+1
  if (value >= 46 + pos) return false;  // need at least 35-pos values above → value <= 45+pos
  return true;
}

export function calculateDiscardCost(grid: GridCell[], pos: number, value: number): number {
  const leftCard = pos > 0 ? grid[pos - 1].card : null;
  const rightCard = pos < 35 ? grid[pos + 1].card : null;

  const lv = leftCard?.type === 'island' ? leftCard.value! : null;
  const rv = rightCard?.type === 'island' ? rightCard.value! : null;

  if (lv !== null && rv !== null) return Math.min(value - lv, rv - value);
  if (lv !== null) return value - lv;
  if (rv !== null) return rv - value;
  return 0;
}

export function isGridComplete(grid: GridCell[]): boolean {
  return grid.every(cell => cell.card !== null);
}

export function gridFilledCount(grid: GridCell[]): number {
  return grid.filter(c => c.card !== null).length;
}

// ── Legal-move computation ────────────────────────────────────────────────────

export function computeLegalMoves(state: GameState, playerIndex: 0 | 1): LegalMove[] {
  if (state.phase !== 'playing' && state.phase !== 'finish_pending') return [];
  if (state.currentPlayerIndex !== playerIndex) return [];

  const player = state.players[playerIndex];

  // In finish_pending: only monster plays are legal
  if (state.phase === 'finish_pending') {
    const moves: LegalMove[] = [];
    for (const card of player.hand) {
      if (card.type !== 'monster') continue;
      for (let pos = 0; pos < 36; pos++) {
        if (state.grid[pos].card !== null) {
          moves.push({ cardId: card.id, position: pos, discardCost: 0 });
        }
      }
    }
    return moves;
  }

  // Normal playing phase
  const moves: LegalMove[] = [];

  // Forced Start: if player holds Start card and it hasn't been played, ONLY that move is legal
  const hasUnplayedStart = !state.startCardPlayed && player.hand.some(c => c.type === 'start');
  if (hasUnplayedStart) {
    for (const card of player.hand) {
      if (card.type === 'start') {
        moves.push({ cardId: card.id, position: -1, discardCost: 0 });
      }
    }
    return moves;
  }

  // Cards available to pay discard costs (monsters cannot be discarded)
  const discardableCount = player.hand.filter(c => c.type !== 'monster').length;

  for (const card of player.hand) {
    if (card.type === 'start') {
      // Start already played — treat as dead card (can be discarded via discard-two if needed)
      continue;
    }
    if (card.type === 'finish') {
      if (state.startCardPlayed && isGridComplete(state.grid)) {
        moves.push({ cardId: card.id, position: -1, discardCost: 0 });
      }
      continue;
    }
    if (card.type === 'monster') {
      for (let pos = 0; pos < 36; pos++) {
        if (state.grid[pos].card !== null) {
          moves.push({ cardId: card.id, position: pos, discardCost: 0 });
        }
      }
      continue;
    }
    // Island card
    for (let pos = 0; pos < 36; pos++) {
      if (!isValidPlacement(state.grid, pos, card.value!)) continue;
      const cost = calculateDiscardCost(state.grid, pos, card.value!);
      // Available discards: all non-monster cards except the card being played
      const available = discardableCount - 1; // exclude the island card itself
      if (cost <= available) {
        moves.push({ cardId: card.id, position: pos, discardCost: cost });
      }
    }
  }
  return moves;
}

export function canDiscardTwo(state: GameState, playerIndex: 0 | 1): boolean {
  if (state.phase !== 'playing') return false;
  if (state.currentPlayerIndex !== playerIndex) return false;
  const player = state.players[playerIndex];
  // Need at least 2 non-monster cards to discard
  const discardable = player.hand.filter(c => c.type !== 'monster');
  if (discardable.length < 2) return false;
  if (!state.startCardPlayed && player.hand.some(c => c.type === 'start')) return false;
  return true;
}

function hasAnyLegalAction(state: GameState, playerIndex: 0 | 1): boolean {
  // In finish_pending, the game never ends by loss — only by win when all monsters played
  if (state.phase === 'finish_pending') return true;
  if (computeLegalMoves(state, playerIndex).length > 0) return true;
  return canDiscardTwo(state, playerIndex);
}

// ── Game initialisation ───────────────────────────────────────────────────────

export function initializeGame(
  roomId: string,
  p0: { id: string; name: string },
  p1: { id: string; name: string },
  monsterCount: MonsterCount = 0
): GameState {
  const { deck, startCards } = buildDeck();
  const monsters = buildMonsterCards(monsterCount);

  // Split island+finish+monster cards between the two players.
  // Use Math.floor so both players get the same number of cards; if the
  // total is odd one card remains unused (85 base cards → each gets 42).
  const combined = shuffle([...deck, ...monsters]);
  const half = Math.floor(combined.length / 2);
  const split0 = combined.slice(0, half);
  const split1 = combined.slice(combined.length - half);

  // Draw initial hand of 5 BEFORE shuffling in the Start card (rule §3 step 5)
  const hand0 = split0.slice(0, 5);
  const hand1 = split1.slice(0, 5);

  // Shuffle Start card into the remaining draw pile (never in starting hand)
  const deck0 = shuffle([...split0.slice(5), startCards[0]]);
  const deck1 = shuffle([...split1.slice(5), startCards[1]]);

  const player0: PlayerState = { id: p0.id, name: p0.name, hand: hand0, deck: deck0, discardCount: 0 };
  const player1: PlayerState = { id: p1.id, name: p1.name, hand: hand1, deck: deck1, discardCount: 0 };

  return {
    roomId,
    phase: 'playing',
    grid: emptyGrid(),
    players: [player0, player1],
    currentPlayerIndex: 0,
    startCardPlayed: false,
    startDiscardState: null,
    monsterCount,
    winner: null,
  };
}

// ── Draw helpers ──────────────────────────────────────────────────────────────

function drawUp(player: PlayerState, target = 5): PlayerState {
  const needed = target - player.hand.length;
  if (needed <= 0 || player.deck.length === 0) return player;
  const drawn = player.deck.slice(0, needed);
  return {
    ...player,
    hand: [...player.hand, ...drawn],
    deck: player.deck.slice(needed),
  };
}

// ── finish_pending resolver ───────────────────────────────────────────────────

function anyHandHasMonster(state: GameState): boolean {
  return state.players.some(p => p.hand.some(c => c.type === 'monster'));
}

// Called after entering or advancing finish_pending. Handles auto-skip and win.
function resolveFinishPending(state: GameState): GameState {
  if (state.phase !== 'finish_pending') return state;

  // All monsters played → win
  if (!anyHandHasMonster(state)) {
    return { ...state, phase: 'won', winner: 'players' };
  }

  // Current player has no monster → skip to the other player
  const curr = state.players[state.currentPlayerIndex];
  if (!curr.hand.some(c => c.type === 'monster')) {
    const next: 0 | 1 = state.currentPlayerIndex === 0 ? 1 : 0;
    return resolveFinishPending({ ...state, currentPlayerIndex: next });
  }

  return state;
}

// ── Move application ──────────────────────────────────────────────────────────

export type MoveResult =
  | { ok: true; state: GameState }
  | { ok: false; error: string };

export function applyPlayCard(
  state: GameState,
  playerIndex: 0 | 1,
  cardId: string,
  position: number,
  discardCardIds: string[]
): MoveResult {
  const isFinishPending = state.phase === 'finish_pending';
  if (state.phase !== 'playing' && !isFinishPending) {
    return { ok: false, error: 'Not in playing phase' };
  }
  if (state.currentPlayerIndex !== playerIndex) return { ok: false, error: 'Not your turn' };

  const player = { ...state.players[playerIndex], hand: [...state.players[playerIndex].hand] };
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return { ok: false, error: 'Card not in hand' };

  const card = player.hand[cardIndex];

  // ── Monster card ──
  if (card.type === 'monster') {
    if (position < 0 || position > 35) return { ok: false, error: 'Monster must target a grid position' };
    if (state.grid[position].card === null) return { ok: false, error: 'Target cell is empty' };

    player.hand.splice(cardIndex, 1);
    // Remove the targeted card from the grid
    const newGrid = state.grid.map(cell =>
      cell.position === position ? { ...cell, card: null } : cell
    );

    const drawnPlayer = drawUp(player);
    const players: [PlayerState, PlayerState] = [...state.players] as [PlayerState, PlayerState];
    players[playerIndex] = drawnPlayer;

    const nextPlayerIndex: 0 | 1 = playerIndex === 0 ? 1 : 0;
    let newState: GameState = {
      ...state,
      grid: newGrid,
      players,
      currentPlayerIndex: nextPlayerIndex,
    };

    if (isFinishPending) {
      newState = resolveFinishPending(newState);
    } else {
      // Playing phase: check loss for next player
      if (!hasAnyLegalAction(newState, nextPlayerIndex)) {
        newState = { ...newState, phase: 'lost', winner: 'game' };
      }
    }
    return { ok: true, state: newState };
  }

  // Reject non-monster actions during finish_pending
  if (isFinishPending) return { ok: false, error: 'Only monster cards can be played now' };

  // ── Start card ──
  if (card.type === 'start') {
    if (state.startCardPlayed) return { ok: false, error: 'Start already played' };
    if (position !== -1) return { ok: false, error: 'Start card goes to start space' };

    player.hand.splice(cardIndex, 1);

    let p0 = { ...state.players[0], hand: [...state.players[0].hand], deck: [...state.players[0].deck] };
    let p1 = { ...state.players[1], hand: [...state.players[1].hand], deck: [...state.players[1].deck] };
    if (playerIndex === 0) p0 = { ...player };
    else p1 = { ...player };

    p0 = drawUp(p0, 7);
    p1 = drawUp(p1, 7);

    const startDiscardState: StartDiscardState = {
      remaining: 8,
      contributions: [0, 0],
      currentContributor: playerIndex,
    };

    return {
      ok: true,
      state: {
        ...state,
        phase: 'start_discard',
        players: [p0, p1],
        startCardPlayed: true,
        startDiscardState,
      },
    };
  }

  // ── Finish card ──
  if (card.type === 'finish') {
    if (!state.startCardPlayed) return { ok: false, error: 'Start card not played yet' };
    if (!isGridComplete(state.grid)) return { ok: false, error: 'Grid not complete yet' };

    player.hand.splice(cardIndex, 1);
    const players: [PlayerState, PlayerState] = [...state.players] as [PlayerState, PlayerState];
    players[playerIndex] = player;

    // Check if any player holds a monster — if so, enter finish_pending
    const monstersRemain = anyHandHasMonster({ ...state, players });
    if (monstersRemain) {
      const nextPlayerIndex: 0 | 1 = playerIndex === 0 ? 1 : 0;
      let newState: GameState = {
        ...state,
        phase: 'finish_pending',
        players,
        currentPlayerIndex: nextPlayerIndex,
      };
      newState = resolveFinishPending(newState);
      return { ok: true, state: newState };
    }

    return {
      ok: true,
      state: { ...state, phase: 'won', winner: 'players', players },
    };
  }

  // ── Island card ──
  if (card.type !== 'island') return { ok: false, error: 'Unknown card type' };
  if (position < 0 || position > 35) return { ok: false, error: 'Invalid position' };
  if (!isValidPlacement(state.grid, position, card.value!))
    return { ok: false, error: 'Invalid placement (breaks ascending order or cell occupied)' };

  const cost = calculateDiscardCost(state.grid, position, card.value!);

  if (discardCardIds.length !== cost)
    return { ok: false, error: `Must discard exactly ${cost} cards` };

  // Validate: discard cards are in hand (excluding card being played) and are not monsters
  const handAfterPlay = player.hand.filter(c => c.id !== cardId);
  for (const did of discardCardIds) {
    const dc = handAfterPlay.find(c => c.id === did);
    if (!dc) return { ok: false, error: `Discard card ${did} not in hand` };
    if (dc.type === 'monster') return { ok: false, error: 'Cannot discard a Sea Monster card' };
  }

  // Check affordability (excluding monsters from discard pool)
  const availableToDiscard = handAfterPlay.filter(c => c.type !== 'monster').length;
  if (cost > availableToDiscard)
    return { ok: false, error: `Need ${cost} cards to discard but only ${availableToDiscard} non-monster cards available` };

  const discardSet = new Set(discardCardIds);
  player.hand = player.hand.filter(c => c.id !== cardId && !discardSet.has(c.id));
  player.discardCount += cost;

  const newGrid = state.grid.map(cell =>
    cell.position === position ? { ...cell, card } : cell
  );

  const drawnPlayer = drawUp(player);
  const players: [PlayerState, PlayerState] = [...state.players] as [PlayerState, PlayerState];
  players[playerIndex] = drawnPlayer;

  const nextPlayerIndex: 0 | 1 = playerIndex === 0 ? 1 : 0;

  let newState: GameState = {
    ...state,
    grid: newGrid,
    players,
    currentPlayerIndex: nextPlayerIndex,
  };

  if (!hasAnyLegalAction(newState, nextPlayerIndex)) {
    newState = { ...newState, phase: 'lost', winner: 'game' };
  }

  return { ok: true, state: newState };
}

export function applyDiscardTwo(
  state: GameState,
  playerIndex: 0 | 1,
  cardIds: [string, string]
): MoveResult {
  if (state.phase !== 'playing') return { ok: false, error: 'Not in playing phase' };
  if (state.currentPlayerIndex !== playerIndex) return { ok: false, error: 'Not your turn' };
  if (!canDiscardTwo(state, playerIndex)) return { ok: false, error: 'Cannot discard two right now' };

  const player = { ...state.players[playerIndex], hand: [...state.players[playerIndex].hand] };

  const toDiscard = new Set(cardIds);
  if (toDiscard.size !== 2) return { ok: false, error: 'Must discard exactly 2 distinct cards' };
  for (const id of toDiscard) {
    const card = player.hand.find(c => c.id === id);
    if (!card) return { ok: false, error: `Card ${id} not in hand` };
    if (card.type === 'monster') return { ok: false, error: 'Cannot discard a Sea Monster card' };
  }

  player.hand = player.hand.filter(c => !toDiscard.has(c.id));
  player.discardCount += 2;

  const drawnPlayer = drawUp(player);
  const players: [PlayerState, PlayerState] = [...state.players] as [PlayerState, PlayerState];
  players[playerIndex] = drawnPlayer;

  const nextPlayerIndex: 0 | 1 = playerIndex === 0 ? 1 : 0;

  let newState: GameState = {
    ...state,
    players,
    currentPlayerIndex: nextPlayerIndex,
  };

  if (!hasAnyLegalAction(newState, nextPlayerIndex)) {
    newState = { ...newState, phase: 'lost', winner: 'game' };
  }

  return { ok: true, state: newState };
}

export function applyContributeStartDiscard(
  state: GameState,
  playerIndex: 0 | 1,
  cardIds: string[]
): MoveResult {
  if (state.phase !== 'start_discard') return { ok: false, error: 'Not in start discard phase' };
  const sds = state.startDiscardState!;
  if (sds.currentContributor !== playerIndex) return { ok: false, error: 'Not your turn to contribute' };

  const player = { ...state.players[playerIndex], hand: [...state.players[playerIndex].hand] };

  if (cardIds.length > sds.remaining) return { ok: false, error: `Cannot discard more than ${sds.remaining} cards` };
  if (cardIds.length > player.hand.length) return { ok: false, error: 'Not enough cards in hand' };

  const toDiscard = new Set(cardIds);
  for (const id of toDiscard) {
    const card = player.hand.find(c => c.id === id);
    if (!card) return { ok: false, error: `Card ${id} not in hand` };
    if (card.type === 'monster') return { ok: false, error: 'Cannot discard a Sea Monster card' };
  }

  player.hand = player.hand.filter(c => !toDiscard.has(c.id));
  player.discardCount += cardIds.length;

  const newContributions: [number, number] = [...sds.contributions] as [number, number];
  newContributions[playerIndex] += cardIds.length;
  const newRemaining = sds.remaining - cardIds.length;

  const players: [PlayerState, PlayerState] = [...state.players] as [PlayerState, PlayerState];
  players[playerIndex] = player;

  if (newRemaining === 0) {
    const p0 = drawUp(players[0]);
    const p1 = drawUp(players[1]);
    const nextPlayers: [PlayerState, PlayerState] = [p0, p1];
    const nextPlayerIndex: 0 | 1 = state.currentPlayerIndex;

    let newState: GameState = {
      ...state,
      phase: 'playing',
      players: nextPlayers,
      startDiscardState: null,
      currentPlayerIndex: nextPlayerIndex,
    };

    if (!hasAnyLegalAction(newState, nextPlayerIndex)) {
      newState = { ...newState, phase: 'lost', winner: 'game' };
    }

    return { ok: true, state: newState };
  }

  const otherPlayer: 0 | 1 = playerIndex === 0 ? 1 : 0;

  return {
    ok: true,
    state: {
      ...state,
      players,
      startDiscardState: {
        remaining: newRemaining,
        contributions: newContributions,
        currentContributor: otherPlayer,
      },
    },
  };
}

// ── Client state builder ──────────────────────────────────────────────────────

export function buildClientState(state: GameState, myIndex: 0 | 1): ClientGameState {
  const oppIndex: 0 | 1 = myIndex === 0 ? 1 : 0;
  const me = state.players[myIndex];
  const opp = state.players[oppIndex];

  const toView = (p: PlayerState, idx: 0 | 1): ClientPlayerView => ({
    id: p.id,
    name: p.name,
    handSize: p.hand.length,
    deckSize: p.deck.length,
    discardCount: p.discardCount,
    isCurrentPlayer: state.currentPlayerIndex === idx,
  });

  const views: [ClientPlayerView, ClientPlayerView] = [
    toView(state.players[0], 0),
    toView(state.players[1], 1),
  ];

  const legalMoves = computeLegalMoves(state, myIndex);
  const discardTwo = canDiscardTwo(state, myIndex);

  let startDiscardState = null;
  if (state.startDiscardState) {
    const sds = state.startDiscardState;
    startDiscardState = {
      remaining: sds.remaining,
      myContribution: sds.contributions[myIndex],
      opponentContribution: sds.contributions[oppIndex],
      isMyTurnToContribute: sds.currentContributor === myIndex,
    };
  }

  const message = buildMessage(state, myIndex);

  return {
    roomId: state.roomId,
    phase: state.phase,
    grid: state.grid,
    myHand: me.hand,
    myPlayerIndex: myIndex,
    players: views,
    currentPlayerIndex: state.currentPlayerIndex,
    startCardPlayed: state.startCardPlayed,
    startDiscardState,
    legalMoves,
    canDiscardTwo: discardTwo,
    monsterCount: state.monsterCount,
    winner: state.winner,
    message,
  };
}

function buildMessage(state: GameState, myIndex: 0 | 1): string {
  const isMyTurn = state.currentPlayerIndex === myIndex;
  const me = state.players[myIndex];
  const opp = state.players[myIndex === 0 ? 1 : 0];

  switch (state.phase) {
    case 'waiting': return 'Waiting for second player…';
    case 'won': return '🎉 You win! Paradise found!';
    case 'lost': return '💀 The ship is lost…';
    case 'finish_pending': {
      if (isMyTurn) return '🐙 Play your Sea Monster to seal the victory!';
      return `Waiting for ${opp.name} to play their Sea Monster…`;
    }
    case 'start_discard': {
      const sds = state.startDiscardState!;
      if (sds.currentContributor === myIndex) {
        return `Start card played! Select cards to discard (${sds.remaining} still needed).`;
      }
      return `Waiting for ${opp.name} to contribute to the 8-card discard…`;
    }
    case 'playing':
      if (isMyTurn) {
        if (!state.startCardPlayed && me.hand.some(c => c.type === 'start')) {
          return 'You must play your Start card!';
        }
        return 'Your turn — play a card or discard two.';
      }
      return `Waiting for ${opp.name} to play…`;
    default:
      return '';
  }
}
