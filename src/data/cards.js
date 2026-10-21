/**
 * Card content bundled into the app at build time.
 *
 * The whole dataset is ~30 KB gzipped, so shipping it with the app means a
 * card renders the moment the page loads — with no API round trip, and with
 * no network at all once the service worker has cached the app.
 * Refresh the snapshot from the backend with `npm run sync:data`.
 */
import rawDataset from "../../data/translations.json";
import { normalizeDataset, normalizeLanguageCode } from "./normalize";

const { cards, back } = normalizeDataset(rawDataset);

const byCode = new Map(cards.map((card) => [card.code, card]));

/** Languages sorted by English name. */
export const LANGUAGES = cards;

/** English officer-facing text, identical for every language. */
export const BACK_CONTENT = back;

export function getCard(code) {
  return byCode.get(normalizeLanguageCode(code)) || null;
}
