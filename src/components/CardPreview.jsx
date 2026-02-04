import LoadingSpinner from "./LoadingSpinner";

export default function CardPreview({ card, loading }) {
  // Loading state
  if (loading) {
    return (
      <div
        style={{
          padding: 16,
          border: "1px solid #eee",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "#666",
        }}
      >
        <LoadingSpinner size={18} />
        <span>Loading card data...</span>
      </div>
    );
  }

  // Empty state
  if (!card) {
    return (
      <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        Select a language to preview the payload.
      </div>
    );
  }

  return (
    <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h3 style={{ margin: 0 }}>
          {card.name} ({card.code})
        </h3>
        <span
          style={{
            fontSize: 12,
            padding: "2px 8px",
            borderRadius: 999,
            border: "1px solid #ccc",
          }}
        >
          {card.official ? "Official" : "Unofficial"}
        </span>
        {card.rtl && (
          <span
            style={{
              fontSize: 12,
              padding: "2px 8px",
              borderRadius: 999,
              border: "1px solid #ccc",
            }}
          >
            RTL
          </span>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Front (raw JSON)</div>
        <pre
          style={{
            background: "#0b0b0b",
            color: "#eee",
            padding: 12,
            borderRadius: 10,
            overflow: "auto",
            fontSize: 13,
          }}
        >
          {JSON.stringify(card.front, null, 2)}
        </pre>
      </div>
    </div>
  );
}
