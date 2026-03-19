class TranslationProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = "TranslationProviderError";
  }
}

const PROVIDERS = {
  manual: {
    id: "manual",
    label: "Manual Only",
    supportsAutoTranslate: false,
    async translateBatch() {
      throw new TranslationProviderError("Manual provider does not support auto-translation.");
    },
  },
  mock: {
    id: "mock",
    label: "Mock Provider (Dev)",
    supportsAutoTranslate: true,
    async translateBatch({ texts, targetLanguage }) {
      const safeTarget = targetLanguage || "target";
      return texts.map((text) => `[${safeTarget}] ${text}`);
    },
  },
};

export function listTranslationProviders() {
  return Object.values(PROVIDERS).map((provider) => ({
    id: provider.id,
    label: provider.label,
    supportsAutoTranslate: provider.supportsAutoTranslate,
  }));
}

export function getTranslationProvider(id) {
  return PROVIDERS[id] || PROVIDERS.manual;
}

export { TranslationProviderError };
