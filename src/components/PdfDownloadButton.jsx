import { useState } from "react";
import { downloadPdf } from "../api";
import LoadingSpinner from "./LoadingSpinner";

/**
 * PDF download button with loading state and error handling.
 */
export default function PdfDownloadButton({
  code,
  cardsPerPage = 4,
  disabled,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    if (disabled || loading || !code) return;

    setLoading(true);
    setError(null);

    try {
      const blob = await downloadPdf(code, cardsPerPage);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `know-your-rights-${code}-${cardsPerPage}up.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || "Failed to download PDF");
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = disabled || loading;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleDownload}
        disabled={isDisabled}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 10,
          background: isDisabled ? "#aaa" : "#111",
          color: "#fff",
          border: "none",
          fontWeight: 600,
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: loading ? 0.8 : 1,
        }}
      >
        {loading && <LoadingSpinner size={16} color="#fff" />}
        {loading ? "Generating..." : "Download PDF"}
      </button>

      {/* Error tooltip */}
      {error && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            padding: "6px 10px",
            borderRadius: 6,
            background: "#ffe5e5",
            border: "1px solid #ffb3b3",
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
