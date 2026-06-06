import { Card, GameState, GridCell, LegalMove } from './types';
import { computeLegalMoves, canDiscardTwo } from './gameEngine';
import { gridRisk, gridWithCard, gridWithoutCard, INFEASIBLE_UNIT } from './gridFeasibility';

// Co-operative bot for the second player. It only ever reads its own hand and
// the public grid (never the opponent's hand or any draw pile) and plays toward
// the shared goal: fill the grid, play Start + Finish, keep the grid fillable,
// and waste as few cards as possible.

export type BotAction =
  | { type: 'play'; cardId: string; position: number; discardCardIds: string[] }
  | { type: 'discard_two'; cardIds: [string, string] }
  | { type: 'contribute'; cardIds: string[] };

const GRID_SIZE = 36;
const MAX_ISLAND = 80;
// Discard cost above which the bot prefers to discard-two instead of paying.
const MAX_AFFORDABLE_COST = 3;
// One wasted card is worth this much in placement scoring — below an infeasible
// segment (1e6) but above leaving a single tight gap, so the bot avoids dead
// ends first, then conserves cards, then keeps the grid roomy.
const COST_WEIGHT = 10_000;

function cardMap(hand: Card[]): Map<string, Card> {
  return new Map(hand.map(c => [c.id, c]));
}

// Where a value "wants" to sit so the grid stays evenly spread.
function idealValueForPosition(pos: number): number {
  return ((pos + 0.5) / GRID_SIZE) * MAX_ISLAND;
}

interface ScoredMove { move: LegalMove; feasible: boolean; cost: number; score: number; }

function scoreIslandMove(grid: GridCell[], move: LegalMove, card: Card): ScoredMove {
  const report = gridRisk(gridWithCard(grid, move.position, card));
  const fit = Math.abs((card.value ?? 0) - idealValueForPosition(move.position));
  const score = move.discardCost * COST_WEIGHT + report.risk + fit * 0.01;
  return { move, feasible: report.feasible, cost: move.discardCost, score };
}

function pickBestIslandMove(grid: GridCell[], moves: LegalMove[], cards: Map<string, Card>): ScoredMove | null {
  let best: ScoredMove | null = null;
  for (const move of moves) {
    const card = cards.get(move.cardId);
    if (!card || card.type !== 'island') continue;
    const scored = scoreIslandMove(grid, move, card);
    if (!best || scored.score < best.score) best = scored;
  }
  return best;
}

// If the grid currently has an unfillable segment, use a Sea Monster to destroy
// the placed card whose removal best restores fillability ("fix your mistakes").
function chooseMonsterFix(state: GameState, idx: 0 | 1): { cardId: string; position: number } | null {
  const monster = state.players[idx].hand.find(c => c.type === 'monster');
  if (!monster) return null;
  const current = gridRisk(state.grid);
  if (current.feasible) return null;

  let bestPos = -1;
  let bestRisk = current.risk;
  for (const cell of state.grid) {
    if (cell.card?.type !== 'island') continue;
    const risk = gridRisk(gridWithoutCard(state.grid, cell.position)).risk;
    if (risk < bestRisk) { bestRisk = risk; bestPos = cell.position; }
  }
  return bestPos >= 0 ? { cardId: monster.id, position: bestPos } : null;
}

// Ordered list of discardable card ids (Sea Monsters are never discardable).
// Priority: dead Start cards first, then the most "redundant" islands (smallest
// value gap to a neighbour), and Finish cards last so we keep a way to win.
function discardCandidates(hand: Card[]): string[] {
  const starts = hand.filter(c => c.type === 'start').map(c => c.id);
  const finishes = hand.filter(c => c.type === 'finish').map(c => c.id);
  const islands = hand.filter(c => c.type === 'island').sort((a, b) => a.value! - b.value!);
  const scored = islands.map((c, i) => {
    const prevGap = i > 0 ? c.value! - islands[i - 1].value! : Infinity;
    const nextGap = i < islands.length - 1 ? islands[i + 1].value! - c.value! : Infinity;
    return { id: c.id, gap: Math.min(prevGap, nextGap) };
  });
  scored.sort((a, b) => a.gap - b.gap);
  return [...starts, ...scored.map(s => s.id), ...finishes];
}

function chooseDiscards(hand: Card[], count: number, excludeId?: string): string[] {
  if (count <= 0) return [];
  const pool = excludeId ? hand.filter(c => c.id !== excludeId) : hand;
  return discardCandidates(pool).slice(0, count);
}

function discardTwoAction(hand: Card[]): BotAction | null {
  const ids = chooseDiscards(hand, 2);
  return ids.length < 2 ? null : { type: 'discard_two', cardIds: [ids[0], ids[1]] };
}

function contributeAction(state: GameState, idx: 0 | 1): BotAction {
  const sds = state.startDiscardState!;
  const hand = state.players[idx].hand;
  const available = hand.filter(c => c.type !== 'monster').length;
  // Must contribute at least enough to bring own hand to ≤ 5 (engine enforces this).
  const minRequired = Math.min(Math.max(0, hand.length - 5), sds.remaining);
  const fairShare = Math.max(1, Math.ceil(sds.remaining / 2));
  const target = Math.min(sds.remaining, available, Math.max(fairShare, minRequired));
  return { type: 'contribute', cardIds: chooseDiscards(hand, target) };
}

function play(cardId: string, position: number, discardCardIds: string[] = []): BotAction {
  return { type: 'play', cardId, position, discardCardIds };
}

export function chooseBotAction(state: GameState, idx: 0 | 1): BotAction | null {
  if (state.phase === 'start_discard') {
    if (state.startDiscardState?.currentContributor !== idx) return null;
    return contributeAction(state, idx);
  }
  if (state.phase !== 'playing' && state.phase !== 'finish_pending') return null;
  if (state.currentPlayerIndex !== idx) return null;

  const hand = state.players[idx].hand;
  const cards = cardMap(hand);
  const moves = computeLegalMoves(state, idx);
  if (moves.length === 0) return canDiscardTwo(state, idx) ? discardTwoAction(hand) : null;

  // Forced Start card, then Finish (wins / triggers finish_pending).
  const startMove = moves.find(m => cards.get(m.cardId)?.type === 'start');
  if (startMove) return play(startMove.cardId, startMove.position);
  const finishMove = moves.find(m => cards.get(m.cardId)?.type === 'finish');
  if (finishMove) {
    // Defer to the human player if they also hold a finish card — let them
    // experience the winning moment rather than the bot ending the game silently.
    const humanIdx: 0 | 1 = idx === 0 ? 1 : 0;
    const humanHasFinish = state.players[humanIdx].hand.some(c => c.type === 'finish');
    if (humanHasFinish) {
      // Discard two non-finish, non-monster cards so the finish card is preserved.
      const deferPool = hand.filter(c => c.type !== 'monster' && c.type !== 'finish');
      if (deferPool.length >= 2) {
        const ids = discardCandidates(deferPool);
        return { type: 'discard_two', cardIds: [ids[0], ids[1]] };
      }
    }
    return play(finishMove.cardId, -1);
  }

  // finish_pending: only Sea Monster plays are legal — dump one to progress.
  if (state.phase === 'finish_pending') return play(moves[0].cardId, moves[0].position);

  // Repair an already-broken grid with a Sea Monster before anything else.
  const fix = chooseMonsterFix(state, idx);
  if (fix) return play(fix.cardId, fix.position);

  const best = pickBestIslandMove(state.grid, moves, cards);
  const canTwo = canDiscardTwo(state, idx);

  if (best) {
    const createsDeadEnd = !best.feasible;
    const tooExpensive = best.cost > MAX_AFFORDABLE_COST;
    if ((createsDeadEnd || tooExpensive) && canTwo) {
      return discardTwoAction(hand) ?? play(best.move.cardId, best.move.position, chooseDiscards(hand, best.cost, best.move.cardId));
    }
    return play(best.move.cardId, best.move.position, chooseDiscards(hand, best.cost, best.move.cardId));
  }

  // No island move available: cycle the hand, else play a forced Sea Monster.
  if (canTwo) return discardTwoAction(hand) ?? play(moves[0].cardId, moves[0].position);
  return play(moves[0].cardId, moves[0].position);
}
