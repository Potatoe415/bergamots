import { describe, it, expect } from 'vitest';
import {
  buildDeck,
  emptyGrid,
  isValidPlacement,
  calculateDiscardCost,
  initializeGame,
  applyPlayCard,
  applyDiscardTwo,
  buildClientState,
  isGridComplete,
  computeLegalMoves,
} from './gameEngine';
import type { GridCell, GameState, Card } from './types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGrid(placements: Array<[number, number]>): GridCell[] {
  const grid = emptyGrid();
  for (const [pos, val] of placements) {
    grid[pos] = { position: pos, card: { id: `island_${val}`, type: 'island', value: val } };
  }
  return grid;
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    roomId: 'TEST',
    phase: 'playing',
    grid: emptyGrid(),
    players: [
      { id: 'p0', name: 'Alice', hand: [], deck: [], discardCount: 0 },
      { id: 'p1', name: 'Bob',   hand: [], deck: [], discardCount: 0 },
    ],
    currentPlayerIndex: 0,
    startCardPlayed: true,
    startDiscardState: null,
    monsterCount: 0,
    winner: null,
    ...overrides,
  };
}

// ── Deck ──────────────────────────────────────────────────────────────────────

describe('buildDeck', () => {
  it('produces 85 shuffled cards plus 2 start cards', () => {
    const { deck, startCards } = buildDeck();
    expect(deck).toHaveLength(85); // 80 island + 5 finish
    expect(startCards).toHaveLength(2);
    expect(startCards.every(c => c.type === 'start')).toBe(true);
  });

  it('contains island values 1–80 exactly once', () => {
    const { deck } = buildDeck();
    const islands = deck.filter(c => c.type === 'island');
    expect(islands).toHaveLength(80);
    const values = islands.map(c => c.value!).sort((a, b) => a - b);
    expect(values).toEqual(Array.from({ length: 80 }, (_, i) => i + 1));
  });

  it('contains 5 finish cards', () => {
    const { deck } = buildDeck();
    expect(deck.filter(c => c.type === 'finish')).toHaveLength(5);
  });
});

// ── isValidPlacement ──────────────────────────────────────────────────────────

describe('isValidPlacement', () => {
  it('accepts a value within positional bounds on an empty grid', () => {
    const grid = emptyGrid();
    expect(isValidPlacement(grid, 10, 42)).toBe(true);
  });

  it('rejects a low value placed too far right on an empty grid', () => {
    const grid = emptyGrid();
    // value 3 needs 2 smaller values to its left; pos 17 requires 17 → invalid
    expect(isValidPlacement(grid, 17, 3)).toBe(false);
    // value 3 is only valid at positions 0–2
    expect(isValidPlacement(grid, 0, 3)).toBe(true);
    expect(isValidPlacement(grid, 2, 3)).toBe(true);
    expect(isValidPlacement(grid, 3, 3)).toBe(false);
  });

  it('rejects a high value placed too far left on an empty grid', () => {
    const grid = emptyGrid();
    // value 78 needs 2 larger values to its right; pos 34 requires 1 → valid; pos 0 needs 35 → invalid (only values 79,80 exist)
    expect(isValidPlacement(grid, 0, 78)).toBe(false);
    expect(isValidPlacement(grid, 33, 78)).toBe(true);
  });

  it('rejects placing on an occupied cell', () => {
    const grid = makeGrid([[5, 30]]);
    expect(isValidPlacement(grid, 5, 31)).toBe(false);
  });

  it('rejects value <= nearest left neighbor', () => {
    const grid = makeGrid([[3, 20]]);
    expect(isValidPlacement(grid, 5, 20)).toBe(false);
    expect(isValidPlacement(grid, 5, 19)).toBe(false);
  });

  it('rejects value >= nearest right neighbor', () => {
    const grid = makeGrid([[10, 50]]);
    expect(isValidPlacement(grid, 7, 50)).toBe(false);
    expect(isValidPlacement(grid, 7, 51)).toBe(false);
  });

  it('accepts a value strictly between left and right neighbors', () => {
    const grid = makeGrid([[3, 20], [8, 30]]);
    expect(isValidPlacement(grid, 5, 25)).toBe(true);
  });
});

// ── calculateDiscardCost ──────────────────────────────────────────────────────

describe('calculateDiscardCost', () => {
  it('returns 0 with no adjacent neighbours', () => {
    const grid = emptyGrid();
    expect(calculateDiscardCost(grid, 5, 40)).toBe(0);
  });

  it('returns 0 when adjacent cells are empty', () => {
    const grid = makeGrid([[3, 20], [10, 50]]); // not directly adjacent to pos 5
    expect(calculateDiscardCost(grid, 5, 40)).toBe(0);
  });

  it('calculates cost from left-only adjacent neighbour', () => {
    const grid = makeGrid([[4, 10]]); // pos 4 has value 10
    expect(calculateDiscardCost(grid, 5, 13)).toBe(3); // 13 - 10 = 3
  });

  it('calculates cost from right-only adjacent neighbour', () => {
    const grid = makeGrid([[6, 20]]); // pos 6 has value 20
    expect(calculateDiscardCost(grid, 5, 14)).toBe(6); // 20 - 14 = 6
  });

  it('takes minimum when between two adjacent neighbours', () => {
    const grid = makeGrid([[4, 10], [6, 20]]); // left=10, right=20
    // placing 14 at pos 5: min(14-10, 20-14) = min(4, 6) = 4
    expect(calculateDiscardCost(grid, 5, 14)).toBe(4);
    // placing 18 at pos 5: min(18-10, 20-18) = min(8, 2) = 2
    expect(calculateDiscardCost(grid, 5, 18)).toBe(2);
  });

  it('example from rulebook: 5 next to 3 costs 2', () => {
    const grid = makeGrid([[3, 3]]); // pos 3 has value 3
    expect(calculateDiscardCost(grid, 4, 5)).toBe(2);
  });
});

// ── initializeGame ────────────────────────────────────────────────────────────

describe('initializeGame', () => {
  const state = initializeGame('R1', { id: 'p0', name: 'Alice' }, { id: 'p1', name: 'Bob' });

  it('starts in playing phase', () => {
    expect(state.phase).toBe('playing');
  });

  it('deals 5 cards to each player', () => {
    expect(state.players[0].hand).toHaveLength(5);
    expect(state.players[1].hand).toHaveLength(5);
  });

  it('each player deck + hand totals 44 or 43 cards (including 1 start card)', () => {
    const t0 = state.players[0].hand.length + state.players[0].deck.length;
    const t1 = state.players[1].hand.length + state.players[1].deck.length;
    // total island+finish = 85, split 43+42; each adds 1 start → 44+43
    expect([43, 44]).toContain(t0);
    expect([43, 44]).toContain(t1);
    expect(t0 + t1).toBe(87);
  });

  it('each player has exactly one start card in combined hand+deck', () => {
    const startCount = (p: typeof state.players[0]) =>
      [...p.hand, ...p.deck].filter(c => c.type === 'start').length;
    expect(startCount(state.players[0])).toBe(1);
    expect(startCount(state.players[1])).toBe(1);
  });

  it('grid is empty', () => {
    expect(state.grid.every(c => c.card === null)).toBe(true);
  });

  it('Start card is never in the initial hand (shuffled into deck after draw)', () => {
    // Run several times to rule out luck
    for (let i = 0; i < 20; i++) {
      const s = initializeGame('R', { id: 'p0', name: 'A' }, { id: 'p1', name: 'B' });
      expect(s.players[0].hand.some(c => c.type === 'start')).toBe(false);
      expect(s.players[1].hand.some(c => c.type === 'start')).toBe(false);
    }
  });
});

// ── Forced Start ──────────────────────────────────────────────────────────────

describe('forced Start card rule', () => {
  it('only the Start move is legal when player holds Start card', () => {
    const startCard: Card = { id: 'start_1', type: 'start', value: null };
    const island: Card = { id: 'island_40', type: 'island', value: 40 };
    const state = makeState({
      startCardPlayed: false,
      players: [
        { id: 'p0', name: 'Alice', hand: [startCard, island], deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [], deck: [], discardCount: 0 },
      ],
    });
    const moves = computeLegalMoves(state, 0);
    expect(moves).toHaveLength(1);
    expect(moves[0].cardId).toBe('start_1');
    expect(moves[0].position).toBe(-1);
  });

  it('island plays become legal after Start is played', () => {
    const island: Card = { id: 'island_40', type: 'island', value: 40 };
    const state = makeState({
      startCardPlayed: true, // start already played
      players: [
        { id: 'p0', name: 'Alice', hand: [island], deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [], deck: [], discardCount: 0 },
      ],
    });
    const moves = computeLegalMoves(state, 0);
    expect(moves.length).toBe(36); // all positions valid for island_40
  });
});

// ── applyPlayCard ─────────────────────────────────────────────────────────────

describe('applyPlayCard — island card', () => {
  it('places a card on the grid with 0 cost', () => {
    const card: Card = { id: 'island_40', type: 'island', value: 40 };
    const state = makeState({
      players: [
        { id: 'p0', name: 'Alice', hand: [card], deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [],     deck: [], discardCount: 0 },
      ],
    });
    const result = applyPlayCard(state, 0, 'island_40', 10, []);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.grid[10].card?.id).toBe('island_40');
    }
  });

  it('rejects if cost cannot be covered', () => {
    // pos 4 has value 10; placing value 20 at pos 5 costs 10, but hand has only 1 card
    const grid = makeGrid([[4, 10]]);
    const card: Card = { id: 'island_20', type: 'island', value: 20 };
    const state = makeState({
      grid,
      players: [
        { id: 'p0', name: 'Alice', hand: [card], deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [],     deck: [], discardCount: 0 },
      ],
    });
    const result = applyPlayCard(state, 0, 'island_20', 5, []);
    expect(result.ok).toBe(false);
  });

  it('requires correct number of discard cards', () => {
    const grid = makeGrid([[4, 10]]);
    const card: Card = { id: 'island_12', type: 'island', value: 12 };
    const extra: Card = { id: 'island_50', type: 'island', value: 50 };
    const extra2: Card = { id: 'island_51', type: 'island', value: 51 };
    const state = makeState({
      grid,
      players: [
        { id: 'p0', name: 'Alice', hand: [card, extra, extra2], deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [],                   deck: [], discardCount: 0 },
      ],
    });
    // cost = 12 - 10 = 2, must supply exactly 2 cards to discard
    const result = applyPlayCard(state, 0, 'island_12', 5, ['island_50', 'island_51']);
    expect(result.ok).toBe(true);
  });
});

// ── applyDiscardTwo ───────────────────────────────────────────────────────────

describe('applyDiscardTwo', () => {
  it('removes 2 cards from hand and advances turn', () => {
    const cards: Card[] = [
      { id: 'island_1', type: 'island', value: 1 },
      { id: 'island_2', type: 'island', value: 2 },
      { id: 'island_3', type: 'island', value: 3 },
    ];
    const state = makeState({
      players: [
        { id: 'p0', name: 'Alice', hand: cards, deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [{ id: 'island_50', type: 'island', value: 50 }], deck: [], discardCount: 0 },
      ],
    });
    const result = applyDiscardTwo(state, 0, ['island_1', 'island_2']);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.players[0].hand).toHaveLength(1);
      expect(result.state.players[0].discardCount).toBe(2);
      expect(result.state.currentPlayerIndex).toBe(1);
    }
  });

  it('rejects when fewer than 2 cards in hand', () => {
    const state = makeState({
      players: [
        { id: 'p0', name: 'Alice', hand: [{ id: 'island_5', type: 'island', value: 5 }], deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [], deck: [], discardCount: 0 },
      ],
    });
    const result = applyDiscardTwo(state, 0, ['island_5', 'island_5']);
    expect(result.ok).toBe(false);
  });
});

// ── buildClientState ──────────────────────────────────────────────────────────

describe('buildClientState — data isolation', () => {
  const state = initializeGame('R1', { id: 'p0', name: 'Alice' }, { id: 'p1', name: 'Bob' });

  it("player 0's view contains their own hand", () => {
    const view = buildClientState(state, 0);
    expect(view.myHand).toHaveLength(state.players[0].hand.length);
    expect(view.myHand.map(c => c.id)).toEqual(state.players[0].hand.map(c => c.id));
  });

  it("player 0's view does NOT expose player 1's hand", () => {
    const view = buildClientState(state, 0);
    const p1HandIds = new Set(state.players[1].hand.map(c => c.id));
    const viewHandIds = new Set(view.myHand.map(c => c.id));
    for (const id of viewHandIds) {
      expect(p1HandIds.has(id)).toBe(false);
    }
  });

  it("players array shows hand sizes but not card details for opponent", () => {
    const view = buildClientState(state, 0);
    // views[1] is opponent — no hand array, only handSize
    expect(view.players[1].handSize).toBe(state.players[1].hand.length);
    // No `hand` property on ClientPlayerView
    expect('hand' in view.players[1]).toBe(false);
  });

  it("player 1's view contains their own hand", () => {
    const view = buildClientState(state, 1);
    expect(view.myHand.map(c => c.id)).toEqual(state.players[1].hand.map(c => c.id));
    expect(view.myPlayerIndex).toBe(1);
  });

  it('grid is included in full', () => {
    const view = buildClientState(state, 0);
    expect(view.grid).toHaveLength(36);
  });
});

// ── Win condition ─────────────────────────────────────────────────────────────

describe('win condition', () => {
  it('applying a finish card on a complete grid transitions to won', () => {
    // Fill all 36 cells with island cards
    const grid = Array.from({ length: 36 }, (_, i) => ({
      position: i,
      card: { id: `island_${i + 1}`, type: 'island' as const, value: i + 1 },
    }));
    const finishCard: Card = { id: 'finish_1', type: 'finish', value: null };
    const filler: Card = { id: 'island_80', type: 'island', value: 80 };

    const state = makeState({
      grid,
      startCardPlayed: true,
      players: [
        { id: 'p0', name: 'Alice', hand: [finishCard, filler], deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [],                  deck: [], discardCount: 0 },
      ],
    });

    const result = applyPlayCard(state, 0, 'finish_1', -1, []);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.phase).toBe('won');
      expect(result.state.winner).toBe('players');
    }
  });
});

// ── computeLegalMoves ─────────────────────────────────────────────────────────

describe('computeLegalMoves', () => {
  it('returns empty array when not current player', () => {
    const card: Card = { id: 'island_40', type: 'island', value: 40 };
    const state = makeState({
      players: [
        { id: 'p0', name: 'Alice', hand: [card], deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [],     deck: [], discardCount: 0 },
      ],
      currentPlayerIndex: 1,
    });
    expect(computeLegalMoves(state, 0)).toHaveLength(0);
  });

  it('includes all 36 positions for a single island card on empty grid (0 cost)', () => {
    const card: Card = { id: 'island_40', type: 'island', value: 40 };
    const state = makeState({
      players: [
        { id: 'p0', name: 'Alice', hand: [card], deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [],     deck: [], discardCount: 0 },
      ],
    });
    const moves = computeLegalMoves(state, 0);
    expect(moves.length).toBe(36);
    expect(moves.every(m => m.discardCost === 0)).toBe(true);
  });
});

// ── Sea Monsters ──────────────────────────────────────────────────────────────

describe('Sea Monsters — initializeGame with monsters', () => {
  it('distributes 3 monster cards across both players combined', () => {
    const state = initializeGame('R1', { id: 'p0', name: 'Alice' }, { id: 'p1', name: 'Bob' }, 3);
    const allCards = [
      ...state.players[0].hand, ...state.players[0].deck,
      ...state.players[1].hand, ...state.players[1].deck,
    ];
    expect(allCards.filter(c => c.type === 'monster')).toHaveLength(3);
    expect(state.monsterCount).toBe(3);
  });

  it('distributes 5 monster cards with difficulty 5', () => {
    const state = initializeGame('R1', { id: 'p0', name: 'Alice' }, { id: 'p1', name: 'Bob' }, 5);
    const allCards = [
      ...state.players[0].hand, ...state.players[0].deck,
      ...state.players[1].hand, ...state.players[1].deck,
    ];
    expect(allCards.filter(c => c.type === 'monster')).toHaveLength(5);
  });
});

describe('Sea Monsters — playing a monster card', () => {
  it('removes the monster from hand and the target card from the grid', () => {
    const monster: Card = { id: 'monster_1', type: 'monster', value: null };
    const target: Card = { id: 'island_30', type: 'island', value: 30 };
    const grid = makeGrid([[10, 30]]);
    grid[10].card = target;

    const state = makeState({
      grid,
      players: [
        { id: 'p0', name: 'Alice', hand: [monster], deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [{ id: 'island_50', type: 'island', value: 50 }], deck: [], discardCount: 0 },
      ],
    });

    const result = applyPlayCard(state, 0, 'monster_1', 10, []);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.grid[10].card).toBeNull();
      expect(result.state.players[0].hand.find(c => c.id === 'monster_1')).toBeUndefined();
    }
  });

  it('rejects targeting an empty cell', () => {
    const monster: Card = { id: 'monster_1', type: 'monster', value: null };
    const state = makeState({
      players: [
        { id: 'p0', name: 'Alice', hand: [monster], deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [], deck: [], discardCount: 0 },
      ],
    });
    const result = applyPlayCard(state, 0, 'monster_1', 5, []);
    expect(result.ok).toBe(false);
  });

  it('cannot be discarded via discard-two', () => {
    const monster: Card = { id: 'monster_1', type: 'monster', value: null };
    const island: Card = { id: 'island_5', type: 'island', value: 5 };
    const state = makeState({
      players: [
        { id: 'p0', name: 'Alice', hand: [monster, island], deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [], deck: [], discardCount: 0 },
      ],
    });
    const result = applyDiscardTwo(state, 0, ['monster_1', 'island_5']);
    expect(result.ok).toBe(false);
  });

  it('cannot be used as discard cost for island placement', () => {
    const monster: Card = { id: 'monster_1', type: 'monster', value: null };
    const island: Card = { id: 'island_12', type: 'island', value: 12 };
    const grid = makeGrid([[4, 10]]); // cost = 2 for placing 12 at pos 5
    const state = makeState({
      grid,
      players: [
        { id: 'p0', name: 'Alice', hand: [island, monster, { id: 'island_99', type: 'island', value: 99 }], deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [], deck: [], discardCount: 0 },
      ],
    });
    const result = applyPlayCard(state, 0, 'island_12', 5, ['monster_1', 'island_99']);
    expect(result.ok).toBe(false);
  });
});

describe('Sea Monsters — finish_pending phase', () => {
  function makeFullGrid(): GridCell[] {
    return Array.from({ length: 36 }, (_, i) => ({
      position: i,
      card: { id: `island_${i + 1}`, type: 'island' as const, value: i + 1 },
    }));
  }

  it('enters finish_pending when Finish played but monsters remain in hand', () => {
    const monster: Card = { id: 'monster_1', type: 'monster', value: null };
    const finish: Card = { id: 'finish_1', type: 'finish', value: null };
    const state = makeState({
      grid: makeFullGrid(),
      players: [
        { id: 'p0', name: 'Alice', hand: [finish], deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [monster], deck: [], discardCount: 0 },
      ],
    });
    const result = applyPlayCard(state, 0, 'finish_1', -1, []);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.phase).toBe('finish_pending');
    }
  });

  it('transitions to won when last monster is played in finish_pending', () => {
    const monster: Card = { id: 'monster_1', type: 'monster', value: null };
    const target: Card = { id: 'island_10', type: 'island', value: 10 };
    const grid = makeFullGrid();
    grid[10].card = target;

    const state = makeState({
      phase: 'finish_pending',
      grid,
      players: [
        { id: 'p0', name: 'Alice', hand: [], deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [monster], deck: [], discardCount: 0 },
      ],
      currentPlayerIndex: 1,
    });
    const result = applyPlayCard(state, 1, 'monster_1', 10, []);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.phase).toBe('won');
      expect(result.state.winner).toBe('players');
    }
  });

  it('legal moves in finish_pending only include monster plays on filled cells', () => {
    const monster: Card = { id: 'monster_1', type: 'monster', value: null };
    const island: Card = { id: 'island_5', type: 'island', value: 5 };
    const grid = makeFullGrid();

    const state = makeState({
      phase: 'finish_pending',
      grid,
      players: [
        { id: 'p0', name: 'Alice', hand: [monster, island], deck: [], discardCount: 0 },
        { id: 'p1', name: 'Bob',   hand: [], deck: [], discardCount: 0 },
      ],
    });
    const moves = computeLegalMoves(state, 0);
    // All 36 filled cells are valid targets, only for the monster
    expect(moves.length).toBe(36);
    expect(moves.every(m => m.cardId === 'monster_1')).toBe(true);
    expect(moves.every(m => m.discardCost === 0)).toBe(true);
  });
});
