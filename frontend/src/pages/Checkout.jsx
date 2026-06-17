import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { CreditCard, ShoppingBag } from "lucide-react";
import api from "../lib/api";
import { SITE_EMAIL } from "../lib/site";
import { redirectToPayFast } from "../lib/payfast";
import { getReferralCode, setReferralCode } from "../lib/referral";
import toast from "react-hot-toast";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ street: "", city: "", province: "", zip: "", phone: "" });
  const [referral, setReferral] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "admin";

  const handleReferralChange = (value) => {
    setReferral(value);
    setReferralCode(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!items.length) return toast.error("Cart is empty");
    const missingSize = items.find((i) => i.available_sizes && JSON.parse(i.available_sizes).length > 0 && !i.size);
    if (missingSize) return toast.error(`Please select a size for "${missingSize.name}" in your cart`);

    const code = referral.trim() || getReferralCode();
    if (!isAdmin && !code) return toast.error("A reseller referral code is required to place an order");

    setLoading(true);
    try {
      const { data: order } = await api.post("/orders", {
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, size: i.size, color: i.color })),
        shipping_address: address,
        referral_code: code || undefined,
      });

      if (order.payfast) {
        const { data: pf } = await api.post(`/payfast/order/${order.order_id}`);
        toast.loading("Redirecting to PayFast...", { id: "payfast" });
        redirectToPayFast(pf.url, pf.fields);
        return;
      }

      await clearCart();
      toast.success("Order placed successfully!");
      navigate("/payment/success?type=order&id=" + order.order_id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Checkout failed");
      setLoading(false);
    }
  };

  return (
    <div className="section-padding">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-black mb-8 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Checkout</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <h2 className="font-black text-lg mb-4 text-burnt-600">Shipping Address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><input required placeholder="Street Address" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} className="input-field" /></div>
              <div><input required placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="input-field" /></div>
              <div><input required placeholder="Province" value={address.province} onChange={(e) => setAddress({ ...address, province: e.target.value })} className="input-field" /></div>
              <div><input required placeholder="Postal Code" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} className="input-field" /></div>
              <div><input required placeholder="Phone Number" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} className="input-field" /></div>
            </div>
          </div>

          <div className="card">
            <h2 className="font-black text-lg mb-2 text-burnt-600">
              Reseller Referral Code {isAdmin ? "(optional)" : "(required)"}
            </h2>
            {!isAdmin && (
              <p className="text-sm text-gray-400 mb-4">
                Orders must be linked to an approved reseller. Use a referral link from your reseller or enter their code below.
              </p>
            )}
            <input
              required={!isAdmin}
              value={referral}
              onChange={(e) => handleReferralChange(e.target.value)}
              className="input-field"
            />
            {!isAdmin && !referral.trim() && !getReferralCode() && (
              <p className="text-sm text-amber-400/90 mt-2">
                No referral code yet? <Link to="/shop" className="text-burnt-600 hover:underline">Visit the shop</Link> using a reseller&apos;s link.
              </p>
            )}
          </div>

          <div className="card">
            <h2 className="font-black text-lg mb-4 text-burnt-600">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-300">{item.name}{item.size ? ` (${item.size})` : ""} x{item.quantity}</span>
                  <span className="font-bold">R{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-4 flex justify-between">
              <span className="text-lg font-bold">Total</span>
              <span className="text-xl font-black text-burnt-600">R{total.toFixed(2)}</span>
            </div>
          </div>

          <button type="submit" disabled={loading || (!isAdmin && !referral.trim() && !getReferralCode())} className="btn-primary w-full text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Processing..." : <><CreditCard size={20} /> Pay with PayFast — R{total.toFixed(2)}</>}
          </button>

          <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
            <ShoppingBag size={14} /> Secure payment via PayFast. Questions?{" "}
            <a href={`mailto:${SITE_EMAIL}`} className="text-burnt-600 hover:underline">{SITE_EMAIL}</a>
          </p>
        </form>
      </div>
    </div>
  );
}
