import {
  buildBullets,
  buildNamedPoints,
  buildPayload,
  normalizeCode,
  normalizeText,
  validateRequiredFields,
} from "../../../utils/redCardPayload";

export function selectNormalizedValues(form, schema) {
  const namedPoints = buildNamedPoints(form.points, schema);

  return {
    name: normalizeText(form.name),
    code: normalizeCode(form.code),
    rtl: Boolean(form.rtl),
    header: normalizeText(form.header),
    namedPoints,
    bullets: buildBullets(namedPoints, schema),
  };
}

export function selectValidation(normalized, schema) {
  return validateRequiredFields({
    name: normalized.name,
    code: normalized.code,
    header: normalized.header,
    namedPoints: normalized.namedPoints,
    schema,
  });
}

export function selectPayload(normalized, schema) {
  return buildPayload({
    name: normalized.name,
    code: normalized.code,
    rtl: normalized.rtl,
    header: normalized.header,
    namedPoints: normalized.namedPoints,
    schema,
  });
}

export function selectPreviewCard(payload, isValid) {
  if (!isValid) return null;

  return {
    name: payload.name,
    code: payload.code,
    rtl: payload.rtl,
    official: payload.official,
    front: payload.front,
    source: payload.source,
  };
}

export function selectBuilderDerivedState(state, schema) {
  const normalized = selectNormalizedValues(state.form, schema);
  const validation = selectValidation(normalized, schema);
  const payload = selectPayload(normalized, schema);
  const jsonPayload = JSON.stringify(payload, null, 2);
  const previewCard = selectPreviewCard(payload, validation.isValid);
  const missingSet = new Set(validation.missing);

  return {
    normalized,
    validation,
    payload,
    jsonPayload,
    previewCard,
    missingSet,
  };
}
