import { useEffect, useState } from "react";
import { safeGet, safeSet } from "../lib/storage";
import Icon from "./Icon";

const STORAGE_KEY = "theme-preference";

function systemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Follows the system theme until the user picks one; only an explicit choice
 * is saved, so a visitor's OS setting keeps applying otherwise.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    const stored = safeGet(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : systemTheme();
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="icon-button"
      onClick={() => {
        safeSet(STORAGE_KEY, next);
        setTheme(next);
      }}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} />
    </button>
  );
}
