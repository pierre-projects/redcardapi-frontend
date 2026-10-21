import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchLanguages, fetchConfig } from "../api";
import { LANGUAGES } from "../data/cards";
import { normalizeLanguageCode } from "../data/normalize";

/**
 * Languages are bundled with the app and available immediately. The backend
 * is only asked, in the background, which languages its PDF renderer has
 * fonts for, plus its print config. If the backend is down, cards still work
 * and only backend PDF download is unavailable.
 *
 * pdfStatus: "loading" | "ready" | "unavailable"
 */
export function useLanguages() {
  const [fontSupport, setFontSupport] = useState(null);
  const [config, setConfig] = useState(null);
  const [pdfStatus, setPdfStatus] = useState("loading");
  const [pdfError, setPdfError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetchLanguages(controller.signal),
      fetchConfig(controller.signal).catch(() => null), // Config is optional
    ])
      .then(([langs, cfg]) => {
        if (controller.signal.aborted) return;
        setFontSupport(new Map(
          (Array.isArray(langs) ? langs : []).map((lang) => [
            normalizeLanguageCode(lang.code),
            lang.fontSupported !== false,
          ])
        ));
        setConfig(cfg);
        setPdfStatus("ready");
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setPdfError(e.message || "PDF service unavailable");
        setPdfStatus("unavailable");
      });

    return () => controller.abort();
  }, [attempt]);

  const languages = useMemo(
    () => (fontSupport
      ? LANGUAGES.map((lang) => ({ ...lang, fontSupported: fontSupport.get(lang.code) ?? false }))
      : LANGUAGES),
    [fontSupport]
  );

  const retryPdfService = useCallback(() => {
    setPdfStatus("loading");
    setPdfError(null);
    setAttempt((n) => n + 1);
  }, []);

  return { languages, config, pdfStatus, pdfError, retryPdfService };
}
