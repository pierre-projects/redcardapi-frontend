import { useEffect, useState } from "react";

/**
 * Keep the screen on while `active` is true (Screen Wake Lock API).
 * Browsers drop the lock when the tab is hidden, so it is re-acquired on
 * return. Returns whether a lock is currently held.
 */
export function useWakeLock(active) {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return undefined;
    }

    let sentinel = null;
    let cancelled = false;

    const acquire = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const next = await navigator.wakeLock.request("screen");
        if (cancelled) {
          next.release().catch(() => {});
          return;
        }
        sentinel = next;
        setHeld(true);
        next.addEventListener("release", () => {
          if (sentinel === next) setHeld(false);
        });
      } catch {
        setHeld(false);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      sentinel?.release().catch(() => {});
      sentinel = null;
      setHeld(false);
    };
  }, [active]);

  return held;
}
