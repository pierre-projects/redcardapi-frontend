import { useMemo, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

const DEFAULT_BACK_PARAGRAPHS = [
  "I do not wish to speak with you, answer your questions, or sign or hand you any documents based on my 5th Amendment rights under the United States Constitution.",
  "I do not give you permission to enter my home based on my 4th Amendment rights under the United States Constitution unless you have a warrant to enter, signed by a judge or magistrate with my name on it that you slide under the door.",
  "I do not give you permission to search any of my belongings based on my 4th Amendment rights.",
  "I choose to exercise my constitutional rights.",
  "These cards are available to citizens and noncitizens alike.",
];

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
      className={`copy-button ${copied ? "copy-button-active" : ""}`}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function normalizeBullet(item) {
  if (typeof item === "string") return item.trim();
  if (item && typeof item === "object" && typeof item.text === "string") {
    return item.text.trim();
  }
  return "";
}

export default function CardPreview({ card, loading }) {
  const [side, setSide] = useState("front");

  const { direction, header, bullets, jsonString } = useMemo(() => {
    const nextFront = card?.front || {};
    const nextDirection = card?.rtl ? "rtl" : "ltr";
    const nextHeader = (nextFront.header || nextFront.title || "").trim();
    const rawBullets = Array.isArray(nextFront.bullets)
      ? nextFront.bullets
      : Array.isArray(nextFront.points)
        ? nextFront.points
        : [];

    return {
      direction: nextDirection,
      header: nextHeader,
      bullets: rawBullets.map(normalizeBullet).filter(Boolean),
      jsonString: JSON.stringify(nextFront, null, 2),
    };
  }, [card]);

  const isBack = side === "back";

  if (loading) {
    return (
      <div className="preview-panel preview-state">
        <LoadingSpinner size={18} />
        <span className="preview-muted">Loading card data...</span>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="preview-panel preview-state">
        <span className="preview-muted">Select a language to preview the card.</span>
      </div>
    );
  }

  return (
    <section className="preview-panel">
      <div className="preview-meta">
        <h3 className="preview-title">
          {card.name} ({card.code})
        </h3>
        <span className="preview-badge">
          {card.official ? "Official" : "Unofficial"}
        </span>
        {card.rtl && <span className="preview-badge">RTL</span>}
        {card.source?.verified && (
          <span className="preview-badge preview-badge-verified">Verified</span>
        )}
      </div>

      {card.source && (
        <div className="preview-source">
          <span className="preview-source-label">Source:</span>{" "}
          <span className="preview-source-value">{card.source.type}</span>
          {card.source.origin && card.source.origin !== "unknown" && (
            <span> - {card.source.origin}</span>
          )}
          {card.source.url && (
            <a
              href={card.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="preview-source-link"
            >
              View Source
            </a>
          )}
        </div>
      )}

      <div className="preview-card-stage">
        <div className="preview-card-viewport">
          <button
            type="button"
            className="preview-flip-button"
            onClick={() => setSide((prev) => (prev === "front" ? "back" : "front"))}
            title={isBack ? "Show front preview" : "Show back preview"}
            aria-label={isBack ? "Show front preview" : "Show back preview"}
          >
            {isBack ? "<" : ">"}
          </button>

          <div className={`preview-card-flipper ${isBack ? "is-back" : ""}`}>
            <article className="preview-card-face preview-card-front" dir={direction} lang={card.code}>
              <p className="preview-card-kicker">Front Preview</p>
              <h4 className="preview-card-header">
                {header || "Header not available for this translation."}
              </h4>
              {bullets.length > 0 ? (
                <ul className="preview-card-bullets">
                  {bullets.map((bullet, idx) => (
                    <li key={`${card.code}-bullet-${idx}`}>{bullet}</li>
                  ))}
                </ul>
              ) : (
                <p className="preview-card-empty">No bullet content found.</p>
              )}
            </article>

            <article className="preview-card-face preview-card-back" dir="ltr" lang="en">
              <p className="preview-card-kicker">Back Preview</p>
              <div className="preview-back-paragraphs">
                {DEFAULT_BACK_PARAGRAPHS.map((paragraph, idx) => (
                  <p key={`back-p-${idx}`}>{paragraph}</p>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>

      <details className="preview-raw">
        <summary className="preview-raw-summary">Raw JSON (optional)</summary>
        <div className="preview-raw-actions">
          <span className="preview-raw-label">front payload</span>
          <CopyButton text={jsonString} />
        </div>
        <pre className="preview-raw-pre">{jsonString}</pre>
      </details>
    </section>
  );
}
