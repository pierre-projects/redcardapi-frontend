/**
 * Pure normalization of the translations dataset.
 *
 * Shared by the app (bundled data) and by build scripts running in Node
 * (prerendering per-language pages), so it must not touch browser APIs.
 */

export function normalizeLanguageCode(code) {
  return String(code || "").trim().toLowerCase().replace(/_/g, "-");
}

function normalizeBullet(item) {
  if (typeof item === "string") return item.trim();
  if (item && typeof item === "object" && typeof item.text === "string") {
    return item.text.trim();
  }
  return "";
}

export function normalizeFront(front) {
  if (!front || typeof front !== "object") {
    return { header: "", bullets: [] };
  }

  const header = (front.header || front.title || "").trim();
  const sourceBullets = Array.isArray(front.bullets)
    ? front.bullets
    : Array.isArray(front.points)
      ? front.points
      : [];

  return {
    header,
    bullets: sourceBullets.map(normalizeBullet).filter(Boolean),
  };
}

function normalizeBack(back) {
  const statements = Array.isArray(back?.statements)
    ? back.statements.map(normalizeBullet).filter(Boolean)
    : [];
  const footer = typeof back?.footer === "string" ? back.footer.trim() : "";
  return { statements, footer };
}

/**
 * @returns {{ cards: Array, back: {statements: string[], footer: string} }}
 * Cards are sorted by English name and carry: code, name, native, rtl,
 * official, front {header, bullets[]}, source.
 */
export function normalizeDataset(raw) {
  const languageMap = raw?.languages && typeof raw.languages === "object" ? raw.languages : {};

  const cards = Object.entries(languageMap)
    .map(([key, item]) => {
      const code = normalizeLanguageCode(item?.code || key);
      const name = String(item?.name || code).trim();
      return {
        code,
        name,
        native: String(item?.native || name).trim(),
        rtl: Boolean(item?.rtl),
        official: item?.source?.type ? item.source.type === "official" : true,
        front: normalizeFront(item?.front),
        source: item?.source || null,
      };
    })
    .filter((card) => card.code)
    .sort((a, b) => a.name.localeCompare(b.name));

  return { cards, back: normalizeBack(raw?.back) };
}
