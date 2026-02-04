import { useState, useEffect, useRef } from "react";
import { fetchCard } from "../api";

/**
 * Custom hook for fetching card data with loading/error states and request cancellation.
 * Prevents race conditions when rapidly changing language selection.
 *
 * @param {string} code - Language code to fetch
 */
export function useCard(code) {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep track of the current request to prevent stale updates
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Clear card when no code selected
    if (!code) {
      setCard(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchCard(code, controller.signal);
        // Only update if this request wasn't cancelled
        if (!controller.signal.aborted) {
          setCard(data);
        }
      } catch (e) {
        if (e.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setError(e.message || "Failed to load card");
          setCard(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();

    // Cleanup on unmount or when code changes
    return () => {
      controller.abort();
    };
  }, [code]);

  return { card, loading, error };
}
