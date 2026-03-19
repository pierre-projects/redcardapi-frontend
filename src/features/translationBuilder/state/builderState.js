import { RED_CARD_HEADER_TEMPLATE, RED_CARD_SCHEMA } from "../../../constants/redCardSchema";

export const COPY_STATE_IDLE = Object.freeze({
  tone: "idle",
  message: "",
});

export const AUTO_STATE_IDLE = Object.freeze({
  loading: false,
  tone: "idle",
  message: "",
});

export const EXISTENCE_STATE_IDLE = Object.freeze({
  loading: false,
  tone: "idle",
  status: "idle",
  message: "",
});

export function createInitialFormState({
  schema = RED_CARD_SCHEMA,
  headerTemplate = RED_CARD_HEADER_TEMPLATE,
} = {}) {
  return {
    name: "",
    code: "",
    rtl: false,
    header: headerTemplate,
    points: schema.reduce((acc, point) => {
      acc[point.key] = point.sourceText;
      return acc;
    }, {}),
  };
}

export function createInitialBuilderState(options = {}) {
  return {
    form: createInitialFormState(options),
    providerId: "manual",
    copyState: { ...COPY_STATE_IDLE },
    autoState: { ...AUTO_STATE_IDLE },
    existenceState: { ...EXISTENCE_STATE_IDLE },
  };
}
