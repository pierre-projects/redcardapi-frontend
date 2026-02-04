import { useMemo, useState } from "react";
import { useLanguages } from "./hooks/useLanguages";
import { useCard } from "./hooks/useCard";
import LanguagePicker from "./components/LanguagePicker";
import LayoutPicker from "./components/LayoutPicker";
import CardPreview from "./components/CardPreview";
import PdfDownloadButton from "./components/PdfDownloadButton";
import FontWarning from "./components/FontWarning";
import { LoadingMessage } from "./components/LoadingSpinner";

export default function App() {
  // Fetch languages and config
  const {
    languages,
    config,
    loading: langsLoading,
    error: langsError,
    retry: retryLanguages,
  } = useLanguages();

  // Selected language and layout
  const [selected, setSelected] = useState("");
  const [cardsPerPage, setCardsPerPage] = useState(4);

  // Fetch card when language selected
  const { card, loading: cardLoading, error: cardError } = useCard(selected);

  // Sort languages alphabetically
  const sorted = useMemo(() => {
    return [...languages].sort((a, b) => a.name.localeCompare(b.name));
  }, [languages]);

  // Find selected language object
  const selectedLanguage = useMemo(() => {
    return languages.find((l) => l.code === selected);
  }, [languages, selected]);

  // Combined error display
  const error = langsError || cardError;

  return (
    <div
      style={{
        maxWidth: 980,
        margin: "40px auto",
        padding: 16,
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ marginBottom: 6 }}>Know Your Rights Auto Language Cards</h1>
      <div style={{ opacity: 0.75, marginBottom: 20 }}>
        Official translations from <code>Translations.json</code> + server-side
        PDF render.
      </div>

      {/* Error display with retry */}
      {error && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: "#ffe5e5",
            border: "1px solid #ffb3b3",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{error}</span>
          {langsError && (
            <button
              onClick={retryLanguages}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #cc8888",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Loading state for initial languages */}
      {langsLoading && <LoadingMessage message="Loading languages..." />}

      {/* Main content */}
      {!langsLoading && !langsError && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              gap: 14,
              alignItems: "end",
            }}
          >
            <LanguagePicker
              languages={sorted}
              value={selected}
              onChange={setSelected}
            />
            <LayoutPicker
              value={cardsPerPage}
              onChange={setCardsPerPage}
              validLayouts={config?.valid_layouts}
            />
            <PdfDownloadButton
              code={selected}
              cardsPerPage={cardsPerPage}
              disabled={!selected}
            />
          </div>

          {/* Font warning for unsupported languages */}
          {selectedLanguage && !selectedLanguage.fontSupported && (
            <FontWarning language={selectedLanguage} />
          )}

          <div style={{ marginTop: 18 }}>
            <CardPreview card={card} loading={cardLoading} />
          </div>
        </>
      )}
    </div>
  );
}
