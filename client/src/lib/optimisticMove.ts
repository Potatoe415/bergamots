import type { Card, ClientGameState, ClientPlayerView } from '@tranquillity/shared';

/** Local prediction of one of *my own* moves, so the board reacts on click
 *  instead of after the server round-trip. Each predictor returns null when the
 *  outcome depends on hidden information (cards drawn from a deck, the
 *  opponent's hand): in that case the UI keeps waiting for the authoritative
 *  state. Predictions are always overwritten by the server response. */

function withoutCards(hand: Card[], ids: Set<string>): Card[] {
  return hand.filter(c => !ids.has(c.id));
}

function updateMe(
  state: ClientGameState,
  changes: Partial<ClientPlayerView>,
): [ClientPlayerView, ClientPlayerView] {
  return state.players.map((p, i) =>
    i === state.myPlayerIndex ? { ...p, ...changes } : p,
  ) as [ClientPlayerView, ClientPlayerView];
}

/** State right after I end my turn: my hand shrinks, the turn passes to the
 *  opponent, and nothing is playable until the server answers (which also
 *  reveals the cards I drew). */
function endMyTurn(
  state: ClientGameState,
  hand: Card[],
  discarded: number,
  grid = state.grid,
): ClientGameState {
  const opponentIndex: 0 | 1 = state.myPlayerIndex === 0 ? 1 : 0;
  const me = state.players[state.myPlayerIndex];
  const players = updateMe(state, { handSize: hand.length, discardCount: me.discardCount + discarded });
  players[opponentIndex] = { ...players[opponentIndex], isCurrentPlayer: true };
  players[state.myPlayerIndex] = { ...players[state.myPlayerIndex], isCurrentPlayer: false };

  return {
    ...state,
    grid,
    myHand: hand,
    players,
    currentPlayerIndex: opponentIndex,
    legalMoves: [],
    canDiscardTwo: false,
  };
}

export function predictPlayCard(
  state: ClientGameState,
  cardId: string,
  position: number,
  discardCardIds: string[],
): ClientGameState | null {
  // finish_pending is excluded: a monster played then may end the game
  // depending on the opponent's hidden hand.
  if (state.phase !== 'playing') return null;
  if (position < 0) return null; // Start / Finish card: changes phase, draws hidden cards
  const card = state.myHand.find(c => c.id === cardId);
  if (!card || (card.type !== 'island' && card.type !== 'monster')) return null;

  const grid = state.grid.map(cell =>
    cell.position === position ? { ...cell, card: card.type === 'monster' ? null : card } : cell,
  );
  const hand = withoutCards(state.myHand, new Set([cardId, ...discardCardIds]));
  return endMyTurn(state, hand, discardCardIds.length, grid);
}

export function predictDiscardTwo(
  state: ClientGameState,
  cardIds: [string, string],
): ClientGameState | null {
  if (state.phase !== 'playing') return null;
  return endMyTurn(state, withoutCards(state.myHand, new Set(cardIds)), 2);
}

export function predictContributeStartDiscard(
  state: ClientGameState,
  cardIds: string[],
): ClientGameState | null {
  const sds = state.startDiscardState;
  if (state.phase !== 'start_discard' || !sds) return null;
  const remaining = sds.remaining - cardIds.length;
  if (remaining <= 0) return null; // ritual ends: both players draw hidden cards

  const hand = withoutCards(state.myHand, new Set(cardIds));
  const me = state.players[state.myPlayerIndex];
  return {
    ...state,
    myHand: hand,
    players: updateMe(state, { handSize: hand.length, discardCount: me.discardCount + cardIds.length }),
    startDiscardState: {
      ...sds,
      remaining,
      myContribution: sds.myContribution + cardIds.length,
      isMyTurnToContribute: false,
    },
  };
}
