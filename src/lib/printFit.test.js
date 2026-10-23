import { describe, expect, it } from "vitest";
import { fitScale } from "./printFit";

describe("fitScale", () => {
  it("keeps full size when the text already fits", () => {
    expect(fitScale(() => true)).toBe(1);
  });

  it("returns the largest scale that fits", () => {
    expect(fitScale((scale) => scale <= 0.8)).toBe(0.8);
  });

  it("stops at the minimum when nothing fits", () => {
    expect(fitScale(() => false)).toBe(0.6);
  });
});
