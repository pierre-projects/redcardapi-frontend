// Apply the saved/system theme before first paint to prevent a flash.
// Kept as an external file so the Content-Security-Policy needs no inline scripts.
(function () {
  var stored = null;
  try {
    stored = localStorage.getItem("theme-preference");
  } catch {
    // Storage blocked; fall back to the system preference.
  }
  var theme = stored === "light" || stored === "dark"
    ? stored
    : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
})();
