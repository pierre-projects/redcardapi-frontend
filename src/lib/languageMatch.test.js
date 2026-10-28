import { describe, expect, it } from "vitest";
import {
  foldForSearch,
  matchLanguageTag,
  matchPreferredLanguage,
  searchLanguages,
} from "./languageMatch";
import { LANGUAGES } from "../data/cards";

const codes = new Set(LANGUAGES.map((language) => language.code));

describe("matchLanguageTag", () => {
  it.each([
    ["es", "es"],
    ["es-MX", "es"],
    ["ES_us", "es"],
    ["zh", "zh-cn"],
    ["zh-CN", "zh-cn"],
    ["zh-Hans-CN", "zh-cn"],
    ["zh-TW", "zh-tw"],
    ["zh-Hant-HK", "zh-tw"],
    ["zh-HK", "zh-tw"],
    ["fa-AF", "prs"],
    ["ar-SD", "apd"],
    ["in-ID", "id"],
    ["fa-IR", "fa"],
    ["fil-PH", "tl"],
    ["iw", "he"],
    ["pt-BR", "pt"],
    ["ht-HT", "ht"],
  ])("%s -> %s", (tag, expected) => {
    expect(matchLanguageTag(tag, codes)).toBe(expected);
  });

  it("returns null for unknown tags", () => {
    expect(matchLanguageTag("xx-YY", codes)).toBeNull();
    expect(matchLanguageTag("", codes)).toBeNull();
  });
});

describe("matchPreferredLanguage", () => {
  it("skips English in favor of a later preference", () => {
    expect(matchPreferredLanguage(["en-US", "es-419"], codes)).toBe("es");
  });

  it("returns null when only English matches", () => {
    expect(matchPreferredLanguage(["en-US", "en"], codes)).toBeNull();
  });

  it("picks the first supported language", () => {
    expect(matchPreferredLanguage(["xx", "vi-VN", "fr"], codes)).toBe("vi");
  });
});

describe("searchLanguages", () => {
  const find = (query) => searchLanguages(LANGUAGES, query).map((language) => language.code);

  it("finds by native name in its own script", () => {
    expect(find("العربية")).toContain("ar");
    expect(find("አማርኛ")).toContain("am");
    expect(find("中文")).toEqual(expect.arrayContaining(["zh-cn", "zh-tw"]));
  });

  it("ignores accents", () => {
    expect(find("espanol")).toContain("es");
    expect(find("kreyol")).toContain("ht");
  });

  it("ranks exact, then prefix, then substring matches", () => {
    const results = find("ka");
    expect(results[0]).toBe("ka");
    expect(results.indexOf("kar")).toBeLessThan(results.indexOf("ilo"));
  });

  it("returns everything for an empty query", () => {
    expect(find("  ")).toHaveLength(LANGUAGES.length);
  });

  it("folds case and diacritics", () => {
    expect(foldForSearch("Français")).toBe("francais");
  });
});
