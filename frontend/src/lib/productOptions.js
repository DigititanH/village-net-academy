/**
 * Parse product sizes/colors from DB.
 * Supports JSON arrays, comma-separated text, or a single plain value.
 */
export function parseProductOptions(value) {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }

  const raw = String(value).trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((v) => String(v).trim()).filter(Boolean);
    }
    if (parsed != null && parsed !== "") {
      return [String(parsed).trim()];
    }
  } catch {
    /* plain text */
  }

  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
