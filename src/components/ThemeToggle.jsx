import { useEffect, useState } from "react";

const STORAGE_KEY = "theme-preference";

function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
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
