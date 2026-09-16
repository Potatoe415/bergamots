import { describe, expect, it } from "vitest";
import { attemptsFor, buildDeck, isChallengeRank } from "./cards";

describe("buildDeck", () => {
  it("builds a full 52-card pack with no duplicates", () => {
    const deck = buildDeck();
    expect(deck).toHaveLength(52);
    const ids = new Set(deck.map((c) => `${c.rank}${c.suit}`));
    expect(ids.size).toBe(52);
  });
});

describe("isChallengeRank / attemptsFor", () => {
  it("flags only J/Q/K/A as challenge ranks, with the right attempt counts", () => {
    expect(isChallengeRank("J")).toBe(true);
    expect(attemptsFor("J")).toBe(1);
    expect(isChallengeRank("Q")).toBe(true);
    expect(attemptsFor("Q")).toBe(2);
    expect(isChallengeRank("K")).toBe(true);
    expect(attemptsFor("K")).toBe(3);
    expect(isChallengeRank("A")).toBe(true);
    expect(attemptsFor("A")).toBe(4);
  });

  it("does not flag plain ranks as challenges", () => {
    for (const rank of ["2", "3", "4", "5", "6", "7", "8", "9", "10"] as const) {
      expect(isChallengeRank(rank)).toBe(false);
      expect(attemptsFor(rank)).toBe(0);
    }
  });
});
