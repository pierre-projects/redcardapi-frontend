export default function FontWarning({ language }) {
  if (!language) return null;

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        background: "#fff3cd",
        border: "1px solid #ffc107",
        marginTop: 16,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <span style={{ fontSize: 20 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          Font Not Available
        </div>
        <div style={{ fontSize: 14, opacity: 0.9 }}>
          The font required to render <strong>{language.name}</strong> ({language.code})
          is not currently installed. PDF generation may fail or display incorrect characters.
          Please install the appropriate font pack to support this language.
        </div>
      </div>
    </div>
  );
}
