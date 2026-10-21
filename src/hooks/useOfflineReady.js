import { useEffect, useState } from "react";

/**
 * True once a service worker controls the page, i.e. the app and every card
 * have been cached and will open without a connection.
 */
export function useOfflineReady() {
  const supported = typeof navigator !== "undefined" && "serviceWorker" in navigator;
  const [ready, setReady] = useState(() => supported && Boolean(navigator.serviceWorker.controller));

  useEffect(() => {
    if (!supported) return undefined;
    const update = () => setReady(Boolean(navigator.serviceWorker.controller));
    navigator.serviceWorker.addEventListener("controllerchange", update);
    navigator.serviceWorker.ready.then(update).catch(() => {});
    return () => navigator.serviceWorker.removeEventListener("controllerchange", update);
  }, [supported]);

  return ready;
}
