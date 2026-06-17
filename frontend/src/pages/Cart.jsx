import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getReferralCode, setReferralCode } from "../lib/referral";
import toast from "react-hot-toast";

export default function Cart() {
  const { items, updateSize, updateQuantity, removeItem, total, loading } = useCart();
  const { user } = useAuth();
  const [referral, setReferral] = useState("");
  const needsReferral = user?.role !== "admin";
  const hasReferral = referral.trim().length > 0 || getReferralCode().length > 0;

  if (!user) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <ShoppingCart size={48} className="text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-black mb-2">Please login to view your cart</h2>
        <Link to="/login" className="btn-primary inline-block mt-4">Login</Link>
      </div>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-burnt-500 border-t-transparent rounded-full" /></div>;

  if (!items.length) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <ShoppingCart size={48} className="text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-black mb-2">Your cart is empty</h2>
        <Link to="/shop" className="btn-primary inline-block mt-4">Browse Store</Link>
      </div>
    </div>
  );

  return (
    <div className="section-padding">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black mb-8 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Shopping Cart</h1>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="card flex items-center gap-4">
              <div className="w-20 h-20 bg-white/5 rounded-xl overflow-hidden flex-shrink-0">
                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><ShoppingCart size={24} /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{item.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {item.available_sizes && JSON.parse(item.available_sizes).length > 0 ? (
                    <select
                      value={item.size || ""}
                      onChange={(e) => updateSize(item.id, e.target.value)}
                      className="select-field-sm"
                    >
                      <option value="">Select Size</option>
                      {JSON.parse(item.available_sizes).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : item.size ? (
                    <span className="text-sm text-gray-400">Size: {item.size}</span>
                  ) : null}
                  {item.color && <span className="text-sm text-gray-400">Color: {item.color}</span>}
                </div>
                <p className="font-bold text-burnt-600 mt-1">R{Number(item.price).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors"><Minus size={16} /></button>
                <span className="w-8 text-center font-bold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors"><Plus size={16} /></button>
              </div>
              <p className="font-black w-24 text-right text-burnt-600">R{(item.price * item.quantity).toFixed(2)}</p>
              <button onClick={() => removeItem(item.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={18} /></button>
            </div>
          ))}
        </div>

        <div className="card mt-8 space-y-4">
          {needsReferral && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Reseller referral code (required)</label>
              <input
                value={referral}
                onChange={(e) => {
                  setReferral(e.target.value);
                  setReferralCode(e.target.value);
                }}
                className="input-field"
              />
              {!hasReferral && (
                <p className="text-xs text-amber-400/90 mt-2">
                  You need a valid reseller code to checkout. Open the shop via a reseller&apos;s referral link or enter their code above.
                </p>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Total</span>
            <span className="text-2xl font-black text-burnt-600">R{total.toFixed(2)}</span>
          </div>
          {needsReferral && !hasReferral ? (
            <button type="button" disabled className="btn-primary w-full text-center block opacity-50 cursor-not-allowed">
              Enter referral code to checkout
            </button>
          ) : (
            <Link to="/checkout" className="btn-primary w-full text-center block">Proceed to Checkout</Link>
          )}
        </div>
      </div>
    </div>
  );
}
