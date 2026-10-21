import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchLanguages } from "../lib/languageMatch";
import Icon from "./Icon";

export default function LanguagePicker({ languages, value, onChange }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const triggerRef = useRef(null);
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
    triggerRef.current?.focus();
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
      triggerRef.current?.focus();
      return;
    }

    if (e.key === "Tab") {
      closeDropdown();
    }
  };

  return (
    <div className="field picker" ref={containerRef}>
      <span id={labelId} className="field-label">Language</span>
      <div className="picker-anchor">
        <button
          ref={triggerRef}
          type="button"
          className={`picker-trigger ${value ? "" : "is-empty"}`}
          onClick={toggleDropdown}
          onKeyDown={handleTriggerKeyDown}
          aria-haspopup="listbox"
          aria-labelledby={`${labelId} ${baseId}-value`}
          aria-expanded={isOpen}
          aria-controls={listboxId}
        >
          <span id={`${baseId}-value`}>{displayValue || "Select a language"}</span>
          <Icon name="chevron-down" />
        </button>

        {isOpen && (
          <div className="picker-popover">
            <div className="picker-search">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Search in any language"
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
              />
            </div>

            <p className="visually-hidden" role="status">
              {search ? `${filtered.length} ${filtered.length === 1 ? "language" : "languages"} found` : ""}
            </p>
            {filtered.length === 0 && <div className="picker-empty">No languages found</div>}
            <div
              id={listboxId}
              role="listbox"
              aria-labelledby={labelId}
              className="picker-list"
              hidden={filtered.length === 0}
            >
              {filtered.map((l, index) => (
                  // Combobox pattern: focus stays in the search box and options are
                  // reached with aria-activedescendant, so they are not tabbable.
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
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
                    className={`picker-option ${index === safeHighlightedIndex ? "is-active" : ""}`}
                  >
                    <span lang={l.code} dir={l.rtl ? "rtl" : "ltr"} className="picker-option-native">
                      {l.native}
                    </span>
                    {l.native !== l.name && <span className="picker-option-name">{l.name}</span>}
                    {l.fontSupported === false && (
                      <span className="picker-option-note">PDF unavailable · browser print works</span>
                    )}
                    {l.code === value && <Icon name="check" size={16} className="picker-option-check" />}
                  </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
