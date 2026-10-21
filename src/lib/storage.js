/**
 * localStorage wrappers that never throw.
 *
 * Private browsing modes, embedded webviews and blocked site data can make
 * every localStorage access throw. A crash there would hide the card from
 * someone who needs it, so all persistence goes through these helpers.
 */

export function safeGet(key, fallback = null) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Storage unavailable; preference simply is not remembered.
  }
}

export function safeRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage unavailable.
  }
}
