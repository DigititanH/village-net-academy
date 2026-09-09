import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { CreditCard, ShoppingBag, Truck, MapPin } from "lucide-react";
import api from "../lib/api";
import { SITE_EMAIL } from "../lib/site";
import { redirectToPayFast } from "../lib/payfast";
import { getReferralCode, setReferralCode } from "../lib/referral";
import { parseProductOptions } from "../lib/productOptions";
import { SA_PROVINCES } from "../data/ascCentres";
import toast from "react-hot-toast";

const DELIVERY_FEE = 150;

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [address, setAddress] = useState({ street: "", city: "", province: "", zip: "", phone: "" });
  const [centres, setCentres] = useState([]);
  const [centreProvince, setCentreProvince] = useState("");
  const [collectionCentreId, setCollectionCentreId] = useState("");
  const [referral, setReferral] = useState(() => getReferralCode());
  const [loading, setLoading] = useState(false);

  const shippingFee = deliveryMethod === "delivery" ? DELIVERY_FEE : deliveryMethod === "collection" ? 0 : null;
  const grandTotal = useMemo(
    () => (shippingFee === null ? total : total + shippingFee),
    [total, shippingFee]
  );

  useEffect(() => {
    if (deliveryMethod !== "collection") return;
    let cancelled = false;
    api
      .get("/asc/centres")
      .then((res) => {
        if (!cancelled) setCentres(res.data.centres || []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load collection centres");
      });
    return () => {
      cancelled = true;
    };
  }, [deliveryMethod]);

  const centresInProvince = useMemo(() => {
    const list = centres.filter((c) => c.name);
    if (!centreProvince) return list;
    return list.filter((c) => c.province === centreProvince);
  }, [centres, centreProvince]);

  const selectedCentre = useMemo(
    () => centres.find((c) => String(c.id) === String(collectionCentreId)),
    [centres, collectionCentreId]
  );

  const handleReferralChange = (value) => {
    setReferral(value);
    setReferralCode(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!items.length) return toast.error("Cart is empty");
    if (!deliveryMethod) return toast.error("Please choose Delivery or Collection at the centre");

    const missingSize = items.find((i) => parseProductOptions(i.available_sizes).length > 0 && !i.size);
    if (missingSize) return toast.error(`Please select a size for "${missingSize.name}" in your cart`);

    if (!address.phone.trim()) return toast.error("Phone number is required");
    if (deliveryMethod === "delivery") {
      if (![address.street, address.city, address.province, address.zip].every((v) => v.trim())) {
        return toast.error("Please complete the delivery address");
      }
    }
    if (deliveryMethod === "collection" && !collectionCentreId) {
      return toast.error("Please select the centre where you will collect");
    }

    const code = referral.trim() || getReferralCode();

    setLoading(true);
    try {
      const { data: order } = await api.post("/orders", {
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, size: i.size, color: i.color })),
        shipping_address: address,
        delivery_method: deliveryMethod,
        collection_centre_id: deliveryMethod === "collection" ? Number(collectionCentreId) : undefined,
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
        <h1 className="text-3xl sm:text-4xl font-black mb-6 sm:mb-8 bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">Checkout</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <h2 className="font-black text-lg mb-2 text-burnt-600">Delivery or collection</h2>
            <p className="text-sm text-gray-400 mb-4">Choose how you want to receive your order before paying.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeliveryMethod("delivery");
                  setCollectionCentreId("");
                }}
                className={`text-left rounded-xl border p-4 transition ${
                  deliveryMethod === "delivery"
                    ? "border-burnt-500 bg-burnt-500/10"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Truck size={18} className="text-burnt-400" /> Delivery
                </div>
                <p className="text-sm text-gray-400">We deliver to your address</p>
                <p className="mt-2 font-black text-burnt-500">R{DELIVERY_FEE.toFixed(2)}</p>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod("collection")}
                className={`text-left rounded-xl border p-4 transition ${
                  deliveryMethod === "collection"
                    ? "border-burnt-500 bg-burnt-500/10"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  <MapPin size={18} className="text-burnt-400" /> Collection at the centre
                </div>
                <p className="text-sm text-gray-400">Collect from a Village NetAcad centre</p>
                <p className="mt-2 font-black text-green-400">Free</p>
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="font-black text-lg mb-4 text-burnt-600">
              {deliveryMethod === "collection" ? "Collection centre & contact" : "Shipping address"}
            </h2>
            {deliveryMethod === "collection" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Province</label>
                  <select
                    className="input-field"
                    value={centreProvince}
                    onChange={(e) => {
                      setCentreProvince(e.target.value);
                      setCollectionCentreId("");
                    }}
                  >
                    <option value="">All provinces</option>
                    {SA_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Collection centre</label>
                  <select
                    required
                    className="input-field"
                    value={collectionCentreId}
                    onChange={(e) => setCollectionCentreId(e.target.value)}
                  >
                    <option value="">Select a centre</option>
                    {centresInProvince.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.city ? ` — ${c.city}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedCentre && (
                  <div className="sm:col-span-2 text-sm text-gray-400 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <p className="font-semibold text-gray-200">{selectedCentre.name}</p>
                    <p>{[selectedCentre.address, selectedCentre.city, selectedCentre.province].filter(Boolean).join(", ") || selectedCentre.province}</p>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {deliveryMethod !== "collection" && (
                <>
                  <div className="sm:col-span-2">
                    <input
                      required={deliveryMethod === "delivery"}
                      placeholder="Street Address"
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <input
                      required={deliveryMethod === "delivery"}
                      placeholder="City"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <input
                      required={deliveryMethod === "delivery"}
                      placeholder="Province"
                      value={address.province}
                      onChange={(e) => setAddress({ ...address, province: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <input
                      required={deliveryMethod === "delivery"}
                      placeholder="Postal Code"
                      value={address.zip}
                      onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </>
              )}
              <div className={deliveryMethod === "collection" ? "sm:col-span-2" : ""}>
                <input
                  required
                  placeholder="Phone Number"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="font-black text-lg mb-2 text-burnt-600">
              Reseller Referral Code <span className="font-normal text-base text-gray-500">(optional)</span>
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Have a reseller code? Enter it here or leave blank to checkout without one.
            </p>
            <input
              value={referral}
              onChange={(e) => handleReferralChange(e.target.value)}
              placeholder="Enter code if you have one"
              className="input-field"
            />
          </div>

          <div className="card">
            <h2 className="font-black text-lg mb-4 text-burnt-600">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 text-sm">
                  <span className="text-gray-300 min-w-0 break-words">{item.name}{item.size ? ` (${item.size})` : ""} x{item.quantity}</span>
                  <span className="font-bold shrink-0">R{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-4 space-y-2">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="shrink-0">R{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-gray-400 min-w-0 break-words">
                  {deliveryMethod === "collection"
                    ? selectedCentre
                      ? `Collection — ${selectedCentre.name}`
                      : "Collection"
                    : deliveryMethod === "delivery"
                      ? "Delivery"
                      : "Delivery / collection"}
                </span>
                <span className="shrink-0">
                  {shippingFee === null ? "Select above" : shippingFee === 0 ? "Free" : `R${shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between gap-3 pt-2">
                <span className="text-lg font-bold">Total</span>
                <span className="text-xl font-black text-burnt-600 shrink-0">R{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !deliveryMethod || (deliveryMethod === "collection" && !collectionCentreId)}
            className="btn-primary w-full text-base sm:text-lg flex flex-wrap items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : <><CreditCard size={20} className="shrink-0" /> <span>Pay with PayFast — R{grandTotal.toFixed(2)}</span></>}
          </button>

          <p className="text-center text-xs text-gray-500 flex flex-wrap items-center justify-center gap-1">
            <ShoppingBag size={14} className="shrink-0" /> Secure payment via PayFast. Questions?{" "}
            <a href={`mailto:${SITE_EMAIL}`} className="text-burnt-600 hover:underline break-all">{SITE_EMAIL}</a>
          </p>
        </form>
      </div>
    </div>
  );
}
