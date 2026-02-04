import { useState, useEffect, useCallback } from "react";
import { fetchLanguages, fetchConfig } from "../api";

/**
 * Custom hook for fetching languages and config with loading/error states.
 */
export function useLanguages() {
  const [languages, setLanguages] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch languages and config in parallel
      const [langs, cfg] = await Promise.all([
        fetchLanguages(signal),
        fetchConfig(signal).catch(() => null), // Config is optional
      ]);

      setLanguages(langs);
      setConfig(cfg);
    } catch (e) {
      if (e.name === "AbortError") return;
      setError(e.message || "Failed to load languages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const retry = useCallback(() => {
    const controller = new AbortController();
    load(controller.signal);
  }, [load]);

  return { languages, config, loading, error, retry };
}
