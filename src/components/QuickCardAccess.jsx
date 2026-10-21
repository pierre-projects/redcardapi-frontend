import { useMemo, useState } from "react";
import { getTranslator } from "../i18n/messages";
import { searchLanguages } from "../lib/languageMatch";

/**
 * First thing on the home page: open a card in one tap.
 * Shows the remembered or browser-detected language as a large button, then
 * every language by its own name (endonym), searchable in any script.
 */
export default function QuickCardAccess({ languages, suggested, onOpenCard, onForget }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchLanguages(languages, query), [languages, query]);
  const t = getTranslator(suggested?.code);
  const searchPlaceholder = t.lang === "en"
    ? "Search languages"
    : `${t("searchLanguages")} · Search languages`;

  const cardHref = (code) => `/card/${code}`;

  const handleOpen = (event, code) => {
    // Plain left clicks navigate in-app; modified clicks keep link behavior.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    onOpenCard(code);
  };

  return (
    <section className="quick-access" aria-labelledby="quick-access-title">
      {suggested && (
        <div className="quick-suggested">
          <a
            className="quick-suggested-button"
            href={cardHref(suggested.code)}
            onClick={(event) => handleOpen(event, suggested.code)}
            lang={suggested.code}
            dir={suggested.rtl ? "rtl" : "ltr"}
          >
            <span className="quick-suggested-native">{suggested.native}</span>
            <span className="quick-suggested-action" lang={t.lang}>{t("openMyCard")} →</span>
          </a>
          {onForget && (
            <button type="button" className="quick-forget" onClick={onForget}>
              Forget this language on this device
            </button>
          )}
        </div>
      )}

      <h2 id="quick-access-title" className="quick-title">
        <span lang={t.lang}>{t("chooseLanguage")}</span>
        {t.lang !== "en" && <span className="quick-title-en"> · Choose your language</span>}
      </h2>

      <label className="visually-hidden" htmlFor="quick-search">Search languages</label>
      <input
        id="quick-search"
        className="quick-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={searchPlaceholder}
        autoComplete="off"
        spellCheck={false}
      />

      {results.length === 0 ? (
        <p className="quick-empty" role="status">No language matches “{query}”.</p>
      ) : (
        <ul className="quick-grid">
          {results.map((language) => (
            <li key={language.code}>
              <a
                className="quick-lang"
                href={cardHref(language.code)}
                onClick={(event) => handleOpen(event, language.code)}
              >
                <span className="quick-lang-native" lang={language.code} dir={language.rtl ? "rtl" : "ltr"}>
                  {language.native}
                </span>
                {language.native !== language.name && (
                  <span className="quick-lang-name">{language.name}</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
