"use client";

import { useEffect, useRef } from "react";
import { simulateBotReactionMs, type PlayerView as BataillecorsePlayerView } from "@/lib/bataillecorse";
import { submitBotMove } from "@/lib/server/actions-game";
import type { GameView } from "@/lib/server/view";
import { DEFAULT_BOT_THINK_MS } from "@/lib/supabase/types";

/**
 * Online la Bataille Corse only: when this client is the host, run any bot
 * seat's plain flip (on its turn) and its simulated slap reflex the instant a
 * slap window opens - see docs/TECH.md for the general "host runs bots"
 * model. Unlike `useBotRunner` (every other, turn-by-turn game), a slap is
 * never gated by whose turn it is, so it fires independently of `view.turn`
 * and both moves go through the same `submitBotMove` any other bot move does.
 */
export function useBataillecorseBotRunner(
  gameId: string,
  gv: GameView | null,
  refetch: () => Promise<void>,
  notify: () => void,
): void {
  const botThinkMs = (gv?.settings.botThinkMs as number | undefined) ?? DEFAULT_BOT_THINK_MS;
  const activeFlipTurnRef = useRef<number | null>(null);
  const activeSlapWindowIdRef = useRef<number | null>(null);

  const isActive = Boolean(gv && gv.isHost && gv.gameType === "bataillecorse" && gv.view);
  const view = isActive ? (gv!.view as BataillecorsePlayerView) : null;
  const turn = view?.turn ?? null;
  const phase = view?.phase ?? null;
  const slapWindowId = view?.slapWindow?.id ?? null;
  // Changes on every single flip (even ones that don't change `turn`, e.g.
  // paying down a tribute one attempt at a time) - part of the dependency
  // array below so each of those still gets its own fresh decision instead
  // of being missed because `turn`/`phase`/`slapWindowId` stayed the same.
  const pileLength = view?.pile.length ?? null;
  const botSeatsKey = isActive ? gv!.players.filter((p) => p.isBot).map((p) => p.seat).join(",") : "";

  // Plain flip, whenever it's actually a bot seat's turn and no window is open.
  useEffect(() => {
    if (!isActive || phase !== "playing" || slapWindowId !== null || turn === null) return;
    const botSeats = botSeatsKey ? botSeatsKey.split(",").map(Number) : [];
    if (!botSeats.includes(turn) || activeFlipTurnRef.current === turn) return;
    activeFlipTurnRef.current = turn;
    const timer = setTimeout(async () => {
      try {
        await submitBotMove(gameId, turn as 0 | 1, { kind: "flip" });
        notify();
        await refetch();
      } catch {
        await refetch();
      } finally {
        if (activeFlipTurnRef.current === turn) activeFlipTurnRef.current = null;
      }
    }, botThinkMs);
    return () => clearTimeout(timer);
  }, [isActive, phase, slapWindowId, turn, pileLength, botSeatsKey, botThinkMs, gameId, notify, refetch]);

  // Simulated reflex, once per bot seat, the instant a fresh slap window opens.
  useEffect(() => {
    if (!isActive || slapWindowId === null || activeSlapWindowIdRef.current === slapWindowId) return;
    activeSlapWindowIdRef.current = slapWindowId;
    const botSeats = botSeatsKey ? botSeatsKey.split(",").map(Number) : [];
    const windowId = slapWindowId;
    const timers = botSeats.map((seat) => {
      const reactionMs = simulateBotReactionMs(botThinkMs);
      return setTimeout(async () => {
        try {
          await submitBotMove(gameId, seat as 0 | 1, { kind: "slap", reactionMs, observedWindowId: windowId });
          notify();
          await refetch();
        } catch {
          await refetch();
        }
      }, reactionMs);
    });
    return () => timers.forEach(clearTimeout);
  }, [isActive, slapWindowId, botSeatsKey, botThinkMs, gameId, notify, refetch]);
}
