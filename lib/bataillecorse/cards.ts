import { buildDeck as buildDeckGeneric, cardId as cardIdGeneric, sameCard as sameCardGeneric } from "@/lib/cards";
import type { Card, Rank } from "./types";

export { shuffle } from "@/lib/cards";

/** Display/deal order only - no rank ever "outranks" another in this game
 *  (winning is purely about tributes/slaps, not card strength). */
export const RANK_ORDER: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

/** Tribute attempts per challenge rank (see docs/DECISIONS.md - "classic" ruleset). */
const TRIBUTE_ATTEMPTS: Partial<Record<Rank, number>> = { J: 1, Q: 2, K: 3, A: 4 };

export function buildDeck(): Card[] {
  return buildDeckGeneric(RANK_ORDER);
}

export function cardId(card: Card): string {
  return cardIdGeneric(card);
}

export function sameCard(a: Card, b: Card): boolean {
  return sameCardGeneric(a, b);
}

/** Whether `rank` opens/continues a tribute (Jack/Queen/King/Ace). */
export function isChallengeRank(rank: Rank): boolean {
  return rank in TRIBUTE_ATTEMPTS;
}

/** Attempts allowed to answer a tribute opened by `rank` (0 for a non-challenge rank). */
export function attemptsFor(rank: Rank): number {
  return TRIBUTE_ATTEMPTS[rank] ?? 0;
}
