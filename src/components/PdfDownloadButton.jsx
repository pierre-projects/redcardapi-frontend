import { useState } from "react";
import { downloadPdf } from "../api";
import LoadingSpinner from "./LoadingSpinner";

/**
 * PDF download button with loading state and error handling.
 */
export default function PdfDownloadButton({
  code,
  cardsPerPage = 4,
  mode = "grid",
  disabled,
  disabledReason = "",
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getErrorMessage = (err) => {
    if (!err) return "Failed to download PDF";

    if (err.status === 400 && err.detail?.error_type === "font_not_available") {
      const script = err.detail?.script ? ` Script: ${err.detail.script}.` : "";
      return `Cannot generate PDF because required font support is missing.${script}`;
    }

    if (err.status === 404) {
      return "Language was not found. Refresh and select another language.";
    }

    if (err.status === 503) {
      return "Backend is still starting. Please wait a moment and try again.";
    }

    if (err.status >= 500) {
      return "PDF generation failed on the server. Please retry.";
    }

    return err.message || "Failed to download PDF";
  };

  const handleDownload = async () => {
    if (disabled || loading || !code) return;

    setLoading(true);
    setError(null);

    try {
      const { blob, filename } = await downloadPdf(code, cardsPerPage, mode);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `know-your-rights-${code}-${cardsPerPage}up.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(getErrorMessage(e));
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = disabled || loading;
  const buttonClassName = [
    "pdf-download-button",
    disabled ? "is-disabled" : "",
    loading ? "is-loading" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="pdf-download">
      <button
        onClick={handleDownload}
        disabled={isDisabled}
        title={isDisabled && disabledReason ? disabledReason : undefined}
        className={buttonClassName}
      >
        {loading && <LoadingSpinner size={16} color="var(--button-primary-text)" />}
        {loading ? "Generating..." : "Download PDF"}
      </button>

      {isDisabled && disabledReason && !loading && (
        <div className="pdf-download-reason">
          {disabledReason}
        </div>
      )}

      {/* Error tooltip */}
      {error && (
        <div className="pdf-download-error">
          {error}
        </div>
      )}
    </div>
  );
}
