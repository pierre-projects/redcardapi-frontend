import { useState } from "react";
import Icon from "./Icon";

/**
 * Flip-card preview for the print workspace. Only the visible face is exposed
 * to assistive technology, and the flip control says which side it shows.
 */
export default function CardPreview({ card, back, onShowCard, colors = null }) {
  const [side, setSide] = useState("front");

  if (!card) {
    return (
      <div className="preview-panel preview-state">
        <span className="preview-muted">Select a language to preview the card.</span>
      </div>
    );
  }

  const isBack = side === "back";
  const direction = card.rtl ? "rtl" : "ltr";
  // Color prints use one color on both faces; otherwise the usual red front, white back.
  const faceStyle = colors
    ? { background: colors.background, color: colors.text, borderColor: "transparent" }
    : undefined;

  return (
    <section className="preview-panel" aria-labelledby="preview-title">
      <div className="preview-meta">
        <h2 id="preview-title" className="preview-title">
          <span lang={card.code} dir={direction}>{card.native}</span>
          {card.native !== card.name && <span className="preview-title-en"> · {card.name}</span>}
        </h2>
        {onShowCard && (
          <button type="button" onClick={onShowCard}>
            <Icon name="maximize" />
            Open card view
          </button>
        )}
      </div>

      {card.source && !card.source.verified && (
        <div className="notice" role="note">
          <span>
            <strong>Not yet reviewed by a native speaker.</strong>{" "}
            {card.source.review_note || "Check the text before printing many copies."}
          </span>
        </div>
      )}

      <div className="preview-card-stage">
        <div className={`preview-card-viewport ${isBack ? "is-back" : ""}`}>
          <button
            type="button"
            className="preview-flip-button"
            onClick={() => setSide((prev) => (prev === "front" ? "back" : "front"))}
            aria-label={isBack ? "Show front (card language)" : "Show back (English, for the officer)"}
            title={isBack ? "Show front" : "Show back"}
          >
            <Icon name="flip" />
          </button>

          <div className={`preview-card-flipper ${isBack ? "is-back" : ""}`}>
            <article
              className="preview-card-face preview-card-front"
              dir={direction}
              lang={card.code}
              style={faceStyle}
              aria-hidden={isBack}
              inert={isBack ? true : undefined}
            >
              <h3 className="preview-card-header">
                {card.front.header || "Header not available for this translation."}
              </h3>
              {card.front.bullets.length > 0 ? (
                <ul className="preview-card-bullets">
                  {card.front.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : (
                <p className="preview-card-empty">No bullet content found.</p>
              )}
            </article>

            <article
              className="preview-card-face preview-card-back"
              dir="ltr"
              lang="en"
              style={faceStyle}
              aria-hidden={!isBack}
              inert={!isBack ? true : undefined}
            >
              <div className="preview-back-paragraphs">
                {back.statements.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {back.footer && <p className="is-italic">{back.footer}</p>}
              </div>
            </article>
          </div>
        </div>
      </div>

      {card.source && (
        <details className="preview-raw">
          <summary className="preview-raw-summary">About this translation</summary>
          <div className="preview-source">
            <span className="preview-source-label">Source:</span>{" "}
            <span className="preview-source-value">{card.source.type}</span>
            {card.source.origin && card.source.origin !== "unknown" && (
              <span> - {card.source.origin}</span>
            )}
            {card.source.verified && <span> - verified</span>}
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
        </details>
      )}
    </section>
  );
}
