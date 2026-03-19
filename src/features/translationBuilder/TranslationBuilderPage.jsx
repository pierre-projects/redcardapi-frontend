import { useMemo, useReducer } from "react";
import { RED_CARD_HEADER_TEMPLATE, RED_CARD_SCHEMA } from "../../constants/redCardSchema";
import { createTranslationBuilderServices } from "./adapters/defaults";
import BuilderHeader from "./components/BuilderHeader";
import LanguageBasicsSection from "./components/LanguageBasicsSection";
import StatementsSection from "./components/StatementsSection";
import LivePreviewSection from "./components/LivePreviewSection";
import ExportSection from "./components/ExportSection";
import { useTranslationBuilderController } from "./hooks/useTranslationBuilderController";
import { selectBuilderDerivedState } from "./selectors/builderSelectors";
import { builderReducer } from "./state/builderReducer";
import { createInitialBuilderState } from "./state/builderState";
import "./TranslationBuilder.css";

export default function TranslationBuilderPage({
  onPrintableCardChange = () => {},
  onPrintRequest = () => window.print(),
  onOpenAboutModal,
  services,
}) {
  const resolvedServices = useMemo(
    () => createTranslationBuilderServices(services),
    [services]
  );

  const [state, dispatch] = useReducer(
    builderReducer,
    undefined,
    () => createInitialBuilderState({
      schema: RED_CARD_SCHEMA,
      headerTemplate: RED_CARD_HEADER_TEMPLATE,
    })
  );

  const derived = useMemo(
    () => selectBuilderDerivedState(state, RED_CARD_SCHEMA),
    [state]
  );

  const controller = useTranslationBuilderController({
    state,
    dispatch,
    schema: RED_CARD_SCHEMA,
    derived,
    services: resolvedServices,
    onPrintableCardChange,
    onPrintRequest,
  });

  return (
    <section className="translation-builder" aria-label="Red Card translation payload builder">
      <BuilderHeader />
      <div className="translation-builder-info-row">
        <button
          type="button"
          className="translation-builder-info-button"
          onClick={() => onOpenAboutModal?.()}
        >
          About This Tool
        </button>
      </div>

      {!derived.validation.isValid && (
        <div className="translation-validation">
          Required fields missing: {derived.validation.missing.join(", ")}.
        </div>
      )}

      <div className="translation-builder-layout">
        <div className="translation-builder-column translation-builder-column-main">
          <LanguageBasicsSection
            form={state.form}
            normalizedCode={derived.normalized.code}
            missingSet={derived.missingSet}
            onFieldChange={controller.onFieldChange}
          />

          <StatementsSection
            schema={RED_CARD_SCHEMA}
            points={state.form.points}
            missingSet={derived.missingSet}
            onPointChange={controller.onPointChange}
          />
        </div>

        <aside className="translation-builder-column translation-builder-column-side" aria-label="Preview and export">
          <LivePreviewSection
            isValid={derived.validation.isValid}
            previewCard={derived.previewCard}
          />

          <ExportSection
            isValid={derived.validation.isValid}
            copyState={state.copyState}
            onPrint={controller.onPrint}
            onCopy={controller.onCopy}
            onDownload={controller.onDownload}
            onReset={controller.onReset}
          />
        </aside>
      </div>
    </section>
  );
}
