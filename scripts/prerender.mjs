// Post-build: write a static HTML page per language at dist/card/<code>/index.html.
//
// Each page contains the card text itself, so it shows even before (or
// without) JavaScript, on slow connections, and to link previews/search
// engines. React replaces the static markup once the app loads.
// With SITE_URL set, also emits canonical/hreflang links, sitemap.xml and
// robots.txt.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeDataset } from "../src/data/normalize.js";
import { getTranslator } from "../src/i18n/messages.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const siteUrl = (process.env.SITE_URL || "").replace(/\/+$/, "");

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const template = readFileSync(resolve(dist, "index.html"), "utf8");
const dataset = JSON.parse(readFileSync(resolve(root, "data/translations.json"), "utf8"));
const { cards, back } = normalizeDataset(dataset);

function cardMarkup(card) {
  const dir = card.rtl ? "rtl" : "ltr";
  const t = getTranslator(card.code);
  const uiDir = t.lang === "ar" ? "rtl" : "ltr";
  const bullets = card.front.bullets.map((text) => `<li>${escapeHtml(text)}</li>`).join("");
  const backParagraphs = back.statements.map((text) => `<p>${escapeHtml(text)}</p>`).join("");
  const footer = back.footer ? `<p class="show-card-footer">${escapeHtml(back.footer)}</p>` : "";
  return [
    `<div class="show-page">`,
    `<div class="show-topbar" lang="${t.lang}" dir="${uiDir}">`,
    `<a class="show-link-button" href="/">${uiDir === "rtl" ? "→" : "←"} ${escapeHtml(t("allLanguages"))}</a>`,
    `<a class="button button-quiet show-print" href="/redcards/${escapeHtml(card.code)}">${escapeHtml(t("print"))}</a>`,
    `</div>`,
    `<article class="show-card show-card-front" lang="${escapeHtml(card.code)}" dir="${dir}">`,
    `<h1 class="show-card-header">${escapeHtml(card.front.header || card.native)}</h1>`,
    `<ul class="show-card-bullets">${bullets}</ul>`,
    `</article>`,
    `<article class="show-card show-card-back" lang="en" dir="ltr">${backParagraphs}${footer}</article>`,
    `</div>`,
  ].join("");
}

function headTags(card) {
  const description = [card.front.header, ...card.front.bullets].join(" ").slice(0, 300);
  const tags = [
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta property="og:title" content="${escapeHtml(`${card.native} — Red Card`)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="website" />`,
  ];
  if (siteUrl) {
    tags.push(`<link rel="canonical" href="${siteUrl}/card/${card.code}" />`);
    for (const other of cards) {
      tags.push(`<link rel="alternate" hreflang="${escapeHtml(other.code)}" href="${siteUrl}/card/${other.code}" />`);
    }
    tags.push(`<meta property="og:url" content="${siteUrl}/card/${card.code}" />`);
  }
  return tags.join("\n    ");
}

for (const card of cards) {
  const html = template
    .replace(/<html lang="[^"]*" dir="[^"]*">/, `<html lang="${escapeHtml(card.code)}" dir="${card.rtl ? "rtl" : "ltr"}">`)
    .replace(/<meta name="description"[^>]*>/, "")
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(`${card.native} — Red Card: Know Your Rights`)}</title>\n    ${headTags(card)}`)
    .replace('<div id="root"></div>', `<div id="root">${cardMarkup(card)}</div>`);

  if (!html.includes('class="show-card-header"')) {
    throw new Error("Prerender template did not match dist/index.html; check index.html markup.");
  }

  const outDir = resolve(dist, "card", card.code);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "index.html"), html);
}

if (siteUrl) {
  const urls = ["/", ...cards.map((card) => `/card/${card.code}`)]
    .map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`)
    .join("\n");
  writeFileSync(
    resolve(dist, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
  writeFileSync(resolve(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
} else {
  writeFileSync(resolve(dist, "robots.txt"), "User-agent: *\nAllow: /\n");
}

console.log(`Prerendered ${cards.length} card pages${siteUrl ? ` for ${siteUrl}` : ""}.`);
