import { describe, expect, it } from "vitest";
import { normalizeHex, textColorFor } from "./color";

describe("normalizeHex", () => {
  it("accepts 6-digit hex with or without #", () => {
    expect(normalizeHex("b91c1c")).toBe("#B91C1C");
    expect(normalizeHex(" #1d4ed8 ")).toBe("#1D4ED8");
  });

  it("rejects anything else", () => {
    expect(normalizeHex("#fff")).toBeNull();
    expect(normalizeHex("red")).toBeNull();
    expect(normalizeHex(null)).toBeNull();
  });
});

describe("textColorFor", () => {
  it("uses white on dark colors and black on light ones", () => {
    expect(textColorFor("#B91C1C")).toBe("#FFFFFF");
    expect(textColorFor("#111111")).toBe("#FFFFFF");
    expect(textColorFor("#FACC15")).toBe("#000000");
  });
});
