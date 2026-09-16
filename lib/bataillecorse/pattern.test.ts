import { describe, expect, it } from "vitest";
import { detectSlapPattern } from "./pattern";
import { card } from "./test-utils";

describe("detectSlapPattern", () => {
  it("returns null on an empty or single-card pile", () => {
    expect(detectSlapPattern([])).toBeNull();
    expect(detectSlapPattern([card("7")])).toBeNull();
  });

  it("detects a double (top 2 cards share a rank)", () => {
    const pile = [card("3"), card("7"), card("7")];
    expect(detectSlapPattern(pile)).toBe("double");
  });

  it("detects a sandwich (top and 2-below share a rank, 1 card between)", () => {
    const pile = [card("5"), card("K"), card("9"), card("K")];
    expect(detectSlapPattern(pile)).toBe("sandwich");
  });

  it("returns null when neither pattern is present", () => {
    const pile = [card("3"), card("5"), card("9"), card("J")];
    expect(detectSlapPattern(pile)).toBeNull();
  });

  it("prefers double over sandwich when both would technically match", () => {
    // top 2 share a rank (double) AND top/3rd-from-top also happen to match.
    const pile = [card("9"), card("9"), card("9")];
    expect(detectSlapPattern(pile)).toBe("double");
  });
});
