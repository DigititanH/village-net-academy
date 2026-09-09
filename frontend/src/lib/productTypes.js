export const ELECTRONICS_TYPES = [
  { value: "laptop", label: "Laptop" },
  { value: "tablet", label: "Tablet" },
  { value: "accessories", label: "Accessories" },
];

export const MERCHANDISE_TYPES = [
  { value: "hoodie", label: "Hoodie" },
  { value: "t-shirt", label: "T-shirt" },
  { value: "cap", label: "Cap" },
  { value: "golf-t-shirt", label: "Golf t-shirt" },
];

const ALL_TYPE_LABELS = Object.fromEntries(
  [...ELECTRONICS_TYPES, ...MERCHANDISE_TYPES].map((t) => [t.value, t.label])
);

export function productTypeLabel(value) {
  if (!value) return "";
  return ALL_TYPE_LABELS[value] || value;
}

export function typesForDepartment(slug) {
  if (slug === "electronics") return ELECTRONICS_TYPES;
  if (slug === "merchandise") return MERCHANDISE_TYPES;
  return [];
}
