/**
 * Parse product sizes/colors from DB.
 * Supports JSON arrays, comma-separated text, or a single plain value.
 */
export function parseProductOptions(value) {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "object" && v && v.name != null ? String(v.name) : String(v)).trim())
      .filter(Boolean);
  }

  const raw = String(value).trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((v) => (typeof v === "object" && v && v.name != null ? String(v.name) : String(v)).trim())
        .filter(Boolean);
    }
    if (parsed && typeof parsed === "object") {
      return Object.keys(parsed).map((k) => String(k).trim()).filter(Boolean);
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

/**
 * Parse per-colour stock map from products.color_stock JSON.
 * Returns [{ name, stock }]
 */
export function parseColorStock(colorStock, colorsFallback) {
  const rows = [];
  if (colorStock != null && colorStock !== "") {
    try {
      const parsed = typeof colorStock === "string" ? JSON.parse(colorStock) : colorStock;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        Object.entries(parsed).forEach(([name, stock]) => {
          const n = String(name).trim();
          if (n) rows.push({ name: n, stock: String(Math.max(0, parseInt(stock, 10) || 0)) });
        });
      } else if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (item && typeof item === "object") {
            const n = String(item.name || "").trim();
            if (n) rows.push({ name: n, stock: String(Math.max(0, parseInt(item.stock ?? item.qty ?? 0, 10) || 0)) });
          }
        });
      }
    } catch {
      /* ignore */
    }
  }
  if (rows.length) return rows;

  const names = parseProductOptions(colorsFallback);
  return names.map((name) => ({ name, stock: "0" }));
}

/** Available units for a selected colour (falls back to total stock). */
export function stockForColor(product, color) {
  const map = parseColorStock(product?.color_stock, null);
  if (!map.length) return Math.max(0, Number(product?.stock) || 0);
  const match = map.find((r) => r.name.toLowerCase() === String(color || "").trim().toLowerCase());
  return match ? Math.max(0, parseInt(match.stock, 10) || 0) : 0;
}

/** CSS colour for a named product colour (Red → red dot, etc.). */
export function colorSwatchHex(name) {
  const key = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
  const map = {
    red: "#ef4444",
    "bright red": "#ef4444",
    crimson: "#dc2626",
    maroon: "#7f1d1d",
    black: "#111111",
    white: "#f5f5f5",
    grey: "#9ca3af",
    gray: "#9ca3af",
    charcoal: "#374151",
    silver: "#c0c0c0",
    navy: "#1e3a8a",
    blue: "#3b82f6",
    "light blue": "#93c5fd",
    "dark blue": "#1e40af",
    sky: "#38bdf8",
    royal: "#2563eb",
    green: "#22c55e",
    "dark green": "#166534",
    olive: "#6b8e23",
    lime: "#84cc16",
    yellow: "#eab308",
    gold: "#f59e0b",
    orange: "#f97316",
    purple: "#a855f7",
    violet: "#8b5cf6",
    pink: "#ec4899",
    rose: "#f43f5e",
    brown: "#92400e",
    beige: "#d6c4a8",
    khaki: "#c3b091",
    cream: "#fffdd0",
    ivory: "#fffff0",
    teal: "#14b8a6",
    cyan: "#06b6d4",
    turquoise: "#2dd4bf",
    magenta: "#d946ef",
    burgundy: "#9f1239",
    coral: "#fb7185",
    peach: "#fdba74",
    mustard: "#ca8a04",
  };
  if (map[key]) return map[key];
  if (key.includes("red") || key.includes("burgundy")) return "#ef4444";
  if (key.includes("blue") || key.includes("navy")) return "#3b82f6";
  if (key.includes("green") || key.includes("olive")) return "#22c55e";
  if (key.includes("black") || key.includes("charcoal")) return "#111111";
  if (key.includes("white") || key.includes("ivory") || key.includes("cream")) return "#f5f5f5";
  if (key.includes("yellow") || key.includes("gold") || key.includes("mustard")) return "#eab308";
  if (key.includes("orange") || key.includes("peach")) return "#f97316";
  if (key.includes("pink") || key.includes("rose") || key.includes("coral")) return "#ec4899";
  if (key.includes("purple") || key.includes("violet") || key.includes("magenta")) return "#a855f7";
  if (key.includes("brown") || key.includes("beige") || key.includes("khaki")) return "#92400e";
  if (key.includes("grey") || key.includes("gray") || key.includes("silver")) return "#9ca3af";
  if (key.includes("teal") || key.includes("cyan") || key.includes("turquoise")) return "#14b8a6";
  return "#94a3b8";
}
