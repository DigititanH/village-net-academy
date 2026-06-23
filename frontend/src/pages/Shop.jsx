import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ShoppingCart, Star } from "lucide-react";
import api, { getImageUrl } from "../lib/api";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

export default function Shop() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState({});
  const { addToCart } = useCart();

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get("/products", { params: { search, category, sort } }),
          api.get("/products/meta/categories"),
        ]);
        setProducts(prodRes.data.products);
        setCategories(catRes.data);
      } catch { /* empty */ }
      setLoading(false);
    };
    load();
  }, [search, category, sort]);

  const getSizes = (p) => {
    try { return p.sizes ? JSON.parse(p.sizes) : []; } catch { return []; }
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
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 glass-section" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Village Netacad Store</h1>
          <p className="text-lg text-gray-400">Support Village Netacad by purchasing our branded merchandise.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field sm:w-48">
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field sm:w-48">
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-burnt-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p) => (
                <Link to={`/shop/${p.slug}`} key={p.id} className="group glass rounded-[2rem] overflow-hidden hover:border-burnt-500/35 transition-all duration-700 hover:-translate-y-3">
                  <div className="aspect-square glass-clear overflow-hidden border-0 shadow-none">
                    {p.image ? (
                      <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <ShoppingCart size={48} />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-burnt-600 font-semibold mb-1 uppercase tracking-wider">{p.category_name || "General"}</p>
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
                        <select
                          value={selectedSizes[p.id] || ""}
                          onClick={(e) => e.preventDefault()}
                          onChange={(e) => { e.preventDefault(); setSelectedSizes((prev) => ({ ...prev, [p.id]: e.target.value })); }}
                          className="select-field w-full text-sm py-2 px-3"
                        >
                          <option value="">Select Size</option>
                          {getSizes(p).map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    )}
                    <button onClick={(e) => handleAddToCart(e, p)} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-burnt-400 to-burnt-700 font-bold text-sm hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(14,165,233,0.28)] flex items-center justify-center gap-2">
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
