import { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: "4px 10px",
        fontSize: 12,
        borderRadius: 6,
        background: copied ? "var(--success-color)" : "var(--bg-secondary)",
        color: copied ? "#fff" : "var(--color-text)",
        border: "1px solid var(--border-color)",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function CardPreview({ card, loading }) {
  // Loading state
  if (loading) {
    return (
      <div
        style={{
          padding: 16,
          border: "1px solid var(--border-color)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "var(--color-text-muted)",
        }}
      >
        <LoadingSpinner size={18} />
        <span>Loading card data...</span>
      </div>
    );
  }

  // Empty state
  if (!card) {
    return (
      <div
        style={{
          padding: 16,
          border: "1px solid var(--border-color)",
          borderRadius: 12,
          color: "var(--color-text-muted)",
        }}
      >
        Select a language to preview the payload.
      </div>
    );
  }

  const jsonString = JSON.stringify(card.front, null, 2);

  return (
    <div style={{ padding: 16, border: "1px solid var(--border-color)", borderRadius: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>
          {card.name} ({card.code})
        </h3>
        <span
          style={{
            fontSize: 12,
            padding: "2px 8px",
            borderRadius: 999,
            border: "1px solid var(--border-color)",
          }}
        >
          {card.official ? "Official" : "Unofficial"}
        </span>
        {card.rtl && (
          <span
            style={{
              fontSize: 12,
              padding: "2px 8px",
              borderRadius: 999,
              border: "1px solid var(--border-color)",
            }}
          >
            RTL
          </span>
        )}
        {card.source?.verified && (
          <span
            style={{
              fontSize: 12,
              padding: "2px 8px",
              borderRadius: 999,
              background: "var(--success-color)",
              border: "1px solid var(--success-color)",
              color: "#fff",
            }}
          >
            Verified
          </span>
        )}
      </div>

      {/* Source Attribution */}
      {card.source && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            background: "var(--bg-tertiary)",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          <span style={{ fontWeight: 600 }}>Source: </span>
          <span style={{ textTransform: "capitalize" }}>{card.source.type}</span>
          {card.source.origin && card.source.origin !== "unknown" && (
            <span> — {card.source.origin}</span>
          )}
          {card.source.url && (
            <a
              href={card.source.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginLeft: 8 }}
            >
              View Source
            </a>
          )}
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <span style={{ fontWeight: 700 }}>Front (raw JSON)</span>
          <CopyButton text={jsonString} />
        </div>
        <pre
          style={{
            background: "var(--bg-tertiary)",
            padding: 12,
            borderRadius: 10,
            overflow: "auto",
            fontSize: 13,
            margin: 0,
          }}
        >
          {jsonString}
        </pre>
      </div>
    </div>
  );
}
