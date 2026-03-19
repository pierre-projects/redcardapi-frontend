import { useEffect, useMemo, useRef, useState } from "react";

export default function LanguagePicker({ languages, value, onChange }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const optionRefs = useRef([]);
  const listboxId = "language-picker-listbox";

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

  const safeHighlightedIndex = Math.min(
    highlightedIndex,
    Math.max(filtered.length - 1, 0)
  );

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

  // Keep highlighted option visible while navigating with keyboard.
  useEffect(() => {
    if (!isOpen || filtered.length === 0) return;
    const el = optionRefs.current[safeHighlightedIndex];
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [filtered.length, isOpen, safeHighlightedIndex]);

  const openDropdown = () => {
    const selectedIndex = filtered.findIndex((l) => l.code === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setSearch("");
  };

  const toggleDropdown = () => {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  const moveHighlight = (delta) => {
    if (filtered.length === 0) return;
    setHighlightedIndex((prev) => {
      const current = Math.min(prev, filtered.length - 1);
      const next = current + delta;
      if (next < 0) return filtered.length - 1;
      if (next >= filtered.length) return 0;
      return next;
    });
  };

  const handleSelect = (code) => {
    onChange(code);
    closeDropdown();
  };

  const handleTriggerKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDropdown();
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHighlight(1);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHighlight(-1);
      return;
    }

    if (e.key === "Home") {
      e.preventDefault();
      setHighlightedIndex(0);
      return;
    }

    if (e.key === "End") {
      e.preventDefault();
      if (filtered.length > 0) {
        setHighlightedIndex(filtered.length - 1);
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const active = filtered[safeHighlightedIndex];
      if (active) {
        handleSelect(active.code);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      closeDropdown();
    }
  };

  return (
    <div style={{ display: "grid", gap: 8 }} ref={containerRef}>
      <label style={{ fontWeight: 600 }}>Language</label>
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={toggleDropdown}
          onKeyDown={handleTriggerKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
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
          <span style={{ float: "right" }}>{isOpen ? "^" : "v"}</span>
        </button>

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
            <div style={{ padding: 8, borderBottom: "1px solid var(--border-color)" }}>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Search languages..."
                role="combobox"
                aria-controls={listboxId}
                aria-expanded={isOpen}
                aria-autocomplete="list"
                aria-activedescendant={
                  filtered[safeHighlightedIndex]
                    ? `lang-option-${filtered[safeHighlightedIndex].code}`
                    : undefined
                }
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

            <div
              id={listboxId}
              role="listbox"
              style={{ overflow: "auto", flex: 1 }}
            >
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
                filtered.map((l, index) => (
                  <button
                    key={l.code}
                    id={`lang-option-${l.code}`}
                    type="button"
                    onClick={() => handleSelect(l.code)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    ref={(el) => {
                      optionRefs.current[index] = el;
                    }}
                    role="option"
                    aria-selected={l.code === value}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      textAlign: "left",
                      background:
                        index === safeHighlightedIndex
                          ? "var(--bg-tertiary)"
                          : l.code === value
                            ? "var(--bg-secondary)"
                            : "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--border-color)",
                      cursor: "pointer",
                      color: "var(--color-text)",
                    }}
                  >
                    {!l.fontSupported && (
                      <span title="Font not supported">! </span>
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
