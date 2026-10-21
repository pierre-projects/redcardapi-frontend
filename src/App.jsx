import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useLanguages } from "./hooks/useLanguages";
import LanguagePicker from "./components/LanguagePicker";
import LayoutPicker from "./components/LayoutPicker";
import CardPreview from "./components/CardPreview";
import PdfDownloadButton from "./components/PdfDownloadButton";
import FontWarning from "./components/FontWarning";
import ThemeToggle from "./components/ThemeToggle";
import HeroLanding from "./components/HeroLanding";
import QuickCardAccess from "./components/QuickCardAccess";
import ShowCard from "./components/ShowCard";
import { LoadingMessage } from "./components/LoadingSpinner";
import { BACK_CONTENT, LANGUAGES, getCard } from "./data/cards";
import { normalizeLanguageCode } from "./data/normalize";
import { getBrowserLanguageTags, matchLanguageTag, matchPreferredLanguage } from "./lib/languageMatch";
import { safeGet, safeRemove, safeSet } from "./lib/storage";
import "./App.css";

// The builder is an authoring tool; keep it out of the bundle card users load.
const TranslationPayloadBuilder = lazy(() => import("./components/TranslationPayloadBuilder"));

const LANGUAGE_STORAGE_KEY = "selected-language";
const LAYOUT_STORAGE_KEY = "selected-cards-per-page";
const PRINT_METHOD_STORAGE_KEY = "selected-print-method";
const BUILDER_HELP_DISMISSED_KEY = "redcard-builder-help-dismissed";
const PAGE_HOME = "home";
const PAGE_CARD = "card";
const PAGE_REDCARDS = "redcards";
const PAGE_BUILDER = "builder";
const AVAILABLE_CODES = new Set(LANGUAGES.map((language) => language.code));

const BACKEND_GRID_FALLBACK_LAYOUTS = [4, 6, 8, 12];
const BACKEND_FOLD_FALLBACK_LAYOUTS = [4, 5, 6];
const BACKEND_GRID_LAYOUT_LABELS = {
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

function getStoredLayout() {
  const stored = safeGet(LAYOUT_STORAGE_KEY);
  if (!stored) return null;
  const parsed = Number(stored);
  return Number.isInteger(parsed) ? parsed : null;
}

function getStoredPrintMethod() {
  return safeGet(PRINT_METHOD_STORAGE_KEY) === "browser" ? "browser" : "backend";
}

function getStoredLanguage() {
  const stored = safeGet(LANGUAGE_STORAGE_KEY, "");
  return AVAILABLE_CODES.has(normalizeLanguageCode(stored)) ? normalizeLanguageCode(stored) : "";
}

function normalizePathname(pathname) {
  const normalized = String(pathname || "/").replace(/\/+$/, "");
  return normalized || "/";
}

function decodeSegment(segment) {
  try {
    return decodeURIComponent(segment || "");
  } catch {
    return segment || "";
  }
}

/**
 * Route codes accept any reasonable tag ("es-MX", "zh", "zh_TW") and resolve
 * to a card code; `requestedCode` keeps what was asked for so an unknown
 * code can be reported.
 */
function resolveRouteCode(segment) {
  const requestedCode = normalizeLanguageCode(decodeSegment(segment));
  return {
    requestedCode,
    routeCode: matchLanguageTag(requestedCode, AVAILABLE_CODES) || "",
  };
}

function parseRoute(pathname) {
  const normalizedPath = normalizePathname(pathname);

  if (normalizedPath === "/builder") {
    return { page: PAGE_BUILDER, routeCode: "", requestedCode: "" };
  }

  if (normalizedPath === "/redcards") {
    return { page: PAGE_REDCARDS, routeCode: "", requestedCode: "" };
  }

  if (normalizedPath.startsWith("/redcards/")) {
    return { page: PAGE_REDCARDS, ...resolveRouteCode(normalizedPath.slice("/redcards/".length)) };
  }

  if (normalizedPath.startsWith("/card/")) {
    const resolved = resolveRouteCode(normalizedPath.slice("/card/".length));
    // Unknown card codes fall back to the home page, which reports them.
    return resolved.routeCode
      ? { page: PAGE_CARD, ...resolved }
      : { page: PAGE_HOME, ...resolved };
  }

  return { page: PAGE_HOME, routeCode: "", requestedCode: "" };
}

function getPath(page, code = "") {
  if (page === PAGE_CARD) return `/card/${code}`;
  if (page === PAGE_REDCARDS) return code ? `/redcards/${code}` : "/redcards";
  if (page === PAGE_BUILDER) return "/builder";
  return "/";
}

export default function App() {
  const {
    languages,
    config,
    pdfStatus,
    pdfError,
    retryPdfService,
  } = useLanguages();

  const [selected, setSelected] = useState(getStoredLanguage);
  const [storedCardsPerPage, setStoredCardsPerPage] = useState(getStoredLayout);
  const [printMethod, setPrintMethod] = useState(getStoredPrintMethod);
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));
  const [builderPrintCard, setBuilderPrintCard] = useState(null);
  const [builderHelpDismissed, setBuilderHelpDismissedState] = useState(
    () => safeGet(BUILDER_HELP_DISMISSED_KEY) === "true"
  );
  const [showBuilderAboutModal, setShowBuilderAboutModal] = useState(false);
  const modalCloseRef = useRef(null);

  const dismissBuilderHelp = () => {
    setBuilderHelpDismissedState(true);
    safeSet(BUILDER_HELP_DISMISSED_KEY, "true");
  };

  const { page, routeCode, requestedCode } = route;

  useEffect(() => {
    const onPopState = () => {
      setRoute(parseRoute(window.location.pathname));
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Rewrite alias URLs (/card/es-MX → /card/es) so shared links are canonical.
  useEffect(() => {
    if (!routeCode || routeCode === requestedCode) return;
    if (page === PAGE_CARD || page === PAGE_REDCARDS) {
      window.history.replaceState({}, "", getPath(page, routeCode));
    }
  }, [page, routeCode, requestedCode]);

  // Viewing a card remembers its language for the one-tap button on home.
  useEffect(() => {
    if (page === PAGE_CARD && routeCode) safeSet(LANGUAGE_STORAGE_KEY, routeCode);
  }, [page, routeCode]);

  useEffect(() => {
    if (!showBuilderAboutModal) return undefined;
    modalCloseRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") setShowBuilderAboutModal(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showBuilderAboutModal]);

  const backendRenderMode = useMemo(() => {
    const modes = Array.isArray(config?.render_modes) ? config.render_modes : [];
    return modes.includes("fold") ? "fold" : "grid";
  }, [config]);

  const backendLayoutOptions = useMemo(() => {
    const isFold = backendRenderMode === "fold";
    const configuredLayouts = isFold ? config?.fold_layouts : config?.valid_layouts;
    const fallbackLayouts = isFold ? BACKEND_FOLD_FALLBACK_LAYOUTS : BACKEND_GRID_FALLBACK_LAYOUTS;
    const labels = isFold ? BACKEND_FOLD_LAYOUT_LABELS : BACKEND_GRID_LAYOUT_LABELS;

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
      : BACKEND_GRID_FALLBACK_LAYOUTS;
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
    safeSet(LAYOUT_STORAGE_KEY, String(effectiveCardsPerPage));
  }, [effectiveCardsPerPage]);

  useEffect(() => {
    safeSet(PRINT_METHOD_STORAGE_KEY, printMethod);
  }, [printMethod]);

  const invalidRouteCode = Boolean(requestedCode) && !routeCode;

  const effectiveSelected = routeCode || (page === PAGE_REDCARDS && requestedCode ? "" : selected);

  const card = useMemo(() => getCard(effectiveSelected), [effectiveSelected]);

  const selectedLanguage = useMemo(
    () => languages.find((language) => language.code === effectiveSelected) || null,
    [effectiveSelected, languages]
  );

  // One-tap suggestion on home: remembered language first, then the browser's.
  const suggestedCode = selected
    || matchPreferredLanguage(getBrowserLanguageTags(), AVAILABLE_CODES);
  const suggestedLanguage = suggestedCode ? getCard(suggestedCode) : null;

  const pdfServiceReady = pdfStatus === "ready";
  const fontSupported = selectedLanguage?.fontSupported !== false;

  const backendDownloadDisabled = (
    !effectiveSelected ||
    !selectedLanguage ||
    !pdfServiceReady ||
    !fontSupported
  );

  const backendDisabledReason = !effectiveSelected
    ? "Select a language first"
    : pdfStatus === "loading"
      ? "Connecting to the PDF service..."
      : !pdfServiceReady
        ? "PDF service is unavailable right now. Browser Print still works."
        : !fontSupported
          ? "PDF download is not available for this language yet. Use Browser Print."
          : "";

  const recommendedMethod = (pdfStatus === "unavailable" || (selectedLanguage && !fontSupported))
    ? "browser"
    : "backend";

  const recommendationMessage = recommendedMethod === "backend"
    ? "Recommended now: Backend PDF for stable, cross-printer output."
    : "Recommended now: Browser Print, which works for every language without the PDF service.";

  const methodDescription = printMethod === "backend"
    ? backendRenderMode === "fold"
      ? "Backend PDF uses official fold layout (2 columns front|back)."
      : "Use when accuracy and printer-to-printer consistency matter most."
    : "Browser print uses fixed 2-column fold layout (4x2 minimum), closer to official card sheets. Turn off browser headers/footers before printing.";

  const pageSizeLabel = (config?.page_size || "letter").toUpperCase();

  const redcardsBrowserPrintReady = Boolean(card);
  const builderBrowserPrintReady = Boolean(builderPrintCard);
  const browserPrintCard = page === PAGE_BUILDER ? builderPrintCard : card;
  const browserPrintFront = useMemo(() => {
    const front = browserPrintCard?.front || {};
    return {
      header: front.header || "",
      bullets: (front.bullets || [])
        .map((item) => (typeof item === "string" ? item : item?.text || ""))
        .map((text) => text.trim())
        .filter(Boolean),
    };
  }, [browserPrintCard]);
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
  const backParagraphs = [...BACK_CONTENT.statements, BACK_CONTENT.footer].filter(Boolean);

  const handleBrowserPrint = () => {
    window.print();
  };

  const browserPrintButtonClass = [
    "pdf-download-button",
    !redcardsBrowserPrintReady ? "is-disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const navigateTo = (nextPage, code = "") => {
    const nextPath = getPath(nextPage, code);

    if (normalizePathname(window.location.pathname) !== normalizePathname(nextPath)) {
      window.history.pushState({}, "", nextPath);
    }
    setRoute(parseRoute(nextPath));
    window.scrollTo(0, 0);
  };

  const rememberLanguage = (code) => {
    setSelected(code);
    if (code) {
      safeSet(LANGUAGE_STORAGE_KEY, code);
    } else {
      safeRemove(LANGUAGE_STORAGE_KEY);
    }
  };

  const openCard = (code) => {
    rememberLanguage(code);
    navigateTo(PAGE_CARD, code);
  };

  const handleLanguageChange = (nextCode) => {
    rememberLanguage(nextCode);
    if (page === PAGE_REDCARDS) navigateTo(PAGE_REDCARDS, nextCode);
  };

  if (page === PAGE_CARD && card) {
    return (
      <ShowCard
        card={card}
        back={BACK_CONTENT}
        onAllLanguages={() => {
          rememberLanguage(card.code);
          navigateTo(PAGE_HOME);
        }}
        onPrint={() => navigateTo(PAGE_REDCARDS, card.code)}
      />
    );
  }

  return (
    <div className="app-shell">
      <div className="no-print">
        <header className="app-header">
          <h1 className="app-title">
            <span className="app-title-accent">RedCard</span>API
            <span className="app-title-sub">Know Your Rights</span>
          </h1>
          <div className="app-header-right">
            <nav className="page-nav" aria-label="App pages">
              <button
                type="button"
                className={`page-nav-button ${page === PAGE_HOME ? "is-active" : ""}`}
                aria-current={page === PAGE_HOME ? "page" : undefined}
                onClick={() => navigateTo(PAGE_HOME)}
              >
                Cards
              </button>
              <button
                type="button"
                className={`page-nav-button ${page === PAGE_REDCARDS ? "is-active" : ""}`}
                aria-current={page === PAGE_REDCARDS ? "page" : undefined}
                onClick={() => navigateTo(PAGE_REDCARDS, selected)}
              >
                Print
              </button>
              <button
                type="button"
                className={`page-nav-button ${page === PAGE_BUILDER ? "is-active" : ""}`}
                aria-current={page === PAGE_BUILDER ? "page" : undefined}
                onClick={() => navigateTo(PAGE_BUILDER)}
              >
                Build a Red Card
              </button>
            </nav>
            <ThemeToggle />
          </div>
        </header>

        {page !== PAGE_HOME && (
          <p className="app-subtitle">
            {page === PAGE_REDCARDS
              ? "Print paper cards: browser print works for every language; backend PDF gives the most consistent output."
              : "Build a Red Card translation payload from named statements without writing JSON by hand."}
          </p>
        )}

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
              aria-labelledby="builder-about-title"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                // The close button is the only focusable element: keep focus in the dialog.
                if (e.key === "Tab") {
                  e.preventDefault();
                  modalCloseRef.current?.focus();
                }
              }}
            >
              <div className="app-builder-about-modal-inner">
                <div className="app-builder-about-modal-head">
                  <h3 id="builder-about-title">How To Use This Builder</h3>
                  <button
                    ref={modalCloseRef}
                    type="button"
                    className="app-builder-about-modal-close"
                    onClick={() => setShowBuilderAboutModal(false)}
                    aria-label="Close"
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
          <main className="animate-in">
            {invalidRouteCode && (
              <div className="app-error-banner" role="alert">
                <span className="app-error-text">
                  No card for “{requestedCode}”. Choose your language below.
                </span>
              </div>
            )}
            <QuickCardAccess
              languages={LANGUAGES}
              suggested={suggestedLanguage}
              onOpenCard={openCard}
              onForget={selected ? () => rememberLanguage("") : null}
            />
            <HeroLanding
              languageCount={LANGUAGES.length}
              onGoRedcards={() => navigateTo(PAGE_REDCARDS, selected)}
              onGoBuilder={() => navigateTo(PAGE_BUILDER)}
            />
          </main>
        )}

        {page === PAGE_REDCARDS && (
          <main>
            {invalidRouteCode && (
              <div className="app-error-banner" role="alert">
                <span className="app-error-text">
                  Language code “{requestedCode}” is not available. Choose a supported language below.
                </span>
                <button type="button" onClick={() => navigateTo(PAGE_REDCARDS)}>
                  Choose a language
                </button>
              </div>
            )}

            {pdfStatus === "unavailable" && (
              <div className="app-error-banner" role="alert">
                <span className="app-error-text">
                  PDF service unavailable ({pdfError}). Cards and Browser Print still work.
                </span>
                <button type="button" onClick={retryPdfService}>Retry</button>
              </div>
            )}

            <div className="app-controls">
              <LanguagePicker
                languages={languages}
                value={effectiveSelected}
                onChange={handleLanguageChange}
              />
              <LayoutPicker
                value={effectiveCardsPerPage}
                onChange={setStoredCardsPerPage}
                options={activeLayoutOptions}
              />
            </div>

            <div className="preview-wrap animate-in">
              <CardPreview
                key={card?.code || "none"}
                card={card}
                back={BACK_CONTENT}
                onShowCard={card ? () => openCard(card.code) : null}
              />
            </div>

            {selectedLanguage && pdfServiceReady && !fontSupported && (
              <FontWarning language={selectedLanguage} />
            )}

            <div className="print-meta-row">
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
                {pdfStatus === "loading" && printMethod === "backend" && (
                  <LoadingMessage message="Connecting to the PDF service..." />
                )}
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

              <details className="print-panel app-print-panel">
                <summary className="print-panel-title">Print Instructions</summary>
                <ul className="print-panel-list">
                  <li>Paper: {pageSizeLabel}, portrait orientation.</li>
                  <li>Scale: Actual size (100%), no fit-to-page.</li>
                  <li>Browser print: Turn OFF headers and footers (removes URL/date and prevents overflow).</li>
                  <li>Margins: Default or minimum. Avoid oversized custom margins.</li>
                  <li>Duplex: Print front and back on the same sheet.</li>
                  <li>If backs are upside down, switch flip edge setting.</li>
                  <li>Cut dotted borders and fold on dashed guides.</li>
                </ul>
              </details>
            </div>
          </main>
        )}

        {page === PAGE_BUILDER && (
          <main className="builder-wrap animate-in">
            <Suspense fallback={<LoadingMessage message="Loading builder..." />}>
              <TranslationPayloadBuilder
                onPrintableCardChange={setBuilderPrintCard}
                onPrintRequest={handleBrowserPrint}
                onOpenAboutModal={() => setShowBuilderAboutModal(true)}
              />
            </Suspense>
          </main>
        )}
      </div>

      <footer className="app-footer no-print">
        <div className="app-footer-inner">
          <p className="app-footer-disclaimer">
            This tool provides general information about constitutional rights. It is not legal advice. Consult an attorney for guidance specific to your situation.
          </p>
          <p className="app-footer-disclaimer">
            No tracking. Your chosen language is remembered only on this device.
          </p>
          <div className="app-footer-links">
            <a href="https://github.com/pierre-projects/redcardapi-frontend" target="_blank" rel="noopener noreferrer">GitHub</a>
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
                    <h2>{browserPrintFront.header || "Know your rights:"}</h2>
                    <ul>
                      {browserPrintFront.bullets.map((bullet, bulletIdx) => (
                        <li key={`f-${rowIdx}-${bulletIdx}`}>{bullet}</li>
                      ))}
                    </ul>
                  </article>
                  <article
                    className="print-face-card print-face-back"
                    dir="ltr"
                    lang="en"
                  >
                    {backParagraphs.map((paragraph, paragraphIdx) => (
                      <p
                        key={`b-${rowIdx}-${paragraphIdx}`}
                        className={paragraphIdx === backParagraphs.length - 1 ? "is-italic" : ""}
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
