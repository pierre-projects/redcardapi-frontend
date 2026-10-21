import CardPreview from "../../../components/CardPreview";
import { BACK_CONTENT } from "../../../data/cards";

export default function LivePreviewSection({ isValid, previewCard, colors = null }) {
  return (
    <section className="translation-section">
      <h3 className="translation-section-title">Live Preview</h3>
      {isValid ? (
        <div className="translation-live-preview-card">
          <CardPreview card={previewCard} back={BACK_CONTENT} colors={colors} />
        </div>
      ) : (
        <p className="translation-preview-hint">
          Fill required fields to render a live card preview.
        </p>
      )}
    </section>
  );
}
