import { getTranslationProvider, listTranslationProviders } from "../../../services/translationProviders";

export const NoopCacheProvider = Object.freeze({
  async get() {
    return null;
  },
  async set() {},
  async clear() {},
});

export const NoopExistenceProvider = Object.freeze({
  async check() {
    return { status: "not_configured" };
  },
});

export const DefaultProviderRegistry = Object.freeze({
  list() {
    return listTranslationProviders();
  },
  get(id) {
    return getTranslationProvider(id);
  },
});

export function createTranslationBuilderServices(overrides = {}) {
  return {
    providerRegistry: overrides.providerRegistry || DefaultProviderRegistry,
    cacheProvider: overrides.cacheProvider || NoopCacheProvider,
    existenceProvider: overrides.existenceProvider || NoopExistenceProvider,
  };
}
