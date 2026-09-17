import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ShoppingCart, Heart, Star, Send } from "lucide-react";
import api from "../lib/api";
import { parseProductOptions, stockForColor, colorSwatchHex, parseColorStock } from "../lib/productOptions";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { productTypeLabel } from "../lib/productTypes";

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/products/${slug}`);
        setProduct(res.data);
        const reviewRes = await api.get(`/reviews/product/${res.data.id}`);
        setReviews(Array.isArray(reviewRes.data) ? reviewRes.data : []);
        const isApparel = String(res.data.category_slug || "").toLowerCase() === "merchandise";
        const nextSizes = isApparel ? parseProductOptions(res.data.sizes) : [];
        const fromColors = parseProductOptions(res.data.colors);
        const fromStock = parseColorStock(res.data.color_stock, null).map((r) => r.name);
        const seen = new Set();
        const nextColors = [];
        [...fromColors, ...fromStock].forEach((name) => {
          const key = String(name).trim().toLowerCase();
          if (!key || seen.has(key)) return;
          seen.add(key);
          nextColors.push(String(name).trim());
        });
        if (nextSizes.length) setSize(nextSizes[0]);
        if (nextColors.length) setColor(nextColors[0]);
        setQty(1);
      } catch { /* empty */ }
      setLoading(false);
    };
    load();
  }, [slug]);

  const sizes =
    product && String(product.category_slug || "").toLowerCase() === "merchandise"
      ? parseProductOptions(product.sizes)
      : [];
  const colors = product
    ? (() => {
        const fromColors = parseProductOptions(product.colors);
        const fromStock = parseColorStock(product.color_stock, null).map((r) => r.name);
        const seen = new Set();
        const merged = [];
        [...fromColors, ...fromStock].forEach((name) => {
          const key = String(name).trim().toLowerCase();
          if (!key || seen.has(key)) return;
          seen.add(key);
          merged.push(String(name).trim());
        });
        return merged;
      })()
    : [];
  const availableStock = product ? stockForColor(product, colors.length ? color : null) : 0;

  const handleAdd = async () => {
    try {
      if (sizes.length && !size) {
        toast.error("Please select a size");
        return;
      }
      if (colors.length && !color) {
        toast.error("Please select a colour");
        return;
      }
      if (availableStock < 1) {
        toast.error(colors.length ? "This colour is out of stock" : "Out of stock");
        return;
      }
      if (qty > availableStock) {
        toast.error(`Only ${availableStock} left${colors.length ? " in this colour" : ""}`);
        return;
      }
      await addToCart(product.id, qty, size || undefined, color || undefined);
      toast.success("Added to cart!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Please login to add to cart");
    }
  };

  const handleWishlist = async () => {
    try {
      const res = await api.post("/wishlist/toggle", { product_id: product.id });
      toast.success(res.data.message);
    } catch { toast.error("Please login first"); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      await api.post("/reviews", { product_id: product.id, rating, comment });
      toast.success("Review added!");
      const res = await api.get(`/reviews/product/${product.id}`);
      setReviews(Array.isArray(res.data) ? res.data : []);
      setComment("");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to add review"); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-burnt-500 border-t-transparent rounded-full" /></div>;
  if (!product) return <div className="text-center py-20"><p className="text-gray-500 text-lg">Product not found.</p></div>;

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";

  return (
    <div className="section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square glass rounded-[2rem] overflow-hidden">
            {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><ShoppingCart size={80} /></div>}
          </div>

          <div>
            <p className="text-sm text-burnt-600 font-semibold mb-2 uppercase tracking-wider">
              {[product.category_name, product.subcategory ? productTypeLabel(product.subcategory) : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <h1 className="text-4xl font-black mb-2">{product.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={16} className={i < Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-600"} />)}</div>
              <span className="text-sm text-gray-400">{avgRating} ({reviews.length} reviews)</span>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl font-black text-burnt-600">R{Number(product.price).toFixed(2)}</span>
              {product.compare_price && <span className="text-lg text-gray-500 line-through">R{Number(product.compare_price).toFixed(2)}</span>}
            </div>

            {product.description && <p className="text-gray-400 mb-6 leading-8">{product.description}</p>}

            {sizes.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-gray-300">Size</label>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={`min-w-[2.5rem] px-3 py-1.5 rounded-xl border text-sm font-bold transition-all duration-300 ${
                        size === s
                          ? "bg-gradient-to-r from-burnt-400 to-primary-400 text-white border-transparent shadow-[0_0_15px_rgba(14,165,233,0.28)]"
                          : "border-white/20 bg-white/5 hover:border-burnt-600/35"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {colors.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-300">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((c) => {
                    const cStock = stockForColor(product, c);
                    const swatch = colorSwatchHex(c);
                    const isLight = ["white", "cream", "beige", "yellow", "silver"].some((n) =>
                      String(c).trim().toLowerCase().includes(n)
                    );
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setColor(c);
                          setQty(1);
                        }}
                        disabled={cStock < 1}
                        className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-bold transition-all duration-300 disabled:opacity-40 ${
                          color === c
                            ? "bg-gradient-to-r from-burnt-400 to-primary-400 text-white border-transparent shadow-[0_0_15px_rgba(14,165,233,0.28)]"
                            : "border-white/20 hover:border-burnt-600/35"
                        }`}
                        title={cStock < 1 ? `${c} — out of stock` : c}
                      >
                        <span
                          className={`inline-block w-5 h-5 rounded-full flex-shrink-0 border-2 ${
                            isLight ? "border-gray-400" : "border-white/40"
                          } ${cStock < 1 ? "opacity-50" : ""}`}
                          style={{ backgroundColor: swatch }}
                          aria-hidden
                        />
                        <span>{c}</span>
                        <span className="font-medium opacity-80">({cStock})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-white/20 rounded-xl bg-white/5">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 text-lg font-bold hover:bg-white/10 transition-colors rounded-l-xl"
                >
                  -
                </button>
                <span className="px-4 py-2 font-bold">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(Math.min(availableStock || 1, qty + 1))}
                  className="px-3 py-2 text-lg font-bold hover:bg-white/10 transition-colors rounded-r-xl"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-400">
                {availableStock > 0
                  ? `${availableStock} in stock${colors.length && color ? ` (${color})` : ""}`
                  : "Out of stock"}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAdd}
                disabled={availableStock < 1}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>
              <button type="button" onClick={handleWishlist} className="btn-secondary !px-4"><Heart size={18} /></button>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-black mb-6 bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">Reviews ({reviews.length})</h2>
          {user && (
            <form onSubmit={handleReview} className="card mb-8">
              <h3 className="font-bold mb-4">Write a Review</h3>
              <div className="flex gap-1 mb-3">{[1,2,3,4,5].map((r) => <button key={r} type="button" onClick={() => setRating(r)}><Star size={20} className={r <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"} /></button>)}</div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="input-field mb-3" rows={3} placeholder="Share your experience..." />
              <button type="submit" className="btn-primary text-sm inline-flex items-center gap-2"><Send size={16} /> Submit Review</button>
            </form>
          )}
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-burnt-400 to-primary-400 rounded-full flex items-center justify-center"><span className="text-sm font-bold text-white">{r.user_name?.[0]}</span></div>
                  <div>
                    <p className="font-bold text-sm">{r.user_name}</p>
                    <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={12} className={i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"} />)}</div>
                  </div>
                </div>
                {r.comment && <p className="text-sm text-gray-400">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
