import { AUTO_STATE_IDLE, COPY_STATE_IDLE, EXISTENCE_STATE_IDLE } from "./builderState";

export const BUILDER_ACTIONS = Object.freeze({
  SET_FIELD: "SET_FIELD",
  SET_POINT: "SET_POINT",
  SET_POINTS: "SET_POINTS",
  SET_PROVIDER_ID: "SET_PROVIDER_ID",
  SET_COPY_STATE: "SET_COPY_STATE",
  SET_AUTO_STATE: "SET_AUTO_STATE",
  SET_EXISTENCE_STATE: "SET_EXISTENCE_STATE",
  RESET_FORM: "RESET_FORM",
});

export function setField(field, value) {
  return {
    type: BUILDER_ACTIONS.SET_FIELD,
    field,
    value,
  };
}

export function setPoint(key, value) {
  return {
    type: BUILDER_ACTIONS.SET_POINT,
    key,
    value,
  };
}

export function setPoints(points) {
  return {
    type: BUILDER_ACTIONS.SET_POINTS,
    points,
  };
}

export function setProviderId(providerId) {
  return {
    type: BUILDER_ACTIONS.SET_PROVIDER_ID,
    providerId,
  };
}

export function setCopyState(copyState) {
  return {
    type: BUILDER_ACTIONS.SET_COPY_STATE,
    copyState,
  };
}

export function setAutoState(autoState) {
  return {
    type: BUILDER_ACTIONS.SET_AUTO_STATE,
    autoState,
  };
}

export function setExistenceState(existenceState) {
  return {
    type: BUILDER_ACTIONS.SET_EXISTENCE_STATE,
    existenceState,
  };
}

export function resetForm(form) {
  return {
    type: BUILDER_ACTIONS.RESET_FORM,
    form,
  };
}

export function builderReducer(state, action) {
  switch (action.type) {
    case BUILDER_ACTIONS.SET_FIELD:
      return {
        ...state,
        form: {
          ...state.form,
          [action.field]: action.value,
        },
      };
    case BUILDER_ACTIONS.SET_POINT:
      return {
        ...state,
        form: {
          ...state.form,
          points: {
            ...state.form.points,
            [action.key]: action.value,
          },
        },
      };
    case BUILDER_ACTIONS.SET_POINTS:
      return {
        ...state,
        form: {
          ...state.form,
          points: {
            ...state.form.points,
            ...action.points,
          },
        },
      };
    case BUILDER_ACTIONS.SET_PROVIDER_ID:
      return {
        ...state,
        providerId: action.providerId,
      };
    case BUILDER_ACTIONS.SET_COPY_STATE:
      return {
        ...state,
        copyState: action.copyState,
      };
    case BUILDER_ACTIONS.SET_AUTO_STATE:
      return {
        ...state,
        autoState: action.autoState,
      };
    case BUILDER_ACTIONS.SET_EXISTENCE_STATE:
      return {
        ...state,
        existenceState: action.existenceState,
      };
    case BUILDER_ACTIONS.RESET_FORM:
      return {
        ...state,
        form: action.form,
        copyState: { ...COPY_STATE_IDLE },
        autoState: { ...AUTO_STATE_IDLE },
        existenceState: { ...EXISTENCE_STATE_IDLE },
      };
    default:
      return state;
  }
}
