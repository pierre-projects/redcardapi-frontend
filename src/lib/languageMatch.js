import { normalizeLanguageCode } from "../data/normalize";

/**
 * Browser/BCP-47 tags that should resolve to a card whose code differs from
 * the tag's base subtag.
 */
const ALIASES = {
  zh: "zh-cn",
  "zh-hans": "zh-cn",
  "zh-sg": "zh-cn",
  "zh-my": "zh-cn",
  "zh-hant": "zh-tw",
  "zh-hk": "zh-tw",
  "zh-mo": "zh-tw",
  "yue-hk": "yue",
  "yue-hant": "yue",
  "fa-af": "prs",
  "ar-sd": "apd",
  in: "id",
  fil: "tl",
  iw: "he",
  "pt-cv": "kea",
  ksw: "kar",
  pes: "fa",
};

/**
 * Resolve a single language tag (e.g. "es-MX", "zh-Hant-HK") to a card code.
 * Tries the full tag, aliases, progressively shorter prefixes, then the base.
 */
export function matchLanguageTag(tag, availableCodes) {
  const normalized = normalizeLanguageCode(tag);
  if (!normalized) return null;
  const available = availableCodes instanceof Set ? availableCodes : new Set(availableCodes);

  const parts = normalized.split("-");
  for (let len = parts.length; len >= 1; len -= 1) {
    const candidate = parts.slice(0, len).join("-");
    if (available.has(candidate)) return candidate;
    const alias = ALIASES[candidate];
    if (alias && available.has(alias)) return alias;
  }

  // "zh-Hant-HK" → try "zh-hk" (script subtag dropped).
  if (parts.length > 2) {
    const withoutScript = `${parts[0]}-${parts[parts.length - 1]}`;
    if (available.has(withoutScript)) return withoutScript;
    const alias = ALIASES[withoutScript];
    if (alias && available.has(alias)) return alias;
  }

  return null;
}

/**
 * First card code matching the user's preferred languages, skipping English
 * unless it is the only match (an English card is rarely what someone in a
 * hurry is looking for, and English is always one tap away anyway).
 */
export function matchPreferredLanguage(tags, availableCodes, { skipEnglish = true } = {}) {
  const available = new Set(availableCodes);
  let englishMatch = null;

  for (const tag of tags || []) {
    const match = matchLanguageTag(tag, available);
    if (!match) continue;
    if (skipEnglish && match === "en") {
      englishMatch = englishMatch || match;
      continue;
    }
    return match;
  }

  return skipEnglish ? null : englishMatch;
}

export function getBrowserLanguageTags() {
  if (typeof navigator === "undefined") return [];
  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    return navigator.languages;
  }
  return navigator.language ? [navigator.language] : [];
}

/** Lowercase and strip diacritics so "espanol" finds "Español". */
export function foldForSearch(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Filter languages by a query matching English name, native name or code.
 * Exact matches rank first, then prefix matches, then substring matches.
 */
export function searchLanguages(languages, query) {
  const folded = foldForSearch(query);
  if (!folded) return languages;

  const scored = [];
  for (const language of languages) {
    const fields = [language.name, language.native, language.code].map(foldForSearch);
    if (fields.includes(folded)) {
      scored.push([0, language]);
    } else if (fields.some((field) => field.startsWith(folded))) {
      scored.push([1, language]);
    } else if (fields.some((field) => field.includes(folded))) {
      scored.push([2, language]);
    }
  }

  return scored.sort((a, b) => a[0] - b[0]).map(([, language]) => language);
}
