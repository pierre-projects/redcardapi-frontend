import { describe, expect, it } from "vitest";
import { BACK_CONTENT, LANGUAGES, getCard } from "./cards";

describe("bundled card data", () => {
  it("has every language with a native name and front content", () => {
    expect(LANGUAGES.length).toBeGreaterThanOrEqual(56);
    for (const card of LANGUAGES) {
      expect(card.code).toMatch(/^[a-z]{2,3}(-[a-z]{2,4})?$/);
      expect(card.native.length).toBeGreaterThan(0);
      expect(card.front.header.length).toBeGreaterThan(0);
      expect(card.front.bullets.length).toBeGreaterThan(0);
    }
  });

  it("has unique codes", () => {
    const codes = LANGUAGES.map((card) => card.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("marks right-to-left scripts", () => {
    for (const code of ["ar", "fa", "prs", "he", "ps", "ur"]) {
      expect(getCard(code)?.rtl).toBe(true);
    }
    expect(getCard("es")?.rtl).toBe(false);
  });

  it("looks up codes case-insensitively", () => {
    expect(getCard("ZH_CN")?.code).toBe("zh-cn");
    expect(getCard("nope")).toBeNull();
  });

  it("has the English officer-facing statements", () => {
    expect(BACK_CONTENT.statements.length).toBe(4);
    expect(BACK_CONTENT.footer).toMatch(/citizens and noncitizens/);
  });
});
