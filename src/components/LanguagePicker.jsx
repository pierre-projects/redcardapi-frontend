import { useState, useMemo, useRef, useEffect } from "react";

export default function LanguagePicker({ languages, value, onChange }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter languages based on search
  const filtered = useMemo(() => {
    if (!search.trim()) return languages;
    const query = search.toLowerCase();
    return languages.filter(
      (l) =>
        l.name.toLowerCase().includes(query) ||
        l.code.toLowerCase().includes(query)
    );
  }, [languages, search]);

  // Get selected language display name
  const selectedLanguage = languages.find((l) => l.code === value);
  const displayValue = selectedLanguage
    ? `${selectedLanguage.name} (${selectedLanguage.code})`
    : "";

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (code) => {
    onChange(code);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div style={{ display: "grid", gap: 8 }} ref={containerRef}>
      <label style={{ fontWeight: 600 }}>Language</label>
      <div style={{ position: "relative" }}>
        {/* Selected value display / trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: "100%",
            padding: "10px 12px",
            textAlign: "left",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: 8,
            cursor: "pointer",
            color: value ? "var(--color-text)" : "var(--color-text-muted)",
          }}
        >
          {displayValue || "Select a language..."}
          <span style={{ float: "right" }}>{isOpen ? "▲" : "▼"}</span>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: 4,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 100,
              maxHeight: 300,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Search input */}
            <div style={{ padding: 8, borderBottom: "1px solid var(--border-color)" }}>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search languages..."
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid var(--border-color)",
                  borderRadius: 6,
                  background: "var(--bg-primary)",
                  color: "var(--color-text)",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Options list */}
            <div style={{ overflow: "auto", flex: 1 }}>
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: 12,
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                  }}
                >
                  No languages found
                </div>
              ) : (
                filtered.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleSelect(l.code)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      textAlign: "left",
                      background: l.code === value ? "var(--bg-tertiary)" : "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--border-color)",
                      cursor: "pointer",
                      color: "var(--color-text)",
                    }}
                  >
                    {!l.fontSupported && (
                      <span title="Font not supported">⚠️ </span>
                    )}
                    {l.name} ({l.code})
                    {l.rtl && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "var(--bg-tertiary)",
                        }}
                      >
                        RTL
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
