import { describe, expect, it } from "vitest";
import { deal } from "./deal";
import { seededRng } from "./test-utils";

describe("deal", () => {
  it("splits the 52-card deck evenly with no overlap", () => {
    const [a, b] = deal(seededRng(1));
    expect(a).toHaveLength(26);
    expect(b).toHaveLength(26);
    const ids = new Set([...a, ...b].map((c) => `${c.rank}${c.suit}`));
    expect(ids.size).toBe(52);
  });

  it("is deterministic for a given seed", () => {
    const [a1] = deal(seededRng(42));
    const [a2] = deal(seededRng(42));
    expect(a1).toEqual(a2);
  });
});
