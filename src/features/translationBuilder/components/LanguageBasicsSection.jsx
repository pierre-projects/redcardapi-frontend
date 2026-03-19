export default function LanguageBasicsSection({
  form,
  normalizedCode,
  missingSet,
  onFieldChange,
}) {
  return (
    <section className="translation-section">
      <h3 className="translation-section-title">Language Basics</h3>
      <div className="translation-builder-grid">
        <label>
          <span className="translation-field-label">Language name</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onFieldChange("name", e.target.value)}
            placeholder="Example: Spanish (Mexico)"
            className={missingSet.has("Language name") ? "is-field-error" : ""}
          />
        </label>

        <label>
          <span className="translation-field-label">Language code</span>
          <input
            type="text"
            value={form.code}
            onChange={(e) => onFieldChange("code", e.target.value)}
            placeholder="Example: es-MX"
            className={missingSet.has("Language code") ? "is-field-error" : ""}
          />
        </label>

        <label className="translation-toggle">
          <input
            type="checkbox"
            checked={form.rtl}
            onChange={(e) => onFieldChange("rtl", e.target.checked)}
          />
          <span className="translation-toggle-track" aria-hidden="true">
            <span className="translation-toggle-thumb" />
          </span>
          <span className="translation-toggle-text">Right-to-left (RTL)</span>
        </label>

        <div className="translation-normalized-code">
          <span className="translation-field-label">Normalized code</span>
          <code>{normalizedCode || "-"}</code>
        </div>
      </div>

      <label className="translation-header-field">
        <span className="translation-field-label">Header</span>
        <textarea
          rows={2}
          value={form.header}
          onChange={(e) => onFieldChange("header", e.target.value)}
          className={missingSet.has("Header") ? "is-field-error" : ""}
        />
      </label>
    </section>
  );
}
