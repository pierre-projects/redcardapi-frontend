/**
 * Render a card (both sides) to a PNG so it can live in the photo gallery and
 * be shown with no browser, app or connection at all.
 */

const WIDTH = 1080;
const PAD = 72;
const FRONT_BG = "#B91C1C";
const FRONT_TEXT = "#FFFFFF";
const BACK_BG = "#FFFFFF";
const BACK_TEXT = "#111111";

function segmentText(text, lang) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter(lang, { granularity: "word" });
      return Array.from(segmenter.segment(text), (s) => s.segment);
    } catch {
      // Unknown locale; fall through.
    }
  }
  return text.split(/(\s+)/);
}

/** Greedy line wrapping on word-segment boundaries (works for Thai, CJK, etc.). */
function wrapText(ctx, text, maxWidth, lang) {
  const lines = [];
  let line = "";

  for (const segment of segmentText(text, lang)) {
    const candidate = line + segment;
    if (line && ctx.measureText(candidate.trimEnd()).width > maxWidth) {
      lines.push(line.trim());
      line = segment.trimStart();
      // A single segment wider than the line: break it by character.
      while (ctx.measureText(line).width > maxWidth && line.length > 1) {
        let cut = line.length - 1;
        while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > maxWidth) cut -= 1;
        lines.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    } else {
      line = candidate;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function layoutBlocks(ctx, blocks, fontFamily) {
  const items = [];
  let y = 0;
  for (const block of blocks) {
    ctx.font = `${block.weight || 400} ${block.size}px ${fontFamily}`;
    const indent = block.bullet ? block.size * 1.1 : 0;
    const lines = wrapText(ctx, block.text, WIDTH - PAD * 2 - indent, block.lang);
    const lineHeight = Math.round(block.size * 1.45);
    y += block.gapBefore || 0;
    lines.forEach((text, index) => {
      y += lineHeight;
      items.push({ ...block, text, y, indent, showBullet: block.bullet && index === 0 });
    });
  }
  return { items, height: y };
}

function drawBlocks(ctx, items, offsetY, fontFamily, rtl, color) {
  ctx.fillStyle = color;
  for (const item of items) {
    ctx.font = `${item.italic ? "italic " : ""}${item.weight || 400} ${item.size}px ${fontFamily}`;
    const baseline = offsetY + item.y - item.size * 0.35;
    const itemRtl = item.lang === "en" ? false : rtl;
    ctx.direction = itemRtl ? "rtl" : "ltr";
    ctx.textAlign = itemRtl ? "right" : "left";
    const edge = itemRtl ? WIDTH - PAD : PAD;
    const x = itemRtl ? edge - item.indent : edge + item.indent;
    if (item.showBullet) {
      ctx.fillText("•", edge, baseline);
    }
    ctx.fillText(item.text, x, baseline);
  }
}

/**
 * @returns {Promise<Blob>} PNG of the front (user's language) above the back
 * (English, for the officer).
 */
export async function renderCardImage(card, back) {
  if (document.fonts?.ready) await document.fonts.ready;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const fontFamily = getComputedStyle(document.body).fontFamily || "sans-serif";

  const frontBlocks = [
    { text: card.front.header || card.name, size: 52, weight: 700, lang: card.code },
    ...card.front.bullets.map((text) => ({
      text, size: 38, lang: card.code, bullet: true, gapBefore: 18,
    })),
  ];
  const backBlocks = [
    ...back.statements.map((text, index) => ({
      text, size: 34, lang: "en", gapBefore: index === 0 ? 0 : 20,
    })),
    ...(back.footer ? [{ text: back.footer, size: 30, lang: "en", italic: true, gapBefore: 28 }] : []),
  ];

  const front = layoutBlocks(ctx, frontBlocks, fontFamily);
  const backLayout = layoutBlocks(ctx, backBlocks, fontFamily);

  const frontHeight = front.height + PAD * 2;
  const backHeight = backLayout.height + PAD * 2;
  canvas.width = WIDTH;
  canvas.height = frontHeight + backHeight;

  ctx.fillStyle = FRONT_BG;
  ctx.fillRect(0, 0, WIDTH, frontHeight);
  ctx.fillStyle = BACK_BG;
  ctx.fillRect(0, frontHeight, WIDTH, backHeight);

  drawBlocks(ctx, front.items, PAD, fontFamily, card.rtl, FRONT_TEXT);
  drawBlocks(ctx, backLayout.items, frontHeight + PAD, fontFamily, false, BACK_TEXT);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Image export failed"))), "image/png");
  });
}

/** Share the image where the OS supports it (saves to Photos), else download. */
export async function saveCardImage(card, back) {
  const blob = await renderCardImage(card, back);
  const filename = `red-card-${card.code}.png`;
  const file = typeof File !== "undefined" ? new File([blob], filename, { type: "image/png" }) : null;

  if (file && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: card.native });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
      // Fall back to a download below.
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
