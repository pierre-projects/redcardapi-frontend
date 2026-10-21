export default function ExportSection({
  isValid,
  copyState,
  onCopy,
  onDownload,
  onReset,
}) {
  return (
    <section className="translation-section">
      <h3 className="translation-section-title">Export</h3>
      <div className="translation-export-actions">
        <button
          type="button"
          onClick={onCopy}
          disabled={!isValid}
        >
          Copy JSON
        </button>
        <button type="button" onClick={onDownload} disabled={!isValid}>
          Download JSON
        </button>
        <button type="button" onClick={onReset}>
          Reset Form
        </button>
      </div>
      <p className="translation-export-note">
        Output includes `front.named_points` and `front.bullets` (final bullet merges card handoff + inside-home guidance).
      </p>
      {copyState.tone !== "idle" && (
        <div className={`translation-system-message is-${copyState.tone}`}>{copyState.message}</div>
      )}
    </section>
  );
}
