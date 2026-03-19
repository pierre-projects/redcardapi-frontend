export function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function normalizeCode(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "");
}

export function buildNamedPoints(points, schema) {
  return schema.reduce((acc, point) => {
    acc[point.key] = normalizeText(points?.[point.key]);
    return acc;
  }, {});
}

export function buildBullets(namedPoints, schema) {
  return schema.reduce((bullets, point) => {
    const text = normalizeText(namedPoints?.[point.key]);
    if (point.mergeIntoPreviousBullet && bullets.length > 0) {
      const prev = bullets[bullets.length - 1];
      bullets[bullets.length - 1] = [prev, text].filter(Boolean).join(" ");
      return bullets;
    }

    bullets.push(text);
    return bullets;
  }, []);
}

export function buildPayload({
  name,
  code,
  rtl,
  header,
  namedPoints,
  schema,
}) {
  return {
    name: normalizeText(name),
    code: normalizeCode(code),
    rtl: Boolean(rtl),
    official: false,
    front: {
      header: normalizeText(header),
      named_points: namedPoints,
      bullets: buildBullets(namedPoints, schema),
    },
    source: {
      type: "manual",
      origin: "frontend-form",
      verified: false,
    },
  };
}

export function validateRequiredFields({
  name,
  code,
  header,
  namedPoints,
  schema,
}) {
  const missing = [];

  if (!normalizeText(name)) missing.push("Language name");
  if (!normalizeCode(code)) missing.push("Language code");
  if (!normalizeText(header)) missing.push("Header");

  schema.forEach((point) => {
    if (point.required && !normalizeText(namedPoints?.[point.key])) {
      missing.push(point.label);
    }
  });

  return {
    isValid: missing.length === 0,
    missing,
  };
}
