import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ShoppingCart, Star, Shirt, Cpu, Watch } from "lucide-react";
import api, { productImageUrl } from "../lib/api";
import {
  parseProductOptions,
  stockForColor,
  colorSwatchHex,
  parseColorStock,
  productOptionNames,
  priceForOption,
  lowestOptionPrice,
  hasVariablePricing,
  optionLabel,
} from "../lib/productOptions";
import { brandsForType } from "../data/laptopBrands";
import BrandSlideshow from "../components/BrandSlideshow";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import PageHero from "../components/PageHero";
import { pageHeroImages } from "../data/pageHeroImages";
import {
  productTypeLabel,
  typesForDepartment,
  STORE_DEPARTMENT_SLUGS,
  isStoreDepartment,
} from "../lib/productTypes";

const STORE_DEPARTMENTS = [
  {
    slug: "merchandise",
    name: "Merchandise",
    desc: "Branded apparel and Village NetAcad gear.",
    icon: Shirt,
  },
  {
    slug: "electronics",
    name: "Electronics",
    desc: "Laptops, tablets and devices for learning.",
    icon: Cpu,
  },
  {
    slug: "accessories",
    name: "Accessories",
    desc: "Bags, USB drives, headphones, powerbanks and cameras.",
    icon: Watch,
  },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [subcategory, setSubcategory] = useState(searchParams.get("subcategory") || "");
  const [brand, setBrand] = useState(searchParams.get("brand") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [selectedColors, setSelectedColors] = useState({});
  const { addToCart, count } = useCart();
  const onMerchandise = category === "merchandise";
  useEffect(() => {
    const paramCategory = searchParams.get("category") || "";
    const paramSubcategory = searchParams.get("subcategory") || "";
    if (paramCategory !== category) setCategory(paramCategory);
    if (paramSubcategory !== subcategory) setSubcategory(paramSubcategory);
    const paramBrand = searchParams.get("brand") || "";
    if (paramBrand !== brand) setBrand(paramBrand);
    const paramMin = searchParams.get("min_price") || "";
    const paramMax = searchParams.get("max_price") || "";
    if (paramMin !== minPrice) setMinPrice(paramMin);
    if (paramMax !== maxPrice) setMaxPrice(paramMax);
  }, [searchParams]);

  const typeBrands = category === "electronics" ? brandsForType(subcategory) : [];
  const showTypeBrands = typeBrands.length > 0;

  const parsePrice = (val) => {
    const n = parseFloat(String(val).replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const appliedMinPrice = parsePrice(searchParams.get("min_price") || "");
  const appliedMaxPrice = parsePrice(searchParams.get("max_price") || "");
  const parsedMinPrice = appliedMinPrice;
  const parsedMaxPrice = appliedMaxPrice;
  const hasPriceFilter = appliedMinPrice != null || appliedMaxPrice != null;
  const hasDraftPrice = minPrice !== "" || maxPrice !== "";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const params = { sort: sort || "newest", limit: 200 };
        const q = String(search || "").trim();
        const cat = String(category || "").trim();
        if (q) params.search = q;
        if (cat) params.category = cat;
        if (isStoreDepartment(cat) && subcategory) {
          params.subcategory = subcategory;
        }
        if (cat === "electronics" && brandsForType(subcategory).length > 0 && brand) {
          params.brand = brand;
        }
        if (parsedMinPrice != null) params.min_price = parsedMinPrice;
        if (parsedMaxPrice != null) params.max_price = parsedMaxPrice;
        const prodRes = await api.get("/products", { params });
        if (cancelled) return;
        const list = Array.isArray(prodRes.data?.products)
          ? prodRes.data.products
          : Array.isArray(prodRes.data)
            ? prodRes.data
            : [];
        setProducts(list);
        setLoadError(false);
        try {
          const catRes = await api.get("/products/meta/categories");
          if (!cancelled) {
            setCategories(Array.isArray(catRes.data) ? catRes.data : []);
          }
        } catch {
          /* categories are optional for the product grid */
        }
      } catch {
        if (cancelled) return;
        setLoadError(true);
        setProducts([]);
        toast.error("Could not load products. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [search, category, subcategory, brand, sort, parsedMinPrice, parsedMaxPrice, reloadToken]);

  const productsRef = useRef(null);
  const scrollPending = useRef(false);

  const scrollToProductsFast = () => {
    const el = productsRef.current;
    if (!el) return;
    const startY = window.scrollY;
    const targetY = el.getBoundingClientRect().top + startY - 96;
    const distance = targetY - startY;
    if (Math.abs(distance) < 4) return;
    const duration = 90;
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 2);
      window.scrollTo(0, startY + distance * eased);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  useEffect(() => {
    if (loading || !scrollPending.current) return;
    scrollPending.current = false;
    requestAnimationFrame(scrollToProductsFast);
  }, [loading]);

  const otherCategories = useMemo(
    () => categories.filter((c) => !STORE_DEPARTMENT_SLUGS.includes(c.slug)),
    [categories]
  );

  const syncPriceParams = (minVal, maxVal) => {
    const next = new URLSearchParams(searchParams);
    const minN = parseFloat(String(minVal).replace(",", "."));
    const maxN = parseFloat(String(maxVal).replace(",", "."));
    if (Number.isFinite(minN) && minN >= 0) next.set("min_price", String(minN));
    else next.delete("min_price");
    if (Number.isFinite(maxN) && maxN >= 0) next.set("max_price", String(maxN));
    else next.delete("max_price");
    setSearchParams(next, { replace: true });
  };

  const selectDepartment = (slug) => {
    scrollPending.current = Boolean(slug);
    if (slug) {
      requestAnimationFrame(scrollToProductsFast);
    }
    setCategory(slug);
    setSubcategory("");
    const next = new URLSearchParams(searchParams);
    if (slug) next.set("category", slug);
    else next.delete("category");
    next.delete("subcategory");
    next.delete("brand");
    setBrand("");
    setSearchParams(next);
  };

  const selectElectronicsType = (value) => {
    scrollPending.current = true;
    setSubcategory(value);
    setBrand("");
    const next = new URLSearchParams(searchParams);
    if (value) next.set("subcategory", value);
    else next.delete("subcategory");
    next.delete("brand");
    setSearchParams(next);
  };

  const selectBrand = (value) => {
    const nextBrand = value === brand ? "" : value;
    setBrand(nextBrand);
    const next = new URLSearchParams(searchParams);
    if (nextBrand) next.set("brand", nextBrand);
    else next.delete("brand");
    setSearchParams(next);
  };

  const getSizes = (p) => productOptionNames(p);

  const displayPrice = (p) => {
    const chosen = selectedSizes[p.id];
    const amount = Number(chosen ? priceForOption(p, chosen) : lowestOptionPrice(p));
    return {
      amount: Number.isFinite(amount) ? amount : 0,
      from: !chosen && hasVariablePricing(p),
    };
  };

  const getColors = (p) => {
    const fromColors = parseProductOptions(p.colors);
    const fromStock = parseColorStock(p.color_stock, null).map((r) => r.name);
    const seen = new Set();
    const merged = [];
    [...fromColors, ...fromStock].forEach((name) => {
      const key = String(name).trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push(String(name).trim());
    });
    return merged;
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    const sizes = getSizes(product);
    const colors = getColors(product);
    if (sizes.length > 0 && !selectedSizes[product.id]) {
      toast.error(`Please select a ${optionLabel(product).toLowerCase()} first`);
      return;
    }
    if (colors.length > 0 && !selectedColors[product.id]) {
      toast.error("Please select a colour");
      return;
    }
    const chosenColor = selectedColors[product.id];
    if (colors.length > 0 && stockForColor(product, chosenColor) < 1) {
      toast.error("That colour is out of stock");
      return;
    }
    try {
      await addToCart(
        product.id,
        1,
        selectedSizes[product.id] || undefined,
        chosenColor || undefined
      );
      toast.success("Added to cart!");
    } catch {
      toast.error("Please login to add to cart");
    }
  };

  const hero =
    category === "electronics"
      ? {
          image: pageHeroImages.electronics,
          alt: "Modern laptop for learning and everyday work",
          title: "Electronics",
          subtitle: "Laptops, tablets and devices chosen for learning and everyday work.",
        }
      : category === "accessories"
        ? {
            image: pageHeroImages.accessories,
            alt: "Headphones and device accessories",
            title: "Accessories",
            subtitle: "Bags, USB drives, headphones, powerbanks and cameras for your devices.",
          }
        : {
            image: pageHeroImages.shop,
            alt: "Village NetAcad store merchandise, electronics and accessories",
            title: category === "merchandise" ? "Merchandise" : "Village Netacad Store",
            subtitle:
              category === "merchandise"
                ? "Branded apparel and Village NetAcad gear."
                : "Shop branded merchandise, electronics and accessories that support Village NetAcad.",
          };

  return (
    <div>
      <PageHero
        key={category || "all"}
        image={hero.image}
        alt={hero.alt}
        title={hero.title}
        subtitle={hero.subtitle}
      />

      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {STORE_DEPARTMENTS.map((dept) => {
              const active = category === dept.slug;
              const Icon = dept.icon;
              return (
                <button
                  key={dept.slug}
                  type="button"
                  onClick={() => selectDepartment(active ? "" : dept.slug)}
                  className={`text-left rounded-2xl border p-5 transition ${
                    active
                      ? "border-burnt-400/50 bg-burnt-500/15"
                      : "border-white/10 bg-white/5 hover:border-burnt-400/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      active ? "bg-gradient-to-br from-burnt-400 to-primary-400" : "bg-white/10"
                    }`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">{dept.name}</h2>
                      <p className="text-sm text-gray-400 leading-relaxed">{dept.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[17.5rem_minmax(0,1fr)] gap-6 items-start">
            <aside className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden lg:sticky lg:top-24">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
                <h2 className="text-sm font-bold text-white tracking-wide uppercase">Filter</h2>
                {(category || hasPriceFilter || search) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setMinPrice("");
                      setMaxPrice("");
                      setSort("newest");
                      setCategory("");
                      setSubcategory("");
                      setBrand("");
                      setSearchParams(new URLSearchParams(), { replace: true });
                    }}
                    className="text-xs font-semibold text-burnt-300 hover:text-burnt-200 transition"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="p-4 space-y-5">
                <div>
                  <label htmlFor="shop-search" className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                    Search
                  </label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      id="shop-search"
                      type="text"
                      placeholder="Search products..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="input-field pl-9"
                    />
                  </div>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <label htmlFor="shop-category" className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                    Category
                  </label>
                  <select
                    id="shop-category"
                    value={category}
                    onChange={(e) => selectDepartment(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">All Categories</option>
                    <option value="merchandise">Merchandise</option>
                    <option value="electronics">Electronics</option>
                    <option value="accessories">Accessories</option>
                    {otherCategories.map((c) => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Price</p>
                    {hasPriceFilter || hasDraftPrice ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMinPrice("");
                          setMaxPrice("");
                          syncPriceParams("", "");
                        }}
                        className="text-xs font-semibold text-gray-400 hover:text-burnt-200 transition"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                  <div className="rounded-xl border border-white/15 bg-black/20 p-3">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 min-w-0">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-semibold">
                          R
                        </span>
                        <input
                          id="shop-min-price"
                          type="number"
                          min="0"
                          step="1"
                          inputMode="decimal"
                          aria-label="Minimum price in rand"
                          placeholder="Min"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") syncPriceParams(minPrice, maxPrice);
                          }}
                          className="input-field pl-6"
                        />
                      </div>
                      <span className="text-gray-500 text-sm flex-shrink-0">–</span>
                      <div className="relative flex-1 min-w-0">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-semibold">
                          R
                        </span>
                        <input
                          id="shop-max-price"
                          type="number"
                          min="0"
                          step="1"
                          inputMode="decimal"
                          aria-label="Maximum price in rand"
                          placeholder="Max"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") syncPriceParams(minPrice, maxPrice);
                          }}
                          className="input-field pl-6"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => syncPriceParams(minPrice, maxPrice)}
                      className="mt-3 w-full py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-burnt-400 to-primary-400 text-white hover:opacity-95 transition"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <label htmlFor="shop-sort" className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                    Sort
                  </label>
                  <select
                    id="shop-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </aside>

            <div className="min-w-0">
              <div ref={productsRef} className="scroll-mt-24" />

              {isStoreDepartment(category) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => selectElectronicsType("")}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                      !subcategory
                        ? "border-burnt-400/50 bg-burnt-500/15 text-burnt-200"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-burnt-400/30"
                    }`}
                  >
                    All {STORE_DEPARTMENTS.find((d) => d.slug === category)?.name?.toLowerCase() || category}
                  </button>
                  {typesForDepartment(category).map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => selectElectronicsType(t.value)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                        subcategory === t.value
                          ? "border-burnt-400/50 bg-burnt-500/15 text-burnt-200"
                          : "border-white/10 bg-white/5 text-gray-400 hover:border-burnt-400/30"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {showTypeBrands && (
                <div className="mb-6">
                  <BrandSlideshow
                    brands={typeBrands}
                    activeBrand={brand}
                    onSelect={selectBrand}
                    itemLabel={`${productTypeLabel(subcategory).toLowerCase()}s`}
                  />
                </div>
              )}

              {(category || hasPriceFilter) && (
                <p className="text-sm text-gray-400 mb-6">
                  Showing{" "}
                  {category ? (
                    <span className="text-burnt-300 font-semibold capitalize">
                      {STORE_DEPARTMENTS.find((d) => d.slug === category)?.name || category}
                    </span>
                  ) : (
                    <span className="text-burnt-300 font-semibold">all products</span>
                  )}
                  {subcategory ? (
                    <>
                      {" · "}
                      <span className="text-burnt-300 font-semibold">
                        {productTypeLabel(subcategory)}
                      </span>
                    </>
                  ) : null}
                  {showTypeBrands && brand ? (
                    <>
                      {" · "}
                      <span className="text-burnt-300 font-semibold">{brand}</span>
                    </>
                  ) : null}
                  {hasPriceFilter ? (
                    <>
                      {" · "}
                      <span className="text-burnt-300 font-semibold">
                        {parsedMinPrice != null && parsedMaxPrice != null
                          ? `R${parsedMinPrice.toLocaleString()} – R${parsedMaxPrice.toLocaleString()}`
                          : parsedMinPrice != null
                            ? `from R${parsedMinPrice.toLocaleString()}`
                            : `up to R${parsedMaxPrice.toLocaleString()}`}
                      </span>
                    </>
                  ) : null}
                </p>
              )}

              {loading && products.length === 0 ? (
                <div className="text-center py-20">
                  <div className="animate-spin h-8 w-8 border-4 border-burnt-500 border-t-transparent rounded-full mx-auto" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-500 text-lg">
                    {loadError ? "Could not load products." : "No products found in this category yet."}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {loadError
                      ? "Check that MySQL is running, then try again."
                      : "New stock is added regularly. Please check back soon."}
                  </p>
                  {loadError ? (
                    <button
                      type="button"
                      onClick={() => setReloadToken((n) => n + 1)}
                      className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold border border-burnt-400/50 bg-burnt-500/15 text-burnt-200 hover:border-burnt-400"
                    >
                      Try again
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 items-stretch transition-opacity ${loading ? "opacity-50" : ""}`}>
                  {products.map((p) => (
                    <Link
                      to={`/shop/${p.slug}`}
                      key={p.id}
                      className="group glass rounded-xl overflow-hidden hover:border-burnt-500/35 transition-all duration-500 hover:-translate-y-0.5 h-full flex flex-col text-left"
                    >
                      <div className="aspect-[4/3] glass-clear overflow-hidden border-0 shadow-none flex-shrink-0">
                        {p.image ? (
                          <img
                            src={productImageUrl(p.image, { thumb: true })}
                            alt={p.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <ShoppingCart size={22} />
                          </div>
                        )}
                      </div>
                      <div className="p-2 flex flex-col flex-1 min-h-0">
                        <p className="text-[9px] text-burnt-600 font-semibold mb-0.5 uppercase tracking-wider truncate">
                          {p.category_name || "General"}
                          {p.subcategory ? ` · ${productTypeLabel(p.subcategory)}` : ""}
                        </p>
                        <h3 className="font-bold text-xs mb-0.5 line-clamp-2 min-h-[2rem] leading-tight">{p.name}</h3>
                        <div className="flex items-center gap-1 mb-1">
                          <Star size={10} className="fill-yellow-400 text-yellow-400 flex-shrink-0" />
                          <span className="text-[10px] text-gray-500">{p.avg_rating || "0"} ({p.review_count || 0})</span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="font-black text-sm text-burnt-600">
                            {displayPrice(p).from ? <span className="text-[10px] font-semibold text-gray-400 mr-0.5">from</span> : null}
                            R{displayPrice(p).amount.toFixed(2)}
                          </span>
                          {p.compare_price ? (
                            <span className="text-[10px] text-gray-500 line-through">R{Number(p.compare_price).toFixed(2)}</span>
                          ) : null}
                        </div>

                        <div className="flex-1 flex flex-col gap-1.5 mb-1.5">
                          <div>
                            {getSizes(p).length > 0 ? (
                              <>
                                <p className="text-[9px] text-gray-500 mb-0.5 font-medium">
                                  {optionLabel(p) === "Size" ? "Sizes" : "Capacity"}
                                </p>
                                <div className="flex flex-wrap gap-1 content-start">
                                  {getSizes(p).map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedSizes((prev) => ({ ...prev, [p.id]: s }));
                                      }}
                                      className={`min-w-[1.5rem] px-1 py-0.5 rounded border text-[9px] font-bold transition-all ${
                                        selectedSizes[p.id] === s
                                          ? "bg-gradient-to-r from-burnt-400 to-primary-400 border-transparent text-white"
                                          : "border-white/20 bg-white/5 hover:border-burnt-600/35"
                                      }`}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              </>
                            ) : null}
                          </div>
                          <div>
                            {getColors(p).length > 0 ? (
                              <>
                                <p className="text-[9px] text-gray-500 mb-0.5 font-medium">
                                  Colours{selectedColors[p.id] ? `: ${selectedColors[p.id]}` : ""}
                                </p>
                                <div className="flex flex-wrap gap-1 content-start">
                                  {getColors(p).map((c) => {
                                    const cStock = stockForColor(p, c);
                                    const swatch = colorSwatchHex(c);
                                    const isLight = ["white", "cream", "beige", "yellow", "silver"].some((n) =>
                                      String(c).trim().toLowerCase().includes(n)
                                    );
                                    return (
                                      <button
                                        key={c}
                                        type="button"
                                        disabled={cStock < 1}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setSelectedColors((prev) => ({ ...prev, [p.id]: c }));
                                        }}
                                        className={`inline-flex items-center justify-center p-0.5 rounded-full border-2 transition-all disabled:opacity-40 ${
                                          selectedColors[p.id] === c
                                            ? "border-burnt-400"
                                            : "border-transparent hover:border-burnt-600/50"
                                        }`}
                                        title={cStock < 1 ? `${c} — out of stock` : c}
                                      >
                                        <span
                                          className={`inline-block w-4 h-4 rounded-full flex-shrink-0 border ${
                                            isLight ? "border-gray-400" : "border-white/40"
                                          } ${cStock < 1 ? "opacity-50" : ""}`}
                                          style={{ backgroundColor: swatch }}
                                          aria-hidden
                                        />
                                        <span className="sr-only">{c}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(e, p)}
                          className="mt-auto w-full py-1 rounded-md bg-gradient-to-r from-burnt-400 to-primary-400 font-bold text-[11px] hover:scale-[1.02] transition-all duration-300 shadow-[0_0_12px_rgba(14,165,233,0.22)] flex items-center justify-center gap-1"
                        >
                          <ShoppingCart size={12} /> Add to Cart
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {onMerchandise ? (
        <Link
          to="/cart"
          className="fixed bottom-5 right-4 sm:bottom-8 sm:right-8 z-40 neon-btn inline-flex items-center gap-2 px-4 py-3 rounded-full font-bold text-sm shadow-[0_0_28px_rgba(34,211,238,0.45)]"
          aria-label={count > 0 ? `Open cart, ${count} items` : "Open cart"}
        >
          <ShoppingCart size={18} />
          <span>Cart</span>
          {count > 0 ? (
            <span className="min-w-[1.35rem] h-5 px-1 rounded-full bg-black/35 text-white text-xs flex items-center justify-center">
              {count}
            </span>
          ) : null}
        </Link>
      ) : null}
    </div>
  );
}
