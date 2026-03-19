export const BUILDER_ADAPTER_CONTRACT_VERSION = "1.0.0";

/**
 * @typedef {Object} TranslationProvider
 * @property {string} id
 * @property {string} label
 * @property {boolean} supportsAutoTranslate
 * @property {(params: {
 *   texts: string[],
 *   sourceLanguage: string,
 *   targetLanguage: string,
 *   signal?: AbortSignal
 * }) => Promise<string[]>} translateBatch
 */

/**
 * @typedef {Object} TranslationProviderRegistry
 * @property {() => Array<{ id: string, label: string, supportsAutoTranslate: boolean }>} list
 * @property {(id: string) => TranslationProvider} get
 */

/**
 * @typedef {Object} TranslationCacheProvider
 * @property {(params: { key: string }) => Promise<unknown>} get
 * @property {(params: { key: string, value: unknown, ttlMs?: number }) => Promise<void>} set
 * @property {() => Promise<void>=} clear
 */

/**
 * @typedef {Object} TranslationExistenceProvider
 * @property {(params: {
 *   code: string,
 *   header: string,
 *   namedPoints: Record<string, string>,
 *   schemaVersion: string,
 *   signal?: AbortSignal
 * }) => Promise<{
 *   status: "not_configured" | "checking" | "exists" | "not_found" | "error",
 *   message?: string,
 *   matchId?: string
 * }>} check
 */
