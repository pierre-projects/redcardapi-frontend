import { TranslationBuilderPage } from "../features/translationBuilder";

export default function TranslationPayloadBuilder({
  onPrintableCardChange,
  onPrintRequest,
  onOpenAboutModal,
  printSettings,
  printColors,
  services,
}) {
  return (
    <TranslationBuilderPage
      onPrintableCardChange={onPrintableCardChange}
      onPrintRequest={onPrintRequest}
      onOpenAboutModal={onOpenAboutModal}
      printSettings={printSettings}
      printColors={printColors}
      services={services}
    />
  );
}
