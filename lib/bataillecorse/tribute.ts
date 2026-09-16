import { attemptsFor, isChallengeRank } from "./cards";
import type { Card, Seat, Tribute } from "./types";

export function otherSeat(seat: Seat): Seat {
  return seat === 0 ? 1 : 0;
}

export interface TributeOutcome {
  tribute: Tribute | null;
  /** Whose turn it is to flip next. */
  turn: Seat;
  /** Set when this exact card just made the payer fail their tribute: the
   *  challenger (never `seat`) wins the whole pile. */
  challengeFailedWinner: Seat | null;
}

/** Pure decision for how `card`, just flipped by `seat`, affects the tribute
 *  state - the caller (`engine.ts`) does the actual pile/stock mutation.
 *  `tribute` is `null` for a plain flip, or the tribute `seat` currently owes
 *  (always `tribute.seat === seat`, enforced by the caller before this runs). */
export function resolveTributeEffect(card: Card, seat: Seat, tribute: Tribute | null): TributeOutcome {
  const other = otherSeat(seat);

  if (isChallengeRank(card.rank)) {
    // A figure/ace always opens a fresh tribute for the other seat, whether
    // this was a plain flip or a successful answer to a tribute already owed.
    return { tribute: { seat: other, attemptsLeft: attemptsFor(card.rank), fromRank: card.rank }, turn: other, challengeFailedWinner: null };
  }

  if (tribute === null) {
    return { tribute: null, turn: other, challengeFailedWinner: null };
  }

  const attemptsLeft = tribute.attemptsLeft - 1;
  if (attemptsLeft <= 0) {
    return { tribute: null, turn: other, challengeFailedWinner: other };
  }
  return { tribute: { ...tribute, attemptsLeft }, turn: seat, challengeFailedWinner: null };
}
