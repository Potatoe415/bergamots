import type { PlayerView } from "./redact";

/** The bot always flips the instant it's able to - the top card is random and
 *  hidden, so there is no strategic choice to make, only pacing (see
 *  GameSettings.botThinkMs, applied by the caller as a delay before this). */
export function shouldBotFlip(view: PlayerView, botSeat: 0 | 1): boolean {
  return view.phase === "playing" && view.slapWindow === null && view.turn === botSeat;
}

/** Simulated local reaction time for a bot's slap attempt, in ms. Scales with
 *  `botThinkMs` (GameSettings, shared with every other game's bot pacing) so
 *  the same slider also tunes reflex difficulty: a higher `botThinkMs` makes
 *  the bot a slower (easier) opponent to out-slap. */
export function simulateBotReactionMs(botThinkMs: number): number {
  const max = Math.max(250, Math.min(botThinkMs, 2500));
  return 150 + Math.random() * (max - 150);
}
