import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import api from "../lib/api";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const fetchWishlist = async () => {
    try { const res = await api.get("/wishlist"); setItems(res.data); } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { fetchWishlist(); }, []);

  const handleRemove = async (productId) => {
    await api.post("/wishlist/toggle", { product_id: productId });
    await fetchWishlist();
    toast.success("Removed from wishlist");
  };

  const handleAddToCart = async (productId) => {
    try { await addToCart(productId); toast.success("Added to cart!"); } catch { toast.error("Failed to add to cart"); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-burnt-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="section-padding">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black mb-8 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">My Wishlist</h1>
        {!items.length ? (
          <div className="text-center py-20"><Heart size={48} className="text-gray-600 mx-auto mb-4" /><p className="text-gray-500">Your wishlist is empty.</p><Link to="/shop" className="btn-primary inline-block mt-4">Browse Store</Link></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="group glass rounded-[2rem] overflow-hidden hover:border-burnt-500/35 transition-all duration-700 hover:-translate-y-3">
                <Link to={`/shop/${item.slug}`} className="aspect-square glass-clear block overflow-hidden border-0 shadow-none">
                  {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><ShoppingCart size={40} /></div>}
                </Link>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                  <p className="font-black text-burnt-600 text-xl mb-3">R{Number(item.price).toFixed(2)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleAddToCart(item.product_id)} className="btn-primary text-sm flex-1 !py-2 flex items-center justify-center gap-1"><ShoppingCart size={14} /> Add to Cart</button>
                    <button onClick={() => handleRemove(item.product_id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
