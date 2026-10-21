import { useCallback, useEffect, useState } from "react";

function findVoice(voices, lang) {
  const target = String(lang || "").toLowerCase();
  const base = target.split("-")[0];
  return (
    voices.find((v) => v.lang.toLowerCase() === target) ||
    voices.find((v) => v.lang.toLowerCase().split(/[-_]/)[0] === base) ||
    null
  );
}

/**
 * Read text aloud with the device's own speech voices. `canSpeak` is false
 * when the device has no voice for `lang`, so the control can be hidden
 * instead of reading a language with the wrong voice.
 */
export function useSpeech(lang) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [voices, setVoices] = useState(() => (supported ? window.speechSynthesis.getVoices() : []));
  // Language currently being read; reading stops when the shown side changes.
  const [speakingLang, setSpeakingLang] = useState(null);
  const speaking = speakingLang === lang;

  useEffect(() => {
    if (!supported) return undefined;
    const synth = window.speechSynthesis;
    const update = () => setVoices(synth.getVoices());
    synth.addEventListener("voiceschanged", update);
    return () => {
      synth.removeEventListener("voiceschanged", update);
      synth.cancel();
    };
  }, [supported]);

  const voice = supported ? findVoice(voices, lang) : null;

  useEffect(() => {
    if (supported) window.speechSynthesis.cancel();
  }, [lang, supported]);

  const speak = useCallback((text) => {
    if (!voice) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.9;
    utterance.onend = () => setSpeakingLang(null);
    utterance.onerror = () => setSpeakingLang(null);
    setSpeakingLang(lang);
    synth.speak(utterance);
  }, [voice, lang]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeakingLang(null);
  }, [supported]);

  return { canSpeak: Boolean(voice), speaking, speak, stop };
}
