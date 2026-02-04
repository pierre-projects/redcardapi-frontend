export default function LanguagePicker({ languages, value, onChange }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label style={{ fontWeight: 600 }}>Language</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
      >
        <option value="" disabled>
          Select a language...
        </option>
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {!l.fontSupported ? "⚠️ " : ""}{l.name} ({l.code}){l.rtl ? " • RTL" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
