import { Card, GameState, LegalMove } from './types';
import { computeLegalMoves, canDiscardTwo } from './gameEngine';

// Co-operative bot for the second player. It never "competes" — it just tries
// to advance the shared goal (fill the grid, play Start + Finish) while wasting
// as few cards as possible.

export type BotAction =
  | { type: 'play'; cardId: string; position: number; discardCardIds: string[] }
  | { type: 'discard_two'; cardIds: [string, string] }
  | { type: 'contribute'; cardIds: string[] };

const GRID_SIZE = 36;
const MAX_ISLAND = 80;
// Discard cost above which the bot prefers to discard-two instead of paying.
const MAX_AFFORDABLE_COST = 3;
// Discard cost dominates placement choice; ideal-fit only breaks ties.
const COST_WEIGHT = 1000;

function cardMap(hand: Card[]): Map<string, Card> {
  return new Map(hand.map(c => [c.id, c]));
}

// Where a value "wants" to sit so the grid stays evenly spread and avoids
// painting later cards into impossible gaps.
function idealValueForPosition(pos: number): number {
  return ((pos + 0.5) / GRID_SIZE) * MAX_ISLAND;
}

// Lower is better: discard cost dominates, ideal-fit breaks ties.
function scoreIslandMove(move: LegalMove, card: Card): number {
  const fit = Math.abs((card.value ?? 0) - idealValueForPosition(move.position));
  return move.discardCost * COST_WEIGHT + fit;
}

function pickBestIslandMove(moves: LegalMove[], cards: Map<string, Card>): { move: LegalMove; card: Card } | null {
  let best: { move: LegalMove; card: Card } | null = null;
  let bestScore = Infinity;
  for (const move of moves) {
    const card = cards.get(move.cardId);
    if (!card || card.type !== 'island') continue;
    const score = scoreIslandMove(move, card);
    if (score < bestScore) { bestScore = score; best = { move, card }; }
  }
  return best;
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
  if (ids.length < 2) return null;
  return { type: 'discard_two', cardIds: [ids[0], ids[1]] };
}

function contributeAction(state: GameState, idx: 0 | 1): BotAction {
  const sds = state.startDiscardState!;
  const hand = state.players[idx].hand;
  const available = hand.filter(c => c.type !== 'monster').length;
  const fairShare = Math.max(1, Math.ceil(sds.remaining / 2));
  const target = Math.min(sds.remaining, available, fairShare);
  return { type: 'contribute', cardIds: chooseDiscards(hand, target) };
}

function playAction(move: LegalMove, discardCardIds: string[]): BotAction {
  return { type: 'play', cardId: move.cardId, position: move.position, discardCardIds };
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
  if (moves.length === 0) {
    return canDiscardTwo(state, idx) ? discardTwoAction(hand) : null;
  }

  // Forced Start card.
  const startMove = moves.find(m => cards.get(m.cardId)?.type === 'start');
  if (startMove) return playAction(startMove, []);

  // Finish card → completes the game.
  const finishMove = moves.find(m => cards.get(m.cardId)?.type === 'finish');
  if (finishMove) return playAction(finishMove, []);

  // finish_pending: only Sea Monster plays are legal — dump one to progress.
  if (state.phase === 'finish_pending') return playAction(moves[0], []);

  // Prefer the cheapest, best-fitting island placement.
  const best = pickBestIslandMove(moves, cards);
  if (best) {
    const cost = best.move.discardCost;
    if (cost > MAX_AFFORDABLE_COST && canDiscardTwo(state, idx)) {
      return discardTwoAction(hand) ?? playAction(best.move, chooseDiscards(hand, cost, best.move.cardId));
    }
    return playAction(best.move, chooseDiscards(hand, cost, best.move.cardId));
  }

  // No island move: avoid wasting a monster when we can just discard.
  if (canDiscardTwo(state, idx)) return discardTwoAction(hand) ?? playAction(moves[0], []);
  return playAction(moves[0], []);
}
