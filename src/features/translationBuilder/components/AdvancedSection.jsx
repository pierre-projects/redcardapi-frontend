function getExistenceMessage(existenceState) {
  if (!existenceState?.status || existenceState.status === "idle") {
    return "";
  }

  if (existenceState.message) {
    return existenceState.message;
  }

  if (existenceState.status === "checking") {
    return "Checking for an existing translation...";
  }

  if (existenceState.status === "not_configured") {
    return "Duplicate-check integration is not configured yet.";
  }

  if (existenceState.status === "not_found") {
    return "No existing translation found in the duplicate-check provider.";
  }

  if (existenceState.status === "exists") {
    return "A matching translation may already exist.";
  }

  return "Duplicate-check lookup failed.";
}

function getExistenceTone(existenceState) {
  if (!existenceState?.status || existenceState.status === "idle") {
    return "idle";
  }

  if (existenceState.status === "not_found") return "success";
  if (existenceState.status === "exists" || existenceState.status === "error") return "error";
  return "idle";
}

export default function AdvancedSection({
  providerOptions,
  providerId,
  autoState,
  existenceState,
  jsonPayload,
  onProviderChange,
  onAutoTranslate,
}) {
  const existenceMessage = getExistenceMessage(existenceState);
  const existenceTone = getExistenceTone(existenceState);

  return (
    <details className="translation-advanced">
      <summary>Advanced</summary>
      <div className="translation-advanced-body">
        <div className="translation-provider-panel">
          <label>
            <span className="translation-field-label">Translation provider</span>
            <select value={providerId} onChange={(e) => onProviderChange(e.target.value)}>
              {providerOptions.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.label}
                </option>
              ))}
            </select>
          </label>
          <div className="translation-provider-actions">
            <button type="button" onClick={onAutoTranslate} disabled={autoState.loading}>
              {autoState.loading ? "Translating..." : "Auto-Translate"}
            </button>
          </div>
          <p className="translation-provider-help">
            Future providers, cache adapters, and duplicate checks are injectable through `services` props and feature adapters.
          </p>

          {autoState.tone !== "idle" && autoState.message && (
            <div className={`translation-system-message is-${autoState.tone}`}>{autoState.message}</div>
          )}

          {existenceMessage && (
            <div className={`translation-system-message is-${existenceTone}`}>{existenceMessage}</div>
          )}
        </div>

        <details className="translation-json-toggle">
          <summary>Show Raw JSON</summary>
          <div className="translation-json-wrap">
            <pre className="translation-json">{jsonPayload}</pre>
          </div>
        </details>
      </div>
    </details>
  );
}
