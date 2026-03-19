export default function StatementRow({
  point,
  index,
  value,
  isMissing,
  onPointChange,
}) {
  return (
    <article className="translation-point-row">
      <div className="translation-point-head">
        <span className="translation-point-index">{index + 1}</span>
        <span className="translation-point-title">{point.label}</span>
      </div>
      <div className="translation-point-meta">
        <span className="translation-mini-label">Your Translation</span>
      </div>
      <div className="translation-point-columns">
        <div className="translation-source-block">
          <span className="translation-mini-label">English Source</span>
          <p>{point.sourceText}</p>
        </div>
        <label className="translation-target-block">
          <textarea
            rows={4}
            value={value}
            onChange={(e) => onPointChange(point.key, e.target.value)}
            className={isMissing ? "is-field-error" : ""}
            aria-label={`${point.label} translation`}
          />
        </label>
      </div>
    </article>
  );
}
