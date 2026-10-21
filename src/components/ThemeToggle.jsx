import { useEffect, useState } from "react";
import { safeGet, safeSet } from "../lib/storage";

const STORAGE_KEY = "theme-preference";

function getInitialTheme() {
  const stored = safeGet(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    safeSet(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="theme-toggle"
    >
      <span
        className={`theme-toggle-track ${theme === "dark" ? "is-dark" : ""}`}
        aria-hidden="true"
      >
        <span className="theme-toggle-thumb" />
      </span>
      <span className="theme-toggle-text">
        {theme === "dark" ? "Dark" : "Light"}
      </span>
    </button>
  );
}
