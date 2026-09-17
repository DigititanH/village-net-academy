export const ELECTRONICS_TYPES = [
  { value: "laptop", label: "Laptop" },
  { value: "tablet", label: "Tablet" },
];

export const MERCHANDISE_TYPES = [
  { value: "hoodie", label: "Hoodie" },
  { value: "t-shirt", label: "T-shirt" },
  { value: "cap", label: "Cap" },
  { value: "golf-t-shirt", label: "Golf t-shirt" },
];

export const ACCESSORIES_TYPES = [
  { value: "bags", label: "Bags" },
  { value: "usb", label: "USB" },
  { value: "headphones", label: "Headphones" },
  { value: "powerbank", label: "Powerbank" },
  { value: "cameras", label: "Cameras" },
];

export const STORE_DEPARTMENT_SLUGS = ["merchandise", "electronics", "accessories"];

const ALL_TYPE_LABELS = Object.fromEntries(
  [...ELECTRONICS_TYPES, ...MERCHANDISE_TYPES, ...ACCESSORIES_TYPES].map((t) => [t.value, t.label])
);

export function productTypeLabel(value) {
  if (!value) return "";
  return ALL_TYPE_LABELS[value] || value;
}

export function typesForDepartment(slug) {
  if (slug === "electronics") return ELECTRONICS_TYPES;
  if (slug === "merchandise") return MERCHANDISE_TYPES;
  if (slug === "accessories") return ACCESSORIES_TYPES;
  return [];
}

/** Apparel merch types that use size pickers */
export function merchandiseUsesSizes(subcategory) {
  return ["hoodie", "t-shirt", "cap", "golf-t-shirt"].includes(String(subcategory || ""));
}

export function isStoreDepartment(slug) {
  return STORE_DEPARTMENT_SLUGS.includes(String(slug || "").toLowerCase());
}
