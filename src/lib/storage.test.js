import { afterEach, describe, expect, it, vi } from "vitest";
import { safeGet, safeRemove, safeSet } from "./storage";

afterEach(() => vi.restoreAllMocks());

describe("safe storage", () => {
  it("round-trips values", () => {
    safeSet("k", "v");
    expect(safeGet("k")).toBe("v");
    safeRemove("k");
    expect(safeGet("k", "fallback")).toBe("fallback");
  });

  it("never throws when storage is blocked", () => {
    const blocked = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(blocked);

    expect(safeGet("k", "fallback")).toBe("fallback");
    expect(() => safeSet("k", "v")).not.toThrow();
    expect(() => safeRemove("k")).not.toThrow();
  });
});
