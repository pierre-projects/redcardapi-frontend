import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchLanguages } from "../lib/languageMatch";

export default function LanguagePicker({ languages, value, onChange }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const optionRefs = useRef([]);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const labelId = `${baseId}-label`;

  // Match English name, native name or code, ignoring accents.
  const filtered = useMemo(() => searchLanguages(languages, search), [languages, search]);

  const safeHighlightedIndex = Math.min(
    highlightedIndex,
    Math.max(filtered.length - 1, 0)
  );

  // Get selected language display name
  const selectedLanguage = languages.find((l) => l.code === value);
  const displayValue = selectedLanguage
    ? selectedLanguage.native === selectedLanguage.name
      ? selectedLanguage.name
      : `${selectedLanguage.native} · ${selectedLanguage.name}`
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
      <span id={labelId} style={{ fontWeight: 600 }}>Language</span>
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={toggleDropdown}
          onKeyDown={handleTriggerKeyDown}
          aria-haspopup="listbox"
          aria-labelledby={`${labelId} ${baseId}-value`}
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
          <span id={`${baseId}-value`}>{displayValue || "Select a language..."}</span>
          <span style={{ float: "right" }} aria-hidden="true">{isOpen ? "▴" : "▾"}</span>
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
                placeholder="Search in any language..."
                aria-label="Search languages"
                role="combobox"
                aria-controls={listboxId}
                aria-expanded={isOpen}
                aria-autocomplete="list"
                aria-activedescendant={
                  filtered[safeHighlightedIndex]
                    ? `${baseId}-option-${filtered[safeHighlightedIndex].code}`
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
              aria-labelledby={labelId}
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
                  <div
                    key={l.code}
                    id={`${baseId}-option-${l.code}`}
                    onClick={() => handleSelect(l.code)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    ref={(el) => {
                      optionRefs.current[index] = el;
                    }}
                    role="option"
                    aria-selected={l.code === value}
                    style={{
                      padding: "10px 12px",
                      textAlign: "start",
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
                    <span lang={l.code} dir={l.rtl ? "rtl" : "ltr"} style={{ fontWeight: 600 }}>
                      {l.native}
                    </span>
                    {l.native !== l.name && (
                      <span style={{ marginInlineStart: 8, color: "var(--color-text-muted)" }}>
                        {l.name}
                      </span>
                    )}
                    {l.fontSupported === false && (
                      <span style={{ display: "block", fontSize: 12, color: "var(--color-text-muted)" }}>
                        PDF download unavailable · browser print works
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
