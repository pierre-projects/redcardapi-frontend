import { normalizeCode, normalizeText } from "../../../utils/redCardPayload";

export function getFileSafeSlug(code, name) {
  const byCode = normalizeCode(code);
  if (byCode) return byCode;

  const byName = normalizeText(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return byName || "translation";
}

export function createExportFilename({ code, name }) {
  return `redcard-${getFileSafeSlug(code, name)}.json`;
}

export function downloadJsonFile({ filename, jsonText }) {
  const blob = new Blob([jsonText], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
