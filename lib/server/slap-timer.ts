import { resolveStaleSlapWindow, type GameState as BataillecorseGameState } from "@/lib/bataillecorse";
import type { GameRow } from "@/lib/supabase/types";
import { statusFor } from "./game-dispatch";
import { persistGame, type LoadedGame } from "./repo";

/**
 * La Bataille Corse only: auto-resolves a slap window nobody (or only one
 * seat) reacted to within `SLAP_GRACE_MS` - the reflex-game equivalent of
 * every other game's idle-turn timer (`lib/server/idle-timer.ts`), which
 * cannot apply here since a slap is never gated by `state.turn`. Runs
 * opportunistically on every `getView` call, same version-conflict handling
 * as `advanceScoringTimeout`/`advanceStaleTurns`.
 */
export async function advanceStaleSlapWindow(loaded: LoadedGame): Promise<void> {
  const { game } = loaded;
  if (game.game_type !== "bataillecorse" || !game.state) return;
  const state = game.state as BataillecorseGameState;
  if (state.phase !== "playing" || !state.slapWindow) return;

  const next = resolveStaleSlapWindow(state, Date.now());
  if (next === state) return;
  try {
    const status = statusFor(next);
    const version = await persistGame(game as GameRow, next, status);
    game.state = next;
    game.status = status;
    game.version = version;
  } catch {
    // version_conflict: someone else (a claim, or another poll) already resolved it.
  }
}
