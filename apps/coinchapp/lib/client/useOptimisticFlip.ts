"use client";

import { useState } from "react";
import type { PlayerView } from "@/lib/bataillecorse";

export interface UseOptimisticFlipResult {
  /** Whether it's currently this seat's turn to flip and no slap window is open. */
  myTurnToFlip: boolean;
  /** True from the instant the local player taps their stock until the
   *  server's view confirms the flip landed - drives the instant local
   *  feedback below (see docs/DECISIONS.md "instant local simulation"
   *  convention, `AGENTS.md` Code Discipline). */
  pendingFlip: boolean;
  /** `view.myStockCount`, minus one while `pendingFlip` is true, so the
   *  player's own pile visibly shrinks the instant they tap instead of
   *  waiting out the network round trip. */
  optimisticStockCount: number;
  /** Tap the stock: reflects the flip instantly in the UI, then awaits the
   *  real submit. Safe to call unconditionally - no-ops if it isn't this
   *  seat's turn or another flip is already in flight. */
  flip: () => Promise<void>;
}

/**
 * La Bataille Corse's equivalent of `useOptimisticPlay`: gives the acting
 * player's own flip the same "feels local" instant feedback that online/
 * ad-hoc play gets everywhere else. Unlike a trick-taking play, though, the
 * flipped card's *value* is hidden even from its own owner (see
 * `redact.ts`), so it can never be predicted client-side - only *that a
 * flip happened* is simulated instantly (own stock shrinks via
 * `optimisticStockCount`); the actual card is only ever shown once the
 * server's real, face-up answer lands in `view.pile` - never a placeholder
 * card-back in the center pile, which would just be a needless delay before
 * showing the real face (see docs/DECISIONS.md).
 */
export function useOptimisticFlip(
  view: PlayerView,
  mySeat: number,
  onFlip: () => Promise<void> | void,
): UseOptimisticFlipResult {
  const [pending, setPending] = useState(false);
  const myTurnToFlip = view.phase === "playing" && view.turn === mySeat && view.slapWindow === null;

  async function flip() {
    if (!myTurnToFlip || pending) return;
    setPending(true);
    try {
      await onFlip();
    } finally {
      setPending(false);
    }
  }

  return {
    myTurnToFlip,
    pendingFlip: pending,
    optimisticStockCount: pending ? Math.max(0, view.myStockCount - 1) : view.myStockCount,
    flip,
  };
}
