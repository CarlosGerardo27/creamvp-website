const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertNonEmpty(value: string, fieldName: string): void {
  if (!value || !value.trim()) {
    throw new Error(`El campo ${fieldName} es obligatorio.`);
  }
}

export function assertValidSlug(slug: string): void {
  if (!SLUG_REGEX.test(slug)) {
    throw new Error("Slug invalido. Usa solo minusculas, numeros y guiones.");
  }
}

export function parseJsonObject(raw: string, fieldName: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`JSON invalido en ${fieldName}.`);
  }

  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error(`El campo ${fieldName} debe ser un objeto JSON.`);
  }

  return parsed as Record<string, unknown>;
}

export function parseOptionalIsoDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Fecha de programacion invalida.");
  }
  return parsed.toISOString();
}
