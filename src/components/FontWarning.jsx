/**
 * Shown when the PDF service cannot render this language's script. The card
 * itself and browser printing are unaffected, so say so plainly.
 */
export default function FontWarning({ language }) {
  if (!language) return null;

  return (
    <div className="notice" role="note">
      <strong>PDF download isn't available for {language.name} yet.</strong>{" "}
      Use Browser Print instead — it prints this language correctly.
    </div>
  );
}
