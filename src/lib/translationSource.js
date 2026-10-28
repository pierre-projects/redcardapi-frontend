/**
 * Where a card's text came from, in words people can act on.
 *
 * Source types (see the backend's app/data.py):
 *   official   ILRC's own card
 *   machine    a translation app's output of the English card text
 *   community  written by a contributor
 *
 * machineNotice() must match Source.machine_notice in the backend, so a card
 * says the same thing on screen, in a saved image and on a printed PDF.
 */

export function isMachineTranslation(card) {
  return card?.source?.type === "machine";
}

/** English line shown on (and printed with) machine-translated cards, else null. */
export function machineNotice(card) {
  if (!isMachineTranslation(card)) return null;
  const engine = card.source.engine || "a translation app";
  return card.source.verified
    ? `Machine translation (${engine}), checked by a native speaker.`
    : `Machine translation (${engine}), not yet checked by a native speaker.`;
}

/** One sentence for "About this translation": who made the text, how and when. */
export function sourceDescription(card) {
  const source = card?.source;
  if (!source) return null;
  if (source.type === "machine") {
    const from = source.translated_from || "the English card text";
    const when = source.translated_on ? ` on ${source.translated_on}` : "";
    return `Translated from ${from} by ${source.engine || "a translation app"}${when}.`;
  }
  if (source.type === "community") {
    return source.origin ? `Translated by ${source.origin}.` : "Translated by a contributor.";
  }
  return source.origin && source.origin !== "unknown" ? `From ${source.origin}.` : null;
}
