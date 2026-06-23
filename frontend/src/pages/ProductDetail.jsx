import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ShoppingCart, Heart, Star, Send } from "lucide-react";
import api, { getImageUrl } from "../lib/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

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
        setReviews(reviewRes.data);
        const sizes = res.data.sizes ? JSON.parse(res.data.sizes) : [];
        const colors = res.data.colors ? JSON.parse(res.data.colors) : [];
        if (sizes.length) setSize(sizes[0]);
        if (colors.length) setColor(colors[0]);
      } catch { /* empty */ }
      setLoading(false);
    };
    load();
  }, [slug]);

  const handleAdd = async () => {
    try {
      await addToCart(product.id, qty, undefined, color || undefined);
      toast.success("Added to cart!");
    } catch { toast.error("Please login to add to cart"); }
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
      setReviews(res.data);
      setComment("");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to add review"); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-burnt-500 border-t-transparent rounded-full" /></div>;
  if (!product) return <div className="text-center py-20"><p className="text-gray-500 text-lg">Product not found.</p></div>;

  const sizes = product.sizes ? JSON.parse(product.sizes) : [];
  const colors = product.colors ? JSON.parse(product.colors) : [];
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";

  return (
    <div className="section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square glass rounded-[2rem] overflow-hidden">
            {product.image ? <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><ShoppingCart size={80} /></div>}
          </div>

          <div>
            <p className="text-sm text-burnt-600 font-semibold mb-2 uppercase tracking-wider">{product.category_name}</p>
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
                <label className="block text-sm font-semibold mb-2 text-gray-300">Available Sizes</label>
                <div className="flex gap-2 flex-wrap">{sizes.map((s) => <span key={s} className="px-3 py-1.5 rounded-xl border border-white/20 text-sm font-bold bg-white/5">{s}</span>)}</div>
              </div>
            )}

            {colors.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-300">Color</label>
                <div className="flex gap-2">{colors.map((c) => <button key={c} onClick={() => setColor(c)} className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all duration-300 ${color === c ? "bg-gradient-to-r from-burnt-400 to-burnt-700 text-white border-transparent shadow-[0_0_15px_rgba(14,165,233,0.28)]" : "border-white/20 hover:border-burnt-600/35"}`}>{c}</button>)}</div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-white/20 rounded-xl bg-white/5">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-lg font-bold hover:bg-white/10 transition-colors rounded-l-xl">-</button>
                <span className="px-4 py-2 font-bold">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-3 py-2 text-lg font-bold hover:bg-white/10 transition-colors rounded-r-xl">+</button>
              </div>
              <span className="text-sm text-gray-400">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</span>
            </div>

            <div className="flex gap-3">
              <button onClick={handleAdd} disabled={product.stock < 1} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"><ShoppingCart size={18} /> Add to Cart</button>
              <button onClick={handleWishlist} className="btn-secondary !px-4"><Heart size={18} /></button>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-black mb-6 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Reviews ({reviews.length})</h2>
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
                  <div className="w-8 h-8 bg-gradient-to-r from-burnt-400 to-burnt-700 rounded-full flex items-center justify-center"><span className="text-sm font-bold text-white">{r.user_name?.[0]}</span></div>
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
