import { useEffect, useState } from "react";

const STORAGE_KEY = "theme-preference";

/**
 * Returns the initial theme based on localStorage or system preference
 */
function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  // Default to system preference
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Theme toggle button component
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid var(--border-color)",
        background: "var(--bg-secondary)",
        cursor: "pointer",
        fontSize: 16,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
      <span style={{ fontSize: 14 }}>{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
