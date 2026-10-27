export const FONT_OPTIONS = [
  { value: "display", label: "Space Grotesk (modern)", family: '"Space Grotesk", Manrope, system-ui, sans-serif' },
  { value: "sans", label: "Manrope (clean)", family: "Manrope, system-ui, sans-serif" },
  { value: "serif", label: "Georgia (classic serif)", family: 'Georgia, "Times New Roman", serif' },
  { value: "mono", label: "Monospace (code)", family: 'ui-monospace, Consolas, "Courier New", monospace' },
  { value: "system", label: "System default", family: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
];

export const FONT_STYLE_OPTIONS = [
  { value: "normal", label: "Regular" },
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
  { value: "bold-italic", label: "Bold italic" },
];

/** Inline style for a saved font + style pair; falls back to the given defaults. */
export function fontStyleFor(font, style, fallbackFont = "sans", fallbackStyle = "normal") {
  const option = FONT_OPTIONS.find((o) => o.value === font) || FONT_OPTIONS.find((o) => o.value === fallbackFont);
  const s = FONT_STYLE_OPTIONS.some((o) => o.value === style) ? style : fallbackStyle;
  return {
    fontFamily: option?.family,
    fontWeight: s === "bold" || s === "bold-italic" ? 700 : 400,
    fontStyle: s === "italic" || s === "bold-italic" ? "italic" : "normal",
  };
}
