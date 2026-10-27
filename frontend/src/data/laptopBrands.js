/** Brands carried by Mustek and Pinnacle (keep in sync with backend-php/lib/Brands.php). */
const BRAND = {
  HP: { name: "HP", logo: "/brands/hp.svg" },
  Lenovo: { name: "Lenovo", logo: "/brands/lenovo.svg" },
  Dell: { name: "Dell", logo: "/brands/dell.svg" },
  Asus: { name: "Asus", logo: "/brands/asus.svg" },
  Acer: { name: "Acer", logo: "/brands/acer.svg" },
  Apple: { name: "Apple", logo: "/brands/apple.svg" },
  Samsung: { name: "Samsung", logo: "/brands/samsung.svg" },
  Huawei: { name: "Huawei", logo: "/brands/huawei.svg" },
  HONOR: { name: "HONOR", logo: "/brands/honor.svg" },
  MSI: { name: "MSI", logo: "/brands/msi.svg" },
  Mecer: { name: "Mecer", logo: "/brands/mecer.png", dark: true },
  Proline: { name: "Proline", logo: "/brands/proline.png" },
  Dynabook: { name: "Dynabook", logo: "/brands/dynabook.png" },
  Fujitsu: { name: "Fujitsu", logo: "/brands/fujitsu.svg" },
  Gigabyte: { name: "Gigabyte", logo: null },
};

const withSuppliers = (name, suppliers) => ({ ...BRAND[name], suppliers });

export const LAPTOP_BRANDS = [
  withSuppliers("HP", ["Pinnacle"]),
  withSuppliers("Lenovo", ["Mustek", "Pinnacle"]),
  withSuppliers("Dell", ["Pinnacle"]),
  withSuppliers("Asus", ["Mustek", "Pinnacle"]),
  withSuppliers("Acer", ["Mustek"]),
  withSuppliers("Apple", ["Mustek"]),
  withSuppliers("Samsung", ["Mustek"]),
  withSuppliers("Huawei", ["Mustek"]),
  withSuppliers("HONOR", ["Mustek"]),
  withSuppliers("MSI", ["Mustek"]),
  withSuppliers("Mecer", ["Mustek"]),
  withSuppliers("Proline", ["Pinnacle"]),
  withSuppliers("Dynabook", ["Mustek"]),
  withSuppliers("Fujitsu", ["Mustek"]),
  withSuppliers("Gigabyte", ["Mustek"]),
];

export const TABLET_BRANDS = [
  withSuppliers("Apple", ["Mustek"]),
  withSuppliers("Samsung", ["Mustek"]),
  withSuppliers("Lenovo", ["Mustek", "Pinnacle"]),
  withSuppliers("Huawei", ["Mustek", "Pinnacle"]),
  withSuppliers("Acer", ["Mustek"]),
  withSuppliers("Proline", ["Pinnacle"]),
];

const BRANDS_BY_TYPE = { laptop: LAPTOP_BRANDS, tablet: TABLET_BRANDS };

/** Brand circles for an electronics type ("laptop" / "tablet"); empty when the type has none. */
export const brandsForType = (type) => BRANDS_BY_TYPE[String(type || "").toLowerCase()] || [];

export const laptopBrandNames = LAPTOP_BRANDS.map((b) => b.name);
