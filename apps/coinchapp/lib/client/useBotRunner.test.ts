import { describe, expect, it } from "vitest";
import { isActiveTurn, toPresidentMove } from "./useBotRunner";
import type { PresidentBotAction } from "@/lib/president";

// Regression coverage for a bug where online Président games with bot seats
// stalled forever on their first turn: `isActiveTurn` never recognized the
// "exchange" phase (so bots never even got redealt into the loop for it), and
// the decide/submit path fell through to Coinche's bot brain on a Président
// view for the "playing" phase, whose resulting move never matched a valid
// Président action - so `submitBotMove` kept failing and retrying forever.
describe("isActiveTurn", () => {
  it("treats Président's exchange phase as an active bot turn", () => {
    expect(isActiveTurn("president", "exchange")).toBe(true);
  });

  it("treats Président's playing phase as an active bot turn", () => {
    expect(isActiveTurn("president", "playing")).toBe(true);
  });

  it("does not treat Président's scoring/lobby/finished phases as active", () => {
    expect(isActiveTurn("president", "scoring")).toBe(false);
    expect(isActiveTurn("president", "lobby")).toBe(false);
    expect(isActiveTurn("president", "finished")).toBe(false);
  });
});

describe("toPresidentMove", () => {
  it("maps PASS to a bare pass move", () => {
    const action: PresidentBotAction = { action: "PASS" };
    expect(toPresidentMove(action)).toEqual({ kind: "pass" });
  });

  it("maps COMBO to a combo move carrying the chosen combo", () => {
    const combo = { rank: "K" as const, cards: [{ rank: "K" as const, suit: "S" as const }] };
    const action: PresidentBotAction = { action: "COMBO", combo };
    expect(toPresidentMove(action)).toEqual({ kind: "combo", combo });
  });

  it("maps EXCHANGE_RETURN to an exchangeReturn move carrying the chosen cards", () => {
    const cards = [{ rank: "3" as const, suit: "H" as const }];
    const action: PresidentBotAction = { action: "EXCHANGE_RETURN", cards };
    expect(toPresidentMove(action)).toEqual({ kind: "exchangeReturn", cards });
  });
});
