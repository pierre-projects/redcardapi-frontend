const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

/**
 * Custom error class for API errors with status code.
 */
export class ApiError extends Error {
  constructor(status, message, detail = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function parseErrorPayload(res) {
  return res.json().catch(() => ({}));
}

function mapErrorMessage(status, data, fallbackMessage) {
  if (status === 400 && data?.error_type === "font_not_available") {
    const language = data?.language ? ` (${data.language})` : "";
    const script = data?.script ? ` Script: ${data.script}.` : "";
    return `Font support is not available for this language${language}.${script}`;
  }

  if (status === 404) {
    return data?.detail || "Language was not found. Please choose another option.";
  }

  if (status === 503) {
    return "Service is not ready yet. Please try again in a moment.";
  }

  if (status >= 500) {
    return "Server error while processing your request. Please try again.";
  }

  return data?.detail || fallbackMessage;
}

async function toApiError(res, fallbackMessage) {
  const data = await parseErrorPayload(res);
  const message = mapErrorMessage(res.status, data, fallbackMessage);
  return new ApiError(res.status, message, data);
}

function parseFilenameFromContentDisposition(contentDisposition) {
  if (!contentDisposition) return null;

  // RFC 5987 / 6266 format: filename*=UTF-8''...
  const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  // Legacy format: filename="..." or filename=...
  const quotedMatch = contentDisposition.match(/filename\s*=\s*"([^"]+)"/i);
  if (quotedMatch?.[1]) return quotedMatch[1].trim();

  const plainMatch = contentDisposition.match(/filename\s*=\s*([^;]+)/i);
  if (plainMatch?.[1]) return plainMatch[1].trim();

  return null;
}

/**
 * Fetch all available languages.
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 */
export async function fetchLanguages(signal) {
  const res = await fetch(`${API_BASE}/api/languages`, { signal });
  if (!res.ok) {
    throw await toApiError(res, "Failed to load languages");
  }
  return res.json();
}

/**
 * Fetch card content for a specific language.
 * @param {string} code - Language code
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 */
export async function fetchCard(code, signal) {
  const res = await fetch(
    `${API_BASE}/api/card/${encodeURIComponent(code)}`,
    { signal }
  );
  if (!res.ok) {
    throw await toApiError(res, "Failed to load card");
  }
  return res.json();
}

/**
 * Fetch available configuration options.
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 */
export async function fetchConfig(signal) {
  const res = await fetch(`${API_BASE}/api/config`, { signal });
  if (!res.ok) {
    throw await toApiError(res, "Failed to load config");
  }
  return res.json();
}

/**
 * Get PDF download URL with layout option and render mode.
 * @param {string} code - Language code
 * @param {object|number} options - { cardsPerPage, mode } or cardsPerPage number
 */
export function pdfUrl(code, options = {}) {
  const cardsPerPage = typeof options === "number"
    ? options
    : options?.cardsPerPage ?? 4;
  const mode = typeof options === "number"
    ? "legacy"
    : options?.mode ?? "legacy";

  const base = `${API_BASE}/api/render/${encodeURIComponent(code)}`;
  const query = new URLSearchParams();

  if (cardsPerPage) {
    query.set("cards_per_page", String(cardsPerPage));
  }
  if (mode) {
    query.set("mode", mode);
  }

  const queryString = query.toString();
  return queryString ? `${base}?${queryString}` : base;
}

/**
 * Download PDF as blob (for better error handling).
 * @param {string} code - Language code
 * @param {number} cardsPerPage - Cards per page
 * @param {string} mode - Render mode ("legacy" or "fold")
 * @param {AbortSignal} signal - Optional abort signal
 */
export async function downloadPdf(code, cardsPerPage = 4, mode = "legacy", signal) {
  const url = pdfUrl(code, { cardsPerPage, mode });
  const res = await fetch(url, { signal });

  if (!res.ok) {
    throw await toApiError(res, "Failed to generate PDF");
  }

  const blob = await res.blob();
  const filename = parseFilenameFromContentDisposition(res.headers.get("content-disposition"));
  return { blob, filename };
}
