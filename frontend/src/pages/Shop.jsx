import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ShoppingCart, Star, Shirt, Cpu } from "lucide-react";
import api from "../lib/api";
import { parseProductOptions } from "../lib/productOptions";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import PageHero from "../components/PageHero";
import { pageHeroImages } from "../data/pageHeroImages";
import {
  productTypeLabel,
  typesForDepartment,
} from "../lib/productTypes";

const STORE_DEPARTMENTS = [
  {
    slug: "merchandise",
    name: "Merchandise",
    desc: "Branded apparel, bags, caps and Village NetAcad gear.",
    icon: Shirt,
  },
  {
    slug: "electronics",
    name: "Electronics",
    desc: "Tech tools and devices that support learning and training.",
    icon: Cpu,
  },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [subcategory, setSubcategory] = useState(searchParams.get("subcategory") || "");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState({});
  const { addToCart } = useCart();

  useEffect(() => {
    const paramCategory = searchParams.get("category") || "";
    const paramSubcategory = searchParams.get("subcategory") || "";
    if (paramCategory !== category) setCategory(paramCategory);
    if (paramSubcategory !== subcategory) setSubcategory(paramSubcategory);
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      try {
        const params = { search, category, sort };
        if ((category === "electronics" || category === "merchandise") && subcategory) {
          params.subcategory = subcategory;
        }
        const [prodRes, catRes] = await Promise.all([
          api.get("/products", { params }),
          api.get("/products/meta/categories"),
        ]);
        setProducts(Array.isArray(prodRes.data?.products) ? prodRes.data.products : []);
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      } catch { /* empty */ }
      setLoading(false);
    };
    load();
  }, [search, category, subcategory, sort]);

  const otherCategories = useMemo(
    () => categories.filter((c) => !["merchandise", "electronics"].includes(c.slug)),
    [categories]
  );

  const selectDepartment = (slug) => {
    setCategory(slug);
    setSubcategory("");
    const next = new URLSearchParams(searchParams);
    if (slug) next.set("category", slug);
    else next.delete("category");
    next.delete("subcategory");
    setSearchParams(next);
  };

  const selectElectronicsType = (value) => {
    setSubcategory(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set("subcategory", value);
    else next.delete("subcategory");
    setSearchParams(next);
  };

  const getSizes = (p) => {
    if (String(p.category_slug || "").toLowerCase() === "electronics") return [];
    return parseProductOptions(p.sizes);
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    const sizes = getSizes(product);
    if (sizes.length > 0 && !selectedSizes[product.id]) {
      toast.error("Please select a size first");
      return;
    }
    try {
      await addToCart(product.id, 1, selectedSizes[product.id] || undefined);
      toast.success("Added to cart!");
    } catch {
      toast.error("Please login to add to cart");
    }
  };

  return (
    <div>
      <PageHero
        image={pageHeroImages.shop}
        alt="Village NetAcad store merchandise and electronics"
        title="Village Netacad Store"
        subtitle="Shop branded merchandise and electronics that support Village NetAcad."
      />

      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
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

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
            </div>
            <select
              value={category}
              onChange={(e) => selectDepartment(e.target.value)}
              className="input-field sm:w-56"
            >
              <option value="">All Categories</option>
              <option value="merchandise">Merchandise</option>
              <option value="electronics">Electronics</option>
              {otherCategories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field sm:w-48">
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {(category === "electronics" || category === "merchandise") && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                type="button"
                onClick={() => selectElectronicsType("")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                  !subcategory
                    ? "border-burnt-400/50 bg-burnt-500/15 text-burnt-200"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-burnt-400/30"
                }`}
              >
                All {category === "electronics" ? "electronics" : "merchandise"}
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

          {category && (
            <p className="text-sm text-gray-400 mb-6">
              Showing{" "}
              <span className="text-burnt-300 font-semibold capitalize">
                {STORE_DEPARTMENTS.find((d) => d.slug === category)?.name || category}
              </span>
              {subcategory ? (
                <>
                  {" · "}
                  <span className="text-burnt-300 font-semibold">
                    {productTypeLabel(subcategory)}
                  </span>
                </>
              ) : null}
            </p>
          )}

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-burnt-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No products found in this category yet.</p>
              <p className="text-sm text-gray-600 mt-2">Admins can add Merchandise and Electronics products from the Products panel.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p) => (
                <Link to={`/shop/${p.slug}`} key={p.id} className="group glass rounded-[2rem] overflow-hidden hover:border-burnt-500/35 transition-all duration-700 hover:-translate-y-3">
                  <div className="aspect-square glass-clear overflow-hidden border-0 shadow-none">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <ShoppingCart size={48} />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-burnt-600 font-semibold mb-1 uppercase tracking-wider">
                      {p.category_name || "General"}
                      {p.subcategory ? ` · ${productTypeLabel(p.subcategory)}` : ""}
                    </p>
                    <h3 className="font-bold text-lg mb-1 line-clamp-1">{p.name}</h3>
                    <div className="flex items-center gap-1 mb-3">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-500">{p.avg_rating || "0"} ({p.review_count || 0})</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xl text-burnt-600">R{Number(p.price).toFixed(2)}</span>
                        {p.compare_price && <span className="text-sm text-gray-500 line-through">R{Number(p.compare_price).toFixed(2)}</span>}
                      </div>
                    </div>
                    {getSizes(p).length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1.5 font-medium">Sizes</p>
                        <div className="flex flex-wrap gap-1.5">
                          {getSizes(p).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedSizes((prev) => ({ ...prev, [p.id]: s }));
                              }}
                              className={`min-w-[2.25rem] px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                                selectedSizes[p.id] === s
                                  ? "bg-gradient-to-r from-burnt-400 to-primary-400 border-transparent text-white shadow-[0_0_12px_rgba(14,165,233,0.25)]"
                                  : "border-white/20 bg-white/5 hover:border-burnt-600/35"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <button onClick={(e) => handleAddToCart(e, p)} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-burnt-400 to-primary-400 font-bold text-sm hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(14,165,233,0.28)] flex items-center justify-center gap-2">
                      <ShoppingCart size={15} /> Add to Cart
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
