import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLanguages } from "./hooks/useLanguages";
import LanguagePicker from "./components/LanguagePicker";
import LayoutPicker from "./components/LayoutPicker";
import CardPreview from "./components/CardPreview";
import PdfDownloadButton from "./components/PdfDownloadButton";
import { PDF_API_ENABLED } from "./api";
import PrintColorPicker from "./components/PrintColorPicker";
import FontWarning from "./components/FontWarning";
import ThemeToggle from "./components/ThemeToggle";
import AboutSection from "./components/AboutSection";
import Icon from "./components/Icon";
import QuickCardAccess from "./components/QuickCardAccess";
import ShowCard from "./components/ShowCard";
import { LoadingMessage } from "./components/LoadingSpinner";
import { BACK_CONTENT, LANGUAGES, getCard } from "./data/cards";
import { normalizeLanguageCode } from "./data/normalize";
import { getBrowserLanguageTags, matchLanguageTag, matchPreferredLanguage } from "./lib/languageMatch";
import { safeGet, safeRemove, safeSet } from "./lib/storage";
import { DEFAULT_CARD_COLOR, normalizeHex, textColorFor } from "./lib/color";
import { fitScale } from "./lib/printFit";
import { machineNotice } from "./lib/translationSource";
import "./App.css";
import "./print.css";

// The builder is an authoring tool; keep it out of the bundle card users load.
const TranslationPayloadBuilder = lazy(() => import("./components/TranslationPayloadBuilder"));

const LANGUAGE_STORAGE_KEY = "selected-language";
const LAYOUT_STORAGE_KEY = "selected-cards-per-page";
const PRINT_METHOD_STORAGE_KEY = "selected-print-method";
const PRINT_STYLE_STORAGE_KEY = "selected-print-style";
const PRINT_COLOR_STORAGE_KEY = "selected-print-color";
const PAGE_HOME = "home";
const PAGE_CARD = "card";
const PAGE_REDCARDS = "redcards";
const PAGE_BUILDER = "builder";
const AVAILABLE_CODES = new Set(LANGUAGES.map((language) => language.code));
const PAGE_TITLES = {
  [PAGE_HOME]: "Red Card — Know Your Rights in Your Language",
  [PAGE_REDCARDS]: "Print paper cards — Red Card",
  [PAGE_BUILDER]: "Build a red card — Red Card",
};

const BACKEND_GRID_FALLBACK_LAYOUTS = [4, 6, 8, 12];
const BACKEND_FOLD_FALLBACK_LAYOUTS = [4, 5, 6];
const BACKEND_GRID_LAYOUT_LABELS = {
  4: "4 cards (2 × 2)",
  6: "6 cards (2 × 3)",
  8: "8 cards (2 × 4)",
  12: "12 cards (3 × 4)",
};
const BACKEND_FOLD_LAYOUT_LABELS = {
  4: "4 cards, fold style",
  5: "5 cards, fold style",
  6: "6 cards, fold style",
};
const BROWSER_LAYOUT_OPTIONS = [
  { value: 8, label: "4 cards, fold style" },
  { value: 10, label: "5 cards, fold style" },
  { value: 12, label: "6 cards, fold style" },
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

function getStoredPrintStyle() {
  return safeGet(PRINT_STYLE_STORAGE_KEY) === "color" ? "color" : "stock";
}

function getStoredPrintColor() {
  return normalizeHex(safeGet(PRINT_COLOR_STORAGE_KEY)) || DEFAULT_CARD_COLOR;
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
  const [storedPrintMethod, setPrintMethod] = useState(getStoredPrintMethod);
  // Cards-only builds have no PDF API, so the browser is the only way to print.
  const printMethod = PDF_API_ENABLED ? storedPrintMethod : "browser";
  const [printStyle, setPrintStyle] = useState(getStoredPrintStyle);
  const [printColor, setPrintColor] = useState(getStoredPrintColor);
  const [builderCardsPerPage, setBuilderCardsPerPage] = useState(BROWSER_LAYOUT_OPTIONS[0].value);
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));
  const [builderPrintCard, setBuilderPrintCard] = useState(null);
  const [showBuilderAboutModal, setShowBuilderAboutModal] = useState(false);
  const modalCloseRef = useRef(null);

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
    const opener = document.activeElement;
    modalCloseRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") setShowBuilderAboutModal(false);
      // The close button is the only focusable element: keep focus in the dialog.
      if (event.key === "Tab") {
        event.preventDefault();
        modalCloseRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Return focus to whatever opened the dialog.
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [showBuilderAboutModal]);

  // The card view sets its own title (in the card's language).
  useEffect(() => {
    if (PAGE_TITLES[page]) document.title = PAGE_TITLES[page];
  }, [page]);

  // After in-app navigation, move focus to the new page's heading so screen
  // readers announce it (a full page load would do this on its own).
  const navigatedRef = useRef(false);
  useEffect(() => {
    if (!navigatedRef.current) return;
    navigatedRef.current = false;
    const heading = document.querySelector("main h1");
    if (heading) {
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
  }, [route]);

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

  useEffect(() => {
    safeSet(PRINT_STYLE_STORAGE_KEY, printStyle);
  }, [printStyle]);

  useEffect(() => {
    safeSet(PRINT_COLOR_STORAGE_KEY, printColor);
  }, [printColor]);

  const isColorPrint = printStyle === "color";
  const cardColors = useMemo(
    () => (isColorPrint ? { background: printColor, text: textColorFor(printColor) } : null),
    [isColorPrint, printColor]
  );

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
        rows: builderCardsPerPage / 2,
      };
    }
    return {
      columns: 2,
      rows: Math.max(4, Math.ceil(effectiveCardsPerPage / 2)),
    };
  }, [builderCardsPerPage, effectiveCardsPerPage, page]);
  const browserPrintDirection = browserPrintCard?.rtl ? "rtl" : "ltr";
  const showRedcardsBrowserPrintSheet = (
    page === PAGE_REDCARDS &&
    printMethod === "browser" &&
    redcardsBrowserPrintReady
  );
  const showBuilderBrowserPrintSheet = page === PAGE_BUILDER && builderBrowserPrintReady;
  const showBrowserPrintSheet = showRedcardsBrowserPrintSheet || showBuilderBrowserPrintSheet;
  const backParagraphs = [...BACK_CONTENT.statements, BACK_CONTENT.footer].filter(Boolean);
  const printSheetRef = useRef(null);

  // Shrink each face's text until the first row fits; every row holds the same card.
  useLayoutEffect(() => {
    const sheet = printSheetRef.current;
    if (!sheet) return undefined;
    const fit = () => {
      for (const side of ["front", "back"]) {
        const face = sheet.querySelector(`.print-sheet-row:first-child .print-face-${side}`);
        const property = `--fit-${side}`;
        const scale = fitScale((candidate) => {
          sheet.style.setProperty(property, String(candidate));
          return face.scrollHeight <= face.clientHeight;
        });
        sheet.style.setProperty(property, String(scale));
      }
    };
    fit();
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) fit();
    });
    return () => {
      cancelled = true;
    };
  }, [showBrowserPrintSheet, browserPrintCard, browserLayout.rows]);

  const handleBrowserPrint = () => {
    window.print();
  };

  const navigateTo = (nextPage, code = "") => {
    const nextPath = getPath(nextPage, code);

    if (normalizePathname(window.location.pathname) !== normalizePathname(nextPath)) {
      window.history.pushState({}, "", nextPath);
    }
    navigatedRef.current = true;
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
        printHref={getPath(PAGE_REDCARDS, card.code)}
      />
    );
  }

  const navLink = (targetPage, label, code = "") => (
    <a
      href={getPath(targetPage, code)}
      className="site-nav-link"
      aria-current={page === targetPage ? "page" : undefined}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        navigateTo(targetPage, code);
      }}
    >
      {label}
    </a>
  );

  return (
    <div className="app-shell">
      <a className="skip-link no-print" href="#main">Skip to main content</a>
      <header className="site-header no-print">
        <div className="site-header-inner">
          <a
            href="/"
            className="brand"
            onClick={(event) => {
              event.preventDefault();
              navigateTo(PAGE_HOME);
            }}
          >
            <span className="brand-mark" aria-hidden="true" />
            Red Card
          </a>
          <nav className="site-nav" aria-label="Main">
            {navLink(PAGE_HOME, "Cards")}
            {navLink(PAGE_REDCARDS, "Print", selected)}
            {navLink(PAGE_BUILDER, "Build")}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <div className="no-print">
        {page === PAGE_BUILDER && showBuilderAboutModal && (
          // Clicking the backdrop is a mouse shortcut; Escape and the close button cover keyboards.
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <div
            className="app-builder-about-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowBuilderAboutModal(false);
            }}
          >
            <div
              className="app-builder-about-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="builder-about-title"
            >
              <div className="app-builder-about-modal-head">
                <h2 id="builder-about-title">How to use the builder</h2>
                <button
                  ref={modalCloseRef}
                  type="button"
                  className="button-quiet"
                  onClick={() => setShowBuilderAboutModal(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <p>
                Fill in the language details and statements, check the live preview, then print or
                export the JSON for review.
              </p>
              <h3>Planned</h3>
              <ul>
                <li>Submitting translations for review and approval.</li>
                <li>Machine translation suggestions through provider adapters.</li>
                <li>Checking for duplicates against existing translations.</li>
              </ul>
            </div>
          </div>
        )}

        {page === PAGE_HOME && (
          <main id="main" className="page" tabIndex={-1}>
            {invalidRouteCode && (
              <div className="notice notice-error" role="alert">
                No card for “{requestedCode}”. Choose your language below.
              </div>
            )}
            <QuickCardAccess
              languages={LANGUAGES}
              suggested={suggestedLanguage}
              onOpenCard={openCard}
              onForget={selected ? () => rememberLanguage("") : null}
            />
            <AboutSection
              languageCount={LANGUAGES.length}
              onGoPrint={() => navigateTo(PAGE_REDCARDS, selected)}
            />
          </main>
        )}

        {page === PAGE_REDCARDS && (
          <main id="main" className="page" tabIndex={-1}>
            <div className="page-head">
              <h1>Print paper cards</h1>
              <p>
                {PDF_API_ENABLED
                  ? "Choose a language and layout, then download a PDF or print from this browser."
                  : "Choose a language and layout, then print from this browser."}{" "}
                Cut along the dotted lines and fold each card down the middle.
              </p>
            </div>

            {invalidRouteCode && (
              <div className="notice notice-error" role="alert">
                <span>“{requestedCode}” is not an available language. Choose one below.</span>
              </div>
            )}

            {pdfStatus === "unavailable" && (
              <div className="notice" role="alert">
                <span>PDF downloads are unavailable right now ({pdfError}). Printing from the browser still works.</span>
                <button type="button" onClick={retryPdfService}>Try again</button>
              </div>
            )}

            <div className="print-layout">
              <section className="print-settings" aria-label="Print settings">
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

                {PDF_API_ENABLED && (
                  <fieldset className="field">
                    <legend className="field-label">Output</legend>
                    <label className="choice">
                      <input
                        type="radio"
                        name="print-method"
                        value="backend"
                        checked={printMethod === "backend"}
                        onChange={() => setPrintMethod("backend")}
                      />
                      <span>
                        <strong>PDF file</strong>
                        <span className="choice-hint">Same result on any printer. Fronts and backs side by side for folding.</span>
                      </span>
                    </label>
                    <label className="choice">
                      <input
                        type="radio"
                        name="print-method"
                        value="browser"
                        checked={printMethod === "browser"}
                        onChange={() => setPrintMethod("browser")}
                      />
                      <span>
                        <strong>Print from browser</strong>
                        <span className="choice-hint">Works for every language, even when PDF download is unavailable.</span>
                      </span>
                    </label>
                  </fieldset>
                )}

                <PrintColorPicker
                  style={printStyle}
                  onStyleChange={setPrintStyle}
                  color={printColor}
                  onColorChange={setPrintColor}
                  presets={config?.color_presets}
                />

                {selectedLanguage && pdfServiceReady && !fontSupported && (
                  <FontWarning language={selectedLanguage} />
                )}

                {printMethod === "browser" ? (
                  <div className="print-action">
                    <button
                      type="button"
                      className="button-primary"
                      onClick={handleBrowserPrint}
                      disabled={!redcardsBrowserPrintReady}
                    >
                      <Icon name="printer" />
                      Print
                    </button>
                    <p className="field-hint">
                      In the print dialog, set scale to 100%.
                    </p>
                  </div>
                ) : (
                  <PdfDownloadButton
                    code={effectiveSelected}
                    cardsPerPage={effectiveCardsPerPage}
                    mode={backendRenderMode}
                    color={isColorPrint ? printColor : null}
                    disabled={backendDownloadDisabled}
                    disabledReason={backendDisabledReason}
                  />
                )}

                <details className="disclosure">
                  <summary>Printing tips</summary>
                  <ul>
                    <li>{printMethod === "browser" ? "Letter or A4" : pageSizeLabel} paper, portrait, scale 100% (not “fit to page”).</li>
                    <li>Default or minimum margins.</li>
                    <li>Use heavy paper or card stock if you can.</li>
                    <li>Printing both sides: if the backs come out upside down, switch the flip edge.</li>
                    <li>Cut along the dotted lines and fold on the dashed line.</li>
                  </ul>
                </details>
              </section>

              <section className="print-preview" aria-label="Preview">
                <CardPreview
                  key={card?.code || "none"}
                  card={card}
                  back={BACK_CONTENT}
                  onShowCard={card ? () => openCard(card.code) : null}
                  colors={cardColors}
                />
              </section>
            </div>
          </main>
        )}

        {page === PAGE_BUILDER && (
          <main id="main" className="page" tabIndex={-1}>
            <div className="page-head">
              <h1>Build a red card</h1>
              <p>
                Prepare a new translation from the standard statements without editing JSON by hand.{" "}
                <button type="button" className="link-button" onClick={() => setShowBuilderAboutModal(true)}>
                  How it works
                </button>
              </p>
            </div>
            <Suspense fallback={<LoadingMessage message="Loading builder…" />}>
              <TranslationPayloadBuilder
                onPrintableCardChange={setBuilderPrintCard}
                onPrintRequest={handleBrowserPrint}
                onOpenAboutModal={() => setShowBuilderAboutModal(true)}
                printColors={cardColors}
                printSettings={(
                  <>
                    <LayoutPicker
                      value={builderCardsPerPage}
                      onChange={setBuilderCardsPerPage}
                      options={BROWSER_LAYOUT_OPTIONS}
                    />
                    <PrintColorPicker
                      style={printStyle}
                      onStyleChange={setPrintStyle}
                      color={printColor}
                      onColorChange={setPrintColor}
                      presets={config?.color_presets}
                    />
                  </>
                )}
              />
            </Suspense>
          </main>
        )}
      </div>

      <footer className="site-footer no-print">
        <div className="site-footer-inner">
          <p>
            General information about constitutional rights, not legal advice. For advice about your
            situation, contact an immigration attorney or legal aid organization.
          </p>
          <p>
            Card text from the <a href="https://www.ilrc.org/red-cards" target="_blank" rel="noopener noreferrer">Immigrant Legal Resource Center</a>.
            No tracking; your language choice stays on this device.{" "}
            <a href="https://github.com/pierre-projects/redcardapi-frontend" target="_blank" rel="noopener noreferrer">Source code</a>
          </p>
        </div>
      </footer>

      {showBrowserPrintSheet && browserPrintCard && (
        <section className="browser-print-preview" aria-label="Print sheet">
          <div
            ref={printSheetRef}
            className={`print-sheet${cardColors ? " print-sheet--color" : ""}`}
            style={{
              "--rows": browserLayout.rows,
              ...(cardColors && { "--card-bg": cardColors.background, "--card-fg": cardColors.text }),
            }}
          >
            <div className="print-sheet-top">
              <div className="print-sheet-top-copy">
                <p>
                  Cut along the dotted lines, then fold each card on the center line.
                  Heavy paper or card stock works best.
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
                    {machineNotice(browserPrintCard) && (
                      <p className="print-face-notice" lang="en" dir="ltr">
                        {machineNotice(browserPrintCard)}
                      </p>
                    )}
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
