import type { Card, FalseSlapEvent, GameState, PileWinEvent, Seat, SlapClaim, SlapWindow, Tribute } from "./types";
import { otherSeat } from "./tribute";

/** Nothing about the center pile or either stock's *count* is hidden - both
 *  players physically see the same shared pile and remaining pile heights.
 *  The only ever-hidden information is each stock's future card order (see
 *  docs/PRODUCT.md), so this only ever exposes a count for it. */
export interface PlayerView {
  phase: GameState["phase"];
  mySeat: Seat;
  turn: Seat;
  myStockCount: number;
  opponentStockCount: number;
  pile: Card[];
  tribute: Tribute | null;
  slapWindow: SlapWindow | null;
  slapClaims: SlapClaim[];
  lastClosedSlapWindowId: number | null;
  winner: Seat | null;
  lastPileWin: PileWinEvent | null;
  lastFalseSlap: FalseSlapEvent | null;
}

export function redact(state: GameState, seat: Seat): PlayerView {
  const opponent = otherSeat(seat);
  return {
    phase: state.phase,
    mySeat: seat,
    turn: state.turn,
    myStockCount: state.stocks[seat].length,
    opponentStockCount: state.stocks[opponent].length,
    pile: state.pile,
    tribute: state.tribute,
    slapWindow: state.slapWindow,
    slapClaims: state.slapClaims,
    lastClosedSlapWindowId: state.lastClosedSlapWindowId,
    winner: state.winner,
    lastPileWin: state.lastPileWin,
    lastFalseSlap: state.lastFalseSlap,
  };
}
