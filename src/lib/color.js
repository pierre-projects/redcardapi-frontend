// Card colors for color prints. Mirrors redcardapi/app/pdf/colors.py so the
// browser sheet and the PDF pick the same text color.

export const DEFAULT_CARD_COLOR = "#B91C1C";
export const FALLBACK_COLOR_PRESETS = ["#B91C1C", "#EA580C", "#1D4ED8", "#15803D", "#111111"];

const HEX = /^#?([0-9a-f]{6})$/i;

/** "b91c1c" or "#b91c1c" -> "#B91C1C"; null when not a 6-digit hex color. */
export function normalizeHex(value) {
  const match = HEX.exec(String(value || "").trim());
  return match ? `#${match[1].toUpperCase()}` : null;
}

function luminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** White or black text, whichever has the higher WCAG contrast on the color. */
export function textColorFor(hex) {
  const normalized = normalizeHex(hex) || DEFAULT_CARD_COLOR;
  const lum = luminance(normalized);
  const onWhite = 1.05 / (lum + 0.05);
  const onBlack = (lum + 0.05) / 0.05;
  return onWhite >= onBlack ? "#FFFFFF" : "#000000";
}
