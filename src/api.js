// Production builds fail in vite.config.js when VITE_API_BASE is missing, so
// this fallback only ever applies to local development.
const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8000").replace(/\/+$/, "");

const DEFAULT_TIMEOUT_MS = 10000;
const RETRY_DELAYS_MS = [600, 1800];

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

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

function isRetryable(error) {
  if (error instanceof ApiError) return error.status === 503 || error.status >= 502;
  // Network failures and per-attempt timeouts.
  return error?.name === "TypeError" || error?.name === "TimeoutError";
}

/**
 * fetch() with a per-attempt timeout and retries on network errors and
 * 502/503/504, so a stalled mobile connection never spins forever.
 * Caller cancellation (signal) aborts immediately without retrying.
 */
export async function fetchWithRetry(url, {
  signal,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retries = RETRY_DELAYS_MS.length,
  fallbackMessage = "Request failed",
} = {}) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (attempt > 0) {
      await wait(RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)], signal);
    }

    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const attemptSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

    try {
      const res = await fetch(url, { signal: attemptSignal });
      if (!res.ok) throw await toApiError(res, fallbackMessage);
      return res;
    } catch (error) {
      if (signal?.aborted) throw error;
      const normalized = timeoutSignal.aborted
        ? Object.assign(new Error("The server took too long to respond."), { name: "TimeoutError" })
        : error;
      lastError = normalized;
      if (!isRetryable(normalized)) break;
    }
  }

  if (lastError?.name === "TypeError") {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  throw lastError;
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
 * Fetch PDF-service language metadata (used for per-language font support).
 * Card content itself is bundled with the app; see src/data/cards.js.
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 */
export async function fetchLanguages(signal) {
  const res = await fetchWithRetry(`${API_BASE}/api/languages`, {
    signal,
    fallbackMessage: "Failed to load languages",
  });
  return res.json();
}

/**
 * Fetch available configuration options.
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 */
export async function fetchConfig(signal) {
  const res = await fetchWithRetry(`${API_BASE}/api/config`, {
    signal,
    fallbackMessage: "Failed to load config",
  });
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
  // PDF rendering can be slow on a cold server; allow more time per attempt.
  const res = await fetchWithRetry(url, {
    signal,
    timeoutMs: 30000,
    retries: 1,
    fallbackMessage: "Failed to generate PDF",
  });

  const blob = await res.blob();
  const filename = parseFilenameFromContentDisposition(res.headers.get("content-disposition"));
  return { blob, filename };
}
