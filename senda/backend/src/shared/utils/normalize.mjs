export function normalizeOptionalText(value) {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

export function normalizeIsoTimestamp(value) {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 'INVALID';
  return date.toISOString();
}

export function buildAuthEmail(identifier) {
  return `${String(identifier).toLowerCase().trim().replace(/\s+/g, '-')}@senda.internal`;
}
