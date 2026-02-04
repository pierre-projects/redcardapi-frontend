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

/**
 * Fetch all available languages.
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 */
export async function fetchLanguages(signal) {
  const res = await fetch(`${API_BASE}/api/languages`, { signal });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.detail || "Failed to load languages");
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
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      data.detail || "Failed to load card",
      data.code
    );
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
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.detail || "Failed to load config");
  }
  return res.json();
}

/**
 * Get PDF download URL with layout option.
 * @param {string} code - Language code
 * @param {number} cardsPerPage - Cards per page (4, 6, 8, or 12)
 */
export function pdfUrl(code, cardsPerPage = 4) {
  const base = `${API_BASE}/api/render/${encodeURIComponent(code)}`;
  return cardsPerPage ? `${base}?cards_per_page=${cardsPerPage}` : base;
}

/**
 * Download PDF as blob (for better error handling).
 * @param {string} code - Language code
 * @param {number} cardsPerPage - Cards per page
 * @param {AbortSignal} signal - Optional abort signal
 */
export async function downloadPdf(code, cardsPerPage = 4, signal) {
  const url = pdfUrl(code, cardsPerPage);
  const res = await fetch(url, { signal });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      data.detail || "Failed to generate PDF",
      data.code
    );
  }

  return res.blob();
}
