import { useEffect, useRef, useState } from "react";
import { getTranslator } from "../i18n/messages";
import { useWakeLock } from "../hooks/useWakeLock";
import { useSpeech } from "../hooks/useSpeech";
import { useOfflineReady } from "../hooks/useOfflineReady";
import { saveCardImage } from "../lib/cardImage";
import { safeGet, safeSet } from "../lib/storage";

const TEXT_SCALE_KEY = "card-text-scale";
const TEXT_SCALES = [0.85, 1, 1.15, 1.3, 1.5, 1.75];
const RTL_UI_LANGS = new Set(["ar", "fa", "prs", "he", "ps", "ur"]);

function getStoredScaleIndex() {
  const index = TEXT_SCALES.indexOf(Number(safeGet(TEXT_SCALE_KEY)));
  return index >= 0 ? index : 1;
}

/**
 * Full-screen "show my card" view: the card in the user's language, a large
 * toggle to the English side for the officer, and the tools that matter in
 * the moment (bigger text, full screen, screen kept on, save, share, listen).
 */
export default function ShowCard({ card, back, onAllLanguages, onPrint }) {
  const t = getTranslator(card.code);
  const uiDir = RTL_UI_LANGS.has(t.lang) ? "rtl" : "ltr";
  const [side, setSide] = useState("front");
  const [scaleIndex, setScaleIndex] = useState(getStoredScaleIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const pageRef = useRef(null);
  const headingRef = useRef(null);

  const isBack = side === "back";
  const screenOn = useWakeLock(true);
  const offlineReady = useOfflineReady();
  const speech = useSpeech(isBack ? "en" : card.code);
  const fullscreenSupported = typeof document !== "undefined" && document.fullscreenEnabled;

  // Page language/direction follow the card while it is shown.
  useEffect(() => {
    const root = document.documentElement;
    const previous = { lang: root.lang, dir: root.dir, title: document.title };
    root.lang = card.code;
    root.dir = card.rtl ? "rtl" : "ltr";
    document.title = `${card.native} — Red Card`;
    return () => {
      root.lang = previous.lang || "en";
      root.dir = previous.dir || "ltr";
      document.title = previous.title;
    };
  }, [card]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [card.code]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const changeScale = (delta) => {
    setScaleIndex((current) => {
      const next = Math.min(Math.max(current + delta, 0), TEXT_SCALES.length - 1);
      safeSet(TEXT_SCALE_KEY, TEXT_SCALES[next]);
      return next;
    });
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await pageRef.current?.requestFullscreen();
      }
    } catch {
      // Fullscreen refused (e.g. iframe); nothing else to do.
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${card.native} — Red Card`, url });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast(t("linkCopied"));
    } catch {
      setToast(url);
    }
  };

  const handleSaveImage = async () => {
    setSaving(true);
    try {
      await saveCardImage(card, back);
    } catch {
      setToast("Could not create image");
    } finally {
      setSaving(false);
    }
  };

  const handleSpeak = () => {
    if (speech.speaking) {
      speech.stop();
      return;
    }
    const text = isBack
      ? [...back.statements, back.footer].filter(Boolean).join(" ")
      : [card.front.header, ...card.front.bullets].filter(Boolean).join(". ");
    speech.speak(text);
  };

  return (
    <div
      ref={pageRef}
      className={`show-page ${isFullscreen ? "is-fullscreen" : ""}`}
      style={{ "--card-text-scale": TEXT_SCALES[scaleIndex] }}
    >
      <div className="show-topbar" lang={t.lang} dir={uiDir}>
        <button type="button" className="show-link-button" onClick={onAllLanguages}>
          <span aria-hidden="true">{uiDir === "rtl" ? "→" : "←"}</span> {t("allLanguages")}
        </button>
        <div className="show-status" aria-live="polite">
          {offlineReady && <span className="show-status-pill">✓ {t("offlineReady")}</span>}
          {screenOn && <span className="show-status-pill">☀ {t("screenOn")}</span>}
        </div>
      </div>

      <div className="show-toggle" role="group" aria-label={card.native} lang={t.lang} dir={uiDir}>
        <button
          type="button"
          className="show-toggle-button"
          aria-pressed={!isBack}
          onClick={() => setSide("front")}
        >
          <span className="show-toggle-main">{t("myRights")}</span>
          <span className="show-toggle-sub" lang={card.code}>{card.native}</span>
        </button>
        <button
          type="button"
          className="show-toggle-button"
          aria-pressed={isBack}
          onClick={() => setSide("back")}
        >
          <span className="show-toggle-main">{t("showOfficer")}</span>
          <span className="show-toggle-sub" lang="en">English</span>
        </button>
      </div>

      {isBack && (
        <p className="show-officer-hint" lang={t.lang} dir={uiDir}>{t("officerHint")}</p>
      )}

      {isBack ? (
        <article className="show-card show-card-back" lang="en" dir="ltr">
          <h1 ref={headingRef} tabIndex={-1} className="visually-hidden">
            Know your rights — statement for the officer
          </h1>
          {back.statements.map((text) => (
            <p key={text}>{text}</p>
          ))}
          {back.footer && <p className="show-card-footer">{back.footer}</p>}
        </article>
      ) : (
        <article className="show-card show-card-front" lang={card.code} dir={card.rtl ? "rtl" : "ltr"}>
          <h1 ref={headingRef} tabIndex={-1} className="show-card-header">
            {card.front.header || card.native}
          </h1>
          <ul className="show-card-bullets">
            {card.front.bullets.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </article>
      )}

      <div className="show-tools" lang={t.lang} dir={uiDir}>
        <div className="show-tool-group" role="group" aria-label={t("textSize")}>
          <button
            type="button"
            className="show-tool"
            onClick={() => changeScale(-1)}
            disabled={scaleIndex === 0}
            aria-label={`${t("textSize")} −`}
          >
            A−
          </button>
          <button
            type="button"
            className="show-tool"
            onClick={() => changeScale(1)}
            disabled={scaleIndex === TEXT_SCALES.length - 1}
            aria-label={`${t("textSize")} +`}
          >
            A+
          </button>
        </div>
        {fullscreenSupported && (
          <button type="button" className="show-tool" onClick={toggleFullscreen}>
            {isFullscreen ? t("exitFullScreen") : t("fullScreen")}
          </button>
        )}
        <button type="button" className="show-tool" onClick={handleSaveImage} disabled={saving}>
          {t("saveImage")}
        </button>
        <button type="button" className="show-tool" onClick={handleShare}>
          {t("share")}
        </button>
        {speech.canSpeak && (
          <button type="button" className="show-tool" onClick={handleSpeak} aria-pressed={speech.speaking}>
            {speech.speaking ? t("stop") : t("readAloud")}
          </button>
        )}
      </div>

      {toast && <div className="show-toast" role="status">{toast}</div>}

      <details className="show-about">
        <summary>About this translation</summary>
        <p>
          {card.name} ({card.native})
          {card.source?.origin && card.source.origin !== "unknown" ? ` — ${card.source.origin}` : ""}
          {card.source?.type ? ` · ${card.source.type}` : ""}
          {card.source?.verified ? " · verified" : ""}
        </p>
        {card.source?.url && (
          <p>
            <a href={card.source.url} target="_blank" rel="noopener noreferrer">View original source</a>
          </p>
        )}
        <p>
          <button type="button" className="show-link-button" onClick={onPrint}>
            Print paper cards
          </button>
        </p>
        <p className="show-disclaimer">
          General information about constitutional rights, not legal advice.
        </p>
      </details>
    </div>
  );
}
