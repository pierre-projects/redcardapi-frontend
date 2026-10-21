import Icon from "../../../components/Icon";

/**
 * Print the card being built, straight from the browser (no backend needed).
 * `settings` holds the layout and ink controls, owned by the app.
 */
export default function PrintSection({ isValid, missing = [], onPrint, settings }) {
  const hintId = "builder-print-hint";

  return (
    <section className="translation-section" aria-labelledby="builder-print-title">
      <h3 id="builder-print-title" className="translation-section-title">Print</h3>
      <p className="translation-export-note">
        Print paper cards of this translation from your browser. Nothing is sent to a server.
      </p>
      {settings}
      <div className="print-action">
        <button
          type="button"
          className="button-primary"
          onClick={onPrint}
          disabled={!isValid}
          aria-describedby={hintId}
        >
          <Icon name="printer" />
          Print cards
        </button>
        <p id={hintId} className="field-hint">
          {isValid
            ? "In the print dialog, turn off headers and footers and set scale to 100%."
            : `Fill in the required fields to print${missing.length ? `: ${missing.join(", ")}` : ""}.`}
        </p>
      </div>
    </section>
  );
}
