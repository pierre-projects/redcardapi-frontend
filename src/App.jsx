import { useEffect, useMemo, useState } from "react";
import { useLanguages } from "./hooks/useLanguages";
import { useCard } from "./hooks/useCard";
import LanguagePicker from "./components/LanguagePicker";
import LayoutPicker from "./components/LayoutPicker";
import CardPreview from "./components/CardPreview";
import PdfDownloadButton from "./components/PdfDownloadButton";
import FontWarning from "./components/FontWarning";
import ThemeToggle from "./components/ThemeToggle";
import TranslationPayloadBuilder from "./components/TranslationPayloadBuilder";
import HeroLanding from "./components/HeroLanding";
import { LoadingMessage } from "./components/LoadingSpinner";
import "./App.css";

const LANGUAGE_STORAGE_KEY = "selected-language";
const LAYOUT_STORAGE_KEY = "selected-cards-per-page";
const PRINT_METHOD_STORAGE_KEY = "selected-print-method";
const BUILDER_HELP_DISMISSED_KEY = "redcard-builder-help-dismissed";
const PAGE_HOME = "home";
const PAGE_REDCARDS = "redcards";
const PAGE_BUILDER = "builder";

function getBuilderHelpDismissed() {
  try {
    return localStorage.getItem(BUILDER_HELP_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

function setBuilderHelpDismissed() {
  try {
    localStorage.setItem(BUILDER_HELP_DISMISSED_KEY, "true");
  } catch {}
}

const BACKEND_LEGACY_FALLBACK_LAYOUTS = [4, 6, 8, 12];
const BACKEND_FOLD_FALLBACK_LAYOUTS = [4, 5, 6];
const BACKEND_LEGACY_LAYOUT_LABELS = {
  4: "4 cards (2x2)",
  6: "6 cards (2x3)",
  8: "8 cards (2x4)",
  12: "12 cards (3x4)",
};
const BACKEND_FOLD_LAYOUT_LABELS = {
  4: "4 rows (2 columns)",
  5: "5 rows (2 columns)",
  6: "6 rows (2 columns)",
};
const BROWSER_LAYOUT_OPTIONS = [
  { value: 8, label: "4 cards (4 front + 4 back)" },
  { value: 10, label: "5 cards (5 front + 5 back)" },
  { value: 12, label: "6 cards (6 front + 6 back)" },
];

const DEFAULT_BACK_PARAGRAPHS = [
  "I do not wish to speak with you, answer your questions, or sign or hand you any documents based on my 5th Amendment rights under the United States Constitution.",
  "I do not give you permission to enter my home based on my 4th Amendment rights under the United States Constitution unless you have a warrant to enter, signed by a judge or magistrate with my name on it that you slide under the door.",
  "I do not give you permission to search any of my belongings based on my 4th Amendment rights.",
  "I choose to exercise my constitutional rights.",
  "These cards are available to citizens and noncitizens alike.",
];

function getStoredLayout() {
  const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
  if (!stored) return null;
  const parsed = Number(stored);
  return Number.isInteger(parsed) ? parsed : null;
}

function getStoredPrintMethod() {
  const stored = localStorage.getItem(PRINT_METHOD_STORAGE_KEY);
  return stored === "browser" ? "browser" : "backend";
}

function normalizeBullet(item) {
  if (typeof item === "string") return item.trim();
  if (item && typeof item === "object" && typeof item.text === "string") {
    return item.text.trim();
  }
  return "";
}

function normalizeFront(front) {
  if (!front || typeof front !== "object") {
    return { header: "", bullets: [] };
  }

  const header = (front.header || front.title || "").trim();
  const sourceBullets = Array.isArray(front.bullets)
    ? front.bullets
    : Array.isArray(front.points)
      ? front.points
      : [];

  return {
    header,
    bullets: sourceBullets.map(normalizeBullet).filter(Boolean),
  };
}

function normalizePathname(pathname) {
  const normalized = String(pathname || "/").replace(/\/+$/, "");
  return normalized || "/";
}

function normalizeLanguageCode(code) {
  return String(code || "").trim().toLowerCase().replace(/_/g, "-");
}

function parseRoute(pathname) {
  const normalizedPath = normalizePathname(pathname);

  if (normalizedPath === "/") {
    return { page: PAGE_HOME, routeCode: "" };
  }

  if (normalizedPath === "/builder") {
    return { page: PAGE_BUILDER, routeCode: "" };
  }

  if (normalizedPath === "/redcards") {
    return { page: PAGE_REDCARDS, routeCode: "" };
  }

  if (normalizedPath.startsWith("/redcards/")) {
    const encodedCode = normalizedPath.slice("/redcards/".length);
    let routeCode = "";
    try {
      routeCode = decodeURIComponent(encodedCode || "");
    } catch {
      routeCode = encodedCode || "";
    }
    return { page: PAGE_REDCARDS, routeCode: normalizeLanguageCode(routeCode) };
  }

  return { page: PAGE_HOME, routeCode: "" };
}

function getPathForPage(page) {
  if (page === PAGE_REDCARDS) return "/redcards";
  if (page === PAGE_BUILDER) return "/builder";
  return "/";
}

function getPathForRedcards(code) {
  const normalizedCode = normalizeLanguageCode(code);
  return normalizedCode ? `/redcards/${normalizedCode}` : "/redcards";
}

function findLanguageByCode(languages, code) {
  const normalizedTarget = normalizeLanguageCode(code);
  if (!normalizedTarget) return null;
  return languages.find((language) => normalizeLanguageCode(language.code) === normalizedTarget) || null;
}

export default function App() {
  const {
    languages,
    config,
    loading: langsLoading,
    error: langsError,
    retry: retryLanguages,
  } = useLanguages();

  const [selected, setSelected] = useState(() => {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) || "";
  });
  const [storedCardsPerPage, setStoredCardsPerPage] = useState(getStoredLayout);
  const [printMethod, setPrintMethod] = useState(getStoredPrintMethod);
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));
  const [builderPrintCard, setBuilderPrintCard] = useState(null);
  const [builderHelpDismissed, setBuilderHelpDismissedState] = useState(getBuilderHelpDismissed);
  const [showBuilderAboutModal, setShowBuilderAboutModal] = useState(false);

  const dismissBuilderHelp = () => {
    setBuilderHelpDismissedState(true);
    setBuilderHelpDismissed();
  };

  const page = route.page;
  const routeCode = route.routeCode;

  useEffect(() => {
    const onPopState = () => {
      setRoute(parseRoute(window.location.pathname));
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const backendRenderMode = useMemo(() => {
    const modes = Array.isArray(config?.render_modes) ? config.render_modes : [];
    return modes.includes("fold") ? "fold" : "legacy";
  }, [config]);

  const backendLayoutOptions = useMemo(() => {
    const isFold = backendRenderMode === "fold";
    const configuredLayouts = isFold ? config?.fold_layouts : config?.valid_layouts;
    const fallbackLayouts = isFold ? BACKEND_FOLD_FALLBACK_LAYOUTS : BACKEND_LEGACY_FALLBACK_LAYOUTS;
    const labels = isFold ? BACKEND_FOLD_LAYOUT_LABELS : BACKEND_LEGACY_LAYOUT_LABELS;

    const source = Array.isArray(configuredLayouts) && configuredLayouts.length > 0
      ? configuredLayouts
      : fallbackLayouts;

    return source.map((count) => ({
      value: count,
      label: labels[count] || `${count} cards`,
    }));
  }, [backendRenderMode, config]);

  const backendLayoutValues = useMemo(
    () => backendLayoutOptions.map((opt) => opt.value),
    [backendLayoutOptions]
  );

  const defaultBackendLayout = useMemo(() => {
    const configured = backendRenderMode === "fold"
      ? Number(config?.default_fold_cards_per_page)
      : Number(config?.default_cards_per_page);
    if (Number.isInteger(configured) && backendLayoutValues.includes(configured)) {
      return configured;
    }
    const fallbackLayouts = backendRenderMode === "fold"
      ? BACKEND_FOLD_FALLBACK_LAYOUTS
      : BACKEND_LEGACY_FALLBACK_LAYOUTS;
    return backendLayoutValues[0] ?? fallbackLayouts[0];
  }, [backendRenderMode, config, backendLayoutValues]);

  const activeLayoutOptions = useMemo(
    () => (printMethod === "browser" ? BROWSER_LAYOUT_OPTIONS : backendLayoutOptions),
    [printMethod, backendLayoutOptions]
  );

  const activeLayoutValues = useMemo(
    () => activeLayoutOptions.map((opt) => opt.value),
    [activeLayoutOptions]
  );

  const defaultLayoutForMethod = printMethod === "browser"
    ? BROWSER_LAYOUT_OPTIONS[0].value
    : defaultBackendLayout;

  const effectiveCardsPerPage = useMemo(() => {
    if (storedCardsPerPage !== null && activeLayoutValues.includes(storedCardsPerPage)) {
      return storedCardsPerPage;
    }
    return defaultLayoutForMethod;
  }, [storedCardsPerPage, activeLayoutValues, defaultLayoutForMethod]);

  useEffect(() => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, String(effectiveCardsPerPage));
  }, [effectiveCardsPerPage]);

  const sorted = useMemo(() => {
    return [...languages].sort((a, b) => a.name.localeCompare(b.name));
  }, [languages]);

  const routeLanguage = useMemo(
    () => findLanguageByCode(languages, routeCode),
    [languages, routeCode]
  );

  const selectedLanguageFromStorage = useMemo(
    () => findLanguageByCode(languages, selected),
    [languages, selected]
  );

  const routeHasCode = page === PAGE_REDCARDS && Boolean(routeCode);
  const invalidRouteCode = routeHasCode && !langsLoading && !routeLanguage;

  const effectiveSelected = useMemo(() => {
    if (page === PAGE_REDCARDS && routeHasCode) {
      if (langsLoading) return "";
      return routeLanguage?.code || "";
    }

    if (!selected) return "";
    if (langsLoading) return selected;
    return selectedLanguageFromStorage?.code || "";
  }, [langsLoading, page, routeHasCode, routeLanguage, selected, selectedLanguageFromStorage]);

  useEffect(() => {
    if (effectiveSelected) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, effectiveSelected);
    } else {
      localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    }
  }, [effectiveSelected]);

  useEffect(() => {
    localStorage.setItem(PRINT_METHOD_STORAGE_KEY, printMethod);
  }, [printMethod]);

  const { card, loading: cardLoading, error: cardError } = useCard(effectiveSelected);

  const selectedLanguage = useMemo(() => {
    return findLanguageByCode(languages, effectiveSelected);
  }, [effectiveSelected, languages]);

  const backendDownloadDisabled = (
    !effectiveSelected ||
    !selectedLanguage ||
    !selectedLanguage.fontSupported
  );

  const backendDisabledReason = !effectiveSelected
    ? "Select a language first"
    : !selectedLanguage
      ? "Selected language is no longer available"
      : !selectedLanguage?.fontSupported
        ? "This language currently has no font support for PDF rendering"
        : "";

  const recommendedMethod = selectedLanguage && !selectedLanguage.fontSupported
    ? "browser"
    : "backend";

  const recommendationMessage = recommendedMethod === "backend"
    ? "Recommended now: Backend PDF for stable, cross-printer output."
    : "Recommended now: Browser Print because backend PDF font support is limited for this language.";

  const methodDescription = printMethod === "backend"
    ? backendRenderMode === "fold"
      ? "Backend PDF uses official fold layout (2 columns front|back)."
      : "Use when accuracy and printer-to-printer consistency matter most."
    : "Browser print uses fixed 2-column fold layout (4x2 minimum), closer to official card sheets. Turn off browser headers/footers before printing.";

  const pageSizeLabel = (config?.page_size || "letter").toUpperCase();
  const error = langsError || cardError;

  const redcardsBrowserPrintReady = Boolean(card) && !cardLoading && !cardError;
  const builderBrowserPrintReady = Boolean(builderPrintCard);
  const browserPrintCard = page === PAGE_BUILDER ? builderPrintCard : card;
  const normalizedFront = useMemo(
    () => normalizeFront(browserPrintCard?.front),
    [browserPrintCard]
  );
  const browserLayout = useMemo(() => {
    if (page === PAGE_BUILDER) {
      return {
        columns: 2,
        rows: 4,
      };
    }
    return {
      columns: 2,
      rows: Math.max(4, Math.ceil(effectiveCardsPerPage / 2)),
    };
  }, [effectiveCardsPerPage, page]);
  const browserPageClass = (config?.page_size || "letter").toLowerCase() === "a4"
    ? "print-sheet-a4"
    : "print-sheet-letter";
  const browserPrintDirection = browserPrintCard?.rtl ? "rtl" : "ltr";
  const showRedcardsBrowserPrintSheet = (
    page === PAGE_REDCARDS &&
    printMethod === "browser" &&
    redcardsBrowserPrintReady
  );
  const showBuilderBrowserPrintSheet = page === PAGE_BUILDER && builderBrowserPrintReady;
  const showBrowserPrintSheet = showRedcardsBrowserPrintSheet || showBuilderBrowserPrintSheet;

  const handleBrowserPrint = () => {
    window.print();
  };

  const browserPrintButtonClass = [
    "pdf-download-button",
    !redcardsBrowserPrintReady ? "is-disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const navigateTo = (nextPage, options = {}) => {
    const nextPath = nextPage === PAGE_REDCARDS
      ? getPathForRedcards(options.code)
      : getPathForPage(nextPage);

    if (normalizePathname(window.location.pathname) === normalizePathname(nextPath)) {
      setRoute(parseRoute(nextPath));
      return;
    }

    window.history.pushState({}, "", nextPath);
    setRoute(parseRoute(nextPath));
  };

  const handleLanguageChange = (nextCode) => {
    setSelected(nextCode);

    if (page !== PAGE_REDCARDS) return;
    if (!nextCode) {
      navigateTo(PAGE_REDCARDS);
      return;
    }

    navigateTo(PAGE_REDCARDS, { code: nextCode });
  };

  return (
    <div className="app-shell">
      <div className="no-print">
        <div className="app-header">
          <h1 className="app-title">
            <span className="app-title-accent">RedCard</span>API
            <span className="app-title-sub">Know Your Rights</span>
          </h1>
          <div className="app-header-right">
            <nav className="page-nav" aria-label="App pages">
              <button
                type="button"
                className={`page-nav-button ${page === PAGE_HOME ? "is-active" : ""}`}
                onClick={() => navigateTo(PAGE_HOME)}
              >
                Home
              </button>
              <button
                type="button"
                className={`page-nav-button ${page === PAGE_REDCARDS ? "is-active" : ""}`}
                onClick={() => navigateTo(PAGE_REDCARDS)}
              >
                Red Cards
              </button>
              <button
                type="button"
                className={`page-nav-button ${page === PAGE_BUILDER ? "is-active" : ""}`}
                onClick={() => navigateTo(PAGE_BUILDER)}
              >
                Build a Red Card
              </button>
            </nav>
            <ThemeToggle />
          </div>
        </div>
        <p className="app-subtitle">
          {page === PAGE_HOME
            ? "Know your rights in your language. Print-ready cards for real-world moments."
            : page === PAGE_REDCARDS
              ? "One interface, two print engines: browser print for visual preview and backend PDF for consistency."
              : "Build a Red Card translation payload from named statements without writing JSON by hand."}
        </p>

        {page === PAGE_BUILDER && !builderHelpDismissed && (
          <div className="app-builder-help" role="region" aria-label="How to use this builder">
            <p className="app-builder-help-text">
              Fill in language details and statements, then use the live preview and browser print or export JSON for review workflows.
            </p>
            <div className="app-builder-help-actions">
              <button type="button" className="app-builder-help-dismiss" onClick={dismissBuilderHelp}>
                Got it
              </button>
              <button
                type="button"
                className="app-builder-info-button"
                onClick={() => setShowBuilderAboutModal(true)}
              >
                About this tool
              </button>
            </div>
          </div>
        )}

        {page === PAGE_BUILDER && showBuilderAboutModal && (
          <div
            className="app-builder-about-backdrop"
            role="presentation"
            onClick={() => setShowBuilderAboutModal(false)}
          >
            <div
              className="app-builder-about-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Builder usage and future implementation details"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="app-builder-about-modal-inner">
                <div className="app-builder-about-modal-head">
                  <h3>How To Use This Builder</h3>
                  <button
                    type="button"
                    className="app-builder-about-modal-close"
                    onClick={() => setShowBuilderAboutModal(false)}
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </div>
                <p>
                  Fill in language details and statements, then use the live preview and browser print or export JSON for review workflows.
                </p>
                <h4>In Progress (Future Scope)</h4>
                <ul>
                  <li>Backend submission flow for translation review and approval.</li>
                  <li>Machine translation provider integration through adapter contracts.</li>
                  <li>Duplicate-check against stored translations before submission.</li>
                  <li>Optional caching layer for translation suggestions.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {page === PAGE_HOME && (
          <div className="animate-in">
            <HeroLanding
              onGoRedcards={() => navigateTo(PAGE_REDCARDS)}
              onGoBuilder={() => navigateTo(PAGE_BUILDER)}
            />
          </div>
        )}

        {page === PAGE_REDCARDS && error && (
          <div className="app-error-banner">
            <span className="app-error-text">{error}</span>
            {langsError && (
              <button onClick={retryLanguages}>Retry</button>
            )}
          </div>
        )}

        {page === PAGE_REDCARDS && invalidRouteCode && (
          <div className="app-error-banner">
            <span className="app-error-text">
              Language code `{routeCode}` is not available. Choose a supported language below.
            </span>
            <button type="button" onClick={() => navigateTo(PAGE_REDCARDS)}>
              Choose a language
            </button>
          </div>
        )}

        {page === PAGE_REDCARDS && langsLoading && <LoadingMessage message="Loading languages..." />}

        {page === PAGE_REDCARDS && !langsLoading && !langsError && (
          <>
            <div className="app-controls">
              <LanguagePicker
                languages={sorted}
                value={effectiveSelected}
                onChange={handleLanguageChange}
              />
              <LayoutPicker
                value={effectiveCardsPerPage}
                onChange={setStoredCardsPerPage}
                options={activeLayoutOptions}
              />
            </div>

            <div className="print-meta-row">
              <aside className="print-panel app-print-panel" aria-label="Print instructions">
                <h2 className="print-panel-title">Print Instructions</h2>
                <ul className="print-panel-list">
                  <li>Paper: {pageSizeLabel}, portrait orientation.</li>
                  <li>Scale: Actual size (100%), no fit-to-page.</li>
                  <li>Browser print: Turn OFF headers and footers (removes URL/date and prevents overflow).</li>
                  <li>Margins: Default or minimum. Avoid oversized custom margins.</li>
                  <li>Duplex: Print front and back on the same sheet.</li>
                  <li>If backs are upside down, switch flip edge setting.</li>
                  <li>Cut dotted borders and fold on dashed guides.</li>
                </ul>
              </aside>

              <section className="method-panel" aria-label="Print method settings">
                <label htmlFor="print-method-select" className="method-label">Print method</label>
                <select
                  id="print-method-select"
                  value={printMethod}
                  onChange={(event) => setPrintMethod(event.target.value === "browser" ? "browser" : "backend")}
                >
                  <option value="backend">Backend PDF - Best consistency</option>
                  <option value="browser">Browser Print - Official 2-column format</option>
                </select>
                <div className="method-note">{methodDescription}</div>
                <div className="method-action-row">
                  <label className="method-label">Action</label>
                  {printMethod === "browser" ? (
                    <>
                      <button
                        type="button"
                        className={browserPrintButtonClass}
                        onClick={handleBrowserPrint}
                        disabled={!redcardsBrowserPrintReady}
                      >
                        Print From Browser
                      </button>
                      <p className="browser-print-tip">
                        Before printing: turn off Headers and footers, set Scale to 100%, and keep portrait layout.
                      </p>
                    </>
                  ) : (
                    <PdfDownloadButton
                      code={effectiveSelected}
                      cardsPerPage={effectiveCardsPerPage}
                      mode={backendRenderMode}
                      disabled={backendDownloadDisabled}
                      disabledReason={backendDisabledReason}
                    />
                  )}
                </div>
                <div className="method-recommend-row">
                  <span className="method-recommend-text">{recommendationMessage}</span>
                  {printMethod !== recommendedMethod && (
                    <button
                      type="button"
                      className="method-recommend-button"
                      onClick={() => setPrintMethod(recommendedMethod)}
                    >
                      Use Recommended
                    </button>
                  )}
                </div>
              </section>
            </div>

            {selectedLanguage && !selectedLanguage.fontSupported && (
              <FontWarning language={selectedLanguage} />
            )}

            <div className="preview-wrap animate-in">
              <CardPreview card={card} loading={cardLoading} />
            </div>
          </>
        )}

        {page === PAGE_BUILDER && (
          <div className="builder-wrap animate-in">
            <TranslationPayloadBuilder
              onPrintableCardChange={setBuilderPrintCard}
              onPrintRequest={handleBrowserPrint}
              onOpenAboutModal={() => setShowBuilderAboutModal(true)}
            />
          </div>
        )}
      </div>

      <footer className="app-footer no-print">
        <div className="app-footer-inner">
          <p className="app-footer-disclaimer">
            This tool provides general information about constitutional rights. It is not legal advice. Consult an attorney for guidance specific to your situation.
          </p>
          <div className="app-footer-links">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </footer>

      {showBrowserPrintSheet && browserPrintCard && (
        <section className="browser-print-preview">
          <div className="no-print browser-print-preview-head">
            <h2>Browser Print Sheet Preview</h2>
            <p>
              {page === PAGE_BUILDER
                ? "This sheet is generated directly from your builder form values."
                : "This layout follows the official redcard fold format (front + back side-by-side)."}
            </p>
            <p className="browser-print-preview-note">
              If page 1 shows only instructions, disable print headers/footers in the print dialog.
            </p>
          </div>
          <div className={`print-sheet ${browserPageClass}`}>
            <div className="print-sheet-top">
              <div className="print-sheet-top-copy">
                <p>
                  To print at home, use heavy weight paper or card stock. Cut out the cards
                  along the dotted lines.
                </p>
                <p>
                  If you cannot print both sides, fold on the center line to make a two-sided card.
                </p>
                <p>
                  <strong>{browserPrintCard.name}</strong> ({browserPrintCard.code}) - {browserLayout.rows} cards per sheet ({browserLayout.rows} front + {browserLayout.rows} back)
                </p>
              </div>
              <div className="print-sheet-top-guides">
                <div className="print-guide-box">
                  <span className="print-guide-label">Cut</span>
                </div>
                <div className="print-guide-box print-guide-fold">
                  <span className="print-guide-label">Fold</span>
                </div>
              </div>
            </div>
            <div className="print-sheet-grid-official">
              {Array.from({ length: browserLayout.rows }).map((_, rowIdx) => (
                <div key={`print-row-${rowIdx}`} className="print-sheet-row">
                  <article
                    className="print-face-card print-face-front"
                    dir={browserPrintDirection}
                    lang={browserPrintCard.code}
                  >
                    <h2>{normalizedFront.header || "Know your rights:"}</h2>
                    <ul>
                      {normalizedFront.bullets.map((bullet, bulletIdx) => (
                        <li key={`f-${rowIdx}-${bulletIdx}`}>{bullet}</li>
                      ))}
                    </ul>
                  </article>
                  <article
                    className="print-face-card print-face-back"
                    dir="ltr"
                    lang="en"
                  >
                    {DEFAULT_BACK_PARAGRAPHS.map((paragraph, paragraphIdx) => (
                      <p
                        key={`b-${rowIdx}-${paragraphIdx}`}
                        className={paragraphIdx === DEFAULT_BACK_PARAGRAPHS.length - 1 ? "is-italic" : ""}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
