import { useMemo, useState } from "react";
import { getTranslator } from "../i18n/messages";
import { searchLanguages } from "../lib/languageMatch";
import { isMachineTranslation } from "../lib/translationSource";
import Icon from "./Icon";

/**
 * First thing on the home page: open a card in one tap.
 * Shows the remembered or browser-detected language as a large button, then
 * every language by its own name (endonym), searchable in any script.
 */
export default function QuickCardAccess({ languages, suggested, onOpenCard, onForget }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchLanguages(languages, query), [languages, query]);
  const t = getTranslator(suggested?.code);
  const translated = t.lang !== "en";

  const handleOpen = (event, code) => {
    // Plain left clicks navigate in-app; modified clicks keep link behavior.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    onOpenCard(code);
  };

  return (
    <section className="quick-access" aria-labelledby="quick-access-title">
      <div className="page-head">
        <h1 id="quick-access-title">Know your rights card</h1>
        <p>
          Show this card if immigration agents come to your door or stop you. It is free, private,
          and works without an internet connection.
        </p>
      </div>

      {suggested && (
        <div className="quick-suggested">
          <a
            className="quick-suggested-button"
            href={`/card/${suggested.code}`}
            onClick={(event) => handleOpen(event, suggested.code)}
            lang={suggested.code}
            dir={suggested.rtl ? "rtl" : "ltr"}
          >
            <span>
              <span className="quick-suggested-native">{suggested.native}</span>
              <span className="quick-suggested-action" lang={t.lang}>{t("openMyCard")}</span>
            </span>
            <Icon name={suggested.rtl ? "arrow-left" : "arrow-right"} size={22} />
          </a>
          {onForget && (
            <button type="button" className="link-button quick-forget" onClick={onForget}>
              Forget this language on this device
            </button>
          )}
        </div>
      )}

      <div className="quick-search-row">
        <label className="field-label" htmlFor="quick-search">
          {translated ? <span lang={t.lang}>{t("chooseLanguage")} · </span> : null}
          Choose your language
        </label>
        <div className="search-input">
          <Icon name="search" />
          <input
            id="quick-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={translated ? `${t("searchLanguages")} · Search` : "Search in any language"}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      {results.length === 0 ? (
        <p className="quick-empty" role="status">No language matches “{query}”.</p>
      ) : (
        <ul className="language-list">
          {results.map((language) => (
            <li key={language.code}>
              <a
                className="language-link"
                href={`/card/${language.code}`}
                onClick={(event) => handleOpen(event, language.code)}
              >
                <span className="language-native" lang={language.code} dir={language.rtl ? "rtl" : "ltr"}>
                  {language.native}
                </span>
                {(language.native !== language.name || isMachineTranslation(language)) && (
                  <span className="language-name">
                    {language.native !== language.name && language.name}
                    {isMachineTranslation(language) && (
                      <span className="language-tag">Machine translation</span>
                    )}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
