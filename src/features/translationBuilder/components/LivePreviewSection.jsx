import CardPreview from "../../../components/CardPreview";

export default function LivePreviewSection({ isValid, previewCard }) {
  return (
    <section className="translation-section">
      <h3 className="translation-section-title">Live Preview</h3>
      {isValid ? (
        <div className="translation-live-preview-card">
          <CardPreview card={previewCard} loading={false} />
        </div>
      ) : (
        <p className="translation-preview-hint">
          Fill required fields to render a live card preview.
        </p>
      )}
    </section>
  );
}
