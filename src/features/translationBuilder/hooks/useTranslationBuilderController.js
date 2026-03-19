import { useCallback, useEffect, useMemo, useRef } from "react";
import { createInitialFormState } from "../state/builderState";
import {
  resetForm,
  setAutoState,
  setCopyState,
  setExistenceState,
  setField,
  setPoint,
  setPoints,
  setProviderId,
} from "../state/builderReducer";
import { createExportFilename, downloadJsonFile } from "../utils/exportJson";

function buildCacheKey({ providerId, targetLanguage, schema }) {
  return JSON.stringify({
    type: "translate_batch",
    providerId,
    sourceLanguage: "en",
    targetLanguage,
    schemaVersion: "red-card-v1",
    sourceTexts: schema.map((point) => point.sourceText),
  });
}

function mapExistenceResult(result) {
  const status = result?.status || "error";
  const message = result?.message;

  if (status === "not_found") {
    return {
      loading: false,
      tone: "success",
      status,
      message: message || "No existing translation found in duplicate-check provider.",
    };
  }

  if (status === "exists") {
    return {
      loading: false,
      tone: "error",
      status,
      message: message || "A similar translation appears to already exist.",
    };
  }

  if (status === "not_configured") {
    return {
      loading: false,
      tone: "idle",
      status,
      message: message || "Duplicate-check integration is not configured.",
    };
  }

  return {
    loading: false,
    tone: "error",
    status: "error",
    message: message || "Unable to verify duplicates right now.",
  };
}

export function useTranslationBuilderController({
  state,
  dispatch,
  schema,
  derived,
  services,
  onPrintableCardChange = () => {},
  onPrintRequest = () => window.print(),
}) {
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    onPrintableCardChange(derived.previewCard);
  }, [derived.previewCard, onPrintableCardChange]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const setCopyStateWithTimeout = useCallback((tone, message) => {
    dispatch(setCopyState({ tone, message }));
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = window.setTimeout(() => {
      dispatch(setCopyState({ tone: "idle", message: "" }));
    }, 2200);
  }, [dispatch]);

  const onFieldChange = useCallback((field, value) => {
    dispatch(setField(field, value));
  }, [dispatch]);

  const onPointChange = useCallback((key, value) => {
    dispatch(setPoint(key, value));
  }, [dispatch]);

  const onProviderChange = useCallback((providerId) => {
    dispatch(setProviderId(providerId));
  }, [dispatch]);

  const onReset = useCallback(() => {
    dispatch(resetForm(createInitialFormState({ schema })));
  }, [dispatch, schema]);

  const onCopy = useCallback(async () => {
    if (!derived.validation.isValid) {
      setCopyStateWithTimeout("error", "Complete required fields before export.");
      return;
    }

    try {
      await navigator.clipboard.writeText(derived.jsonPayload);
      setCopyStateWithTimeout("success", "Copied JSON payload.");
    } catch {
      setCopyStateWithTimeout("error", "Clipboard access failed.");
    }
  }, [derived.jsonPayload, derived.validation.isValid, setCopyStateWithTimeout]);

  const onDownload = useCallback(() => {
    if (!derived.validation.isValid) {
      setCopyStateWithTimeout("error", "Complete required fields before export.");
      return;
    }

    const filename = createExportFilename({
      code: derived.payload.code,
      name: derived.payload.name,
    });

    downloadJsonFile({
      filename,
      jsonText: derived.jsonPayload,
    });
  }, [derived.jsonPayload, derived.payload.code, derived.payload.name, derived.validation.isValid, setCopyStateWithTimeout]);

  const onPrint = useCallback(() => {
    if (!derived.validation.isValid) {
      setCopyStateWithTimeout("error", "Complete required fields before print.");
      return;
    }
    onPrintRequest();
  }, [derived.validation.isValid, onPrintRequest, setCopyStateWithTimeout]);

  const onAutoTranslate = useCallback(async () => {
    const provider = services.providerRegistry.get(state.providerId);

    if (!derived.normalized.code) {
      dispatch(setAutoState({
        loading: false,
        tone: "error",
        message: "Set a language code first before auto-translation.",
      }));
      return;
    }

    if (!provider?.supportsAutoTranslate) {
      dispatch(setAutoState({
        loading: false,
        tone: "error",
        message: "Current provider is manual-only.",
      }));
      return;
    }

    dispatch(setAutoState({ loading: true, tone: "idle", message: "" }));

    const cacheKey = buildCacheKey({
      providerId: state.providerId,
      targetLanguage: derived.normalized.code,
      schema,
    });

    try {
      const cached = await services.cacheProvider.get({ key: cacheKey });
      const cachedTranslations = Array.isArray(cached?.translations)
        ? cached.translations
        : Array.isArray(cached)
          ? cached
          : null;

      const translated = cachedTranslations || await provider.translateBatch({
        texts: schema.map((point) => point.sourceText),
        sourceLanguage: "en",
        targetLanguage: derived.normalized.code,
      });

      if (!cachedTranslations) {
        await services.cacheProvider.set({
          key: cacheKey,
          value: {
            translations: translated,
            createdAt: Date.now(),
          },
        });
      }

      const nextPoints = schema.reduce((acc, point, index) => {
        acc[point.key] = translated[index] || state.form.points[point.key];
        return acc;
      }, {});

      dispatch(setPoints(nextPoints));
      dispatch(setAutoState({
        loading: false,
        tone: "success",
        message: cachedTranslations
          ? "Applied cached translation suggestions."
          : `Applied ${provider.label} suggestions.`,
      }));
    } catch (error) {
      dispatch(setAutoState({
        loading: false,
        tone: "error",
        message: error?.message || "Auto-translate failed.",
      }));
    }
  }, [
    derived.normalized.code,
    dispatch,
    schema,
    services.cacheProvider,
    services.providerRegistry,
    state.form.points,
    state.providerId,
  ]);

  const existenceCheckKey = useMemo(() => {
    if (!derived.validation.isValid) return "";
    return JSON.stringify({
      code: derived.normalized.code,
      header: derived.normalized.header,
      namedPoints: derived.normalized.namedPoints,
    });
  }, [derived.normalized.code, derived.normalized.header, derived.normalized.namedPoints, derived.validation.isValid]);

  const existenceCheckInput = useMemo(() => {
    if (!existenceCheckKey) return null;
    try {
      return JSON.parse(existenceCheckKey);
    } catch {
      return null;
    }
  }, [existenceCheckKey]);

  useEffect(() => {
    if (!derived.validation.isValid) {
      dispatch(setExistenceState({
        loading: false,
        tone: "idle",
        status: "idle",
        message: "",
      }));
      return;
    }

    const abortController = typeof AbortController !== "undefined"
      ? new AbortController()
      : null;

    dispatch(setExistenceState({
      loading: true,
      tone: "idle",
      status: "checking",
      message: "Checking for existing translations...",
    }));

    (async () => {
      try {
        const result = await services.existenceProvider.check({
          code: existenceCheckInput?.code || "",
          header: existenceCheckInput?.header || "",
          namedPoints: existenceCheckInput?.namedPoints || {},
          schemaVersion: "red-card-v1",
          signal: abortController?.signal,
        });
        dispatch(setExistenceState(mapExistenceResult(result)));
      } catch (error) {
        if (error?.name === "AbortError") return;
        dispatch(setExistenceState({
          loading: false,
          tone: "error",
          status: "error",
          message: "Duplicate-check lookup failed.",
        }));
      }
    })();

    return () => {
      abortController?.abort();
    };
  }, [
    derived.validation.isValid,
    dispatch,
    existenceCheckInput,
    services.existenceProvider,
  ]);

  return {
    onFieldChange,
    onPointChange,
    onProviderChange,
    onReset,
    onCopy,
    onDownload,
    onPrint,
    onAutoTranslate,
  };
}
