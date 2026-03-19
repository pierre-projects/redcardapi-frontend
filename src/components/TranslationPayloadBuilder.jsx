import { TranslationBuilderPage } from "../features/translationBuilder";

export default function TranslationPayloadBuilder({
  onPrintableCardChange,
  onPrintRequest,
  onOpenAboutModal,
  services,
}) {
  return (
    <TranslationBuilderPage
      onPrintableCardChange={onPrintableCardChange}
      onPrintRequest={onPrintRequest}
      onOpenAboutModal={onOpenAboutModal}
      services={services}
    />
  );
}
