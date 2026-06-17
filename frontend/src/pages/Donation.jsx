import { useState, useEffect } from "react";
import { Heart, CreditCard } from "lucide-react";
import api from "../lib/api";
import { redirectToPayFast } from "../lib/payfast";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const presets = [50, 100, 250, 500, 1000];

export default function Donation() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [academy, setAcademy] = useState("");
  const [submittedAcademy, setSubmittedAcademy] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [payfastEnabled, setPayfastEnabled] = useState(true);

  useEffect(() => {
    api.get("/payfast/status").then((res) => setPayfastEnabled(res.data.configured)).catch(() => setPayfastEnabled(false));
  }, []);

  const handlePayment = async () => {
    if (!amount || Number(amount) < 1) return toast.error("Please enter a valid amount");

    const donorEmail = (email || user?.email || "").trim();
    if (payfastEnabled && !donorEmail) {
      return toast.error("Email is required to pay with PayFast");
    }
    if (payfastEnabled && !anonymous && !name.trim()) {
      return toast.error("Please enter your name");
    }
    if (!academy.trim()) {
      return toast.error("Please enter the name of the academy you are donating to");
    }

    setLoading(true);
    try {
      const academyName = academy.trim();
      const { data } = await api.post("/donations", {
        amount: Number(amount),
        donor_name: anonymous ? "Anonymous" : name.trim(),
        email: donorEmail || undefined,
        message,
        academy: academyName,
        is_anonymous: anonymous,
        is_recurring: false,
        recurring_interval: null,
        user_id: user?.id,
      });

      if (data.payfast && data.url && data.fields) {
        sessionStorage.setItem(`donation-${data.donation_id}-academy`, academyName);
        toast.loading("Redirecting to PayFast...", { id: "payfast" });
        redirectToPayFast(data.url, data.fields);
        return;
      }

      toast.success("Thank you! Your donation has been recorded.");
      setSubmittedAcademy(academyName);
      setSubmitted(true);
      setAmount("");
      setName("");
      setEmail("");
      setMessage("");
      setAcademy("");
      setAnonymous(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Donation failed");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md card">
          <Heart size={64} className="text-burnt-600 mx-auto mb-6" />
          <h1 className="text-3xl font-black mb-3 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Thank You!</h1>
          <p className="text-gray-400 mb-4">
            Your donation pledge has been recorded. Thank you for your support.
          </p>
          {submittedAcademy && (
            <p className="text-sm text-burnt-600/80 mb-6 px-4 py-3 rounded-xl bg-burnt-800/20 border border-burnt-700/30">
              Donating to: <strong className="text-burnt-600">{submittedAcademy}</strong>
            </p>
          )}
          <button type="button" onClick={() => { setSubmitted(false); setSubmittedAcademy(""); }} className="btn-primary">
            Make another donation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 glass-section" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Heart size={48} className="mx-auto mb-4 text-burnt-600 opacity-80" />
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Power The Future</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">Every rand you donate helps us bring digital education to another village learner.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePayment();
            }}
            className="card space-y-6"
          >
            <h2 className="text-2xl font-black bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Make a Donation</h2>

            {payfastEnabled ? (
              <p className="text-sm text-burnt-600/90 bg-burnt-800/20 border border-burnt-700/30 rounded-xl px-4 py-3">
                You will be redirected to PayFast to complete your secure payment.
              </p>
            ) : (
              <p className="text-sm text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                Online payment is temporarily unavailable. Your pledge will be recorded and our team will follow up.
              </p>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">Select Amount (ZAR)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(String(p))}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-300 ${
                      String(p) === amount
                        ? "bg-gradient-to-r from-burnt-400 to-burnt-700 text-white border-transparent shadow-[0_0_20px_rgba(14,165,233,0.28)]"
                        : "border-white/20 hover:border-burnt-600/35 hover:bg-burnt-800/20"
                    }`}
                  >
                    R{p}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
                min="5"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-300">Academy name *</label>
              <input
                type="text"
                required
                value={academy}
                onChange={(e) => setAcademy(e.target.value)}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">Which academy is this donation for?</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-300">
                Email {payfastEnabled && <span className="text-burnt-600">*</span>}
              </label>
              <input
                type="email"
                required={payfastEnabled}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>

            {!anonymous && (
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-300">
                  Your Name {payfastEnabled && <span className="text-burnt-600">*</span>}
                </label>
                <input
                  type="text"
                  required={payfastEnabled}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-300">Message (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input-field"
                rows={3}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-burnt-600 focus:ring-burnt-700"
              />
              <span className="text-sm text-gray-300">Donate anonymously (name hidden; email still used for PayFast receipt)</span>
            </label>

            <button
              type="button"
              onClick={handlePayment}
              disabled={loading || !amount || Number(amount) < 5}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                "Redirecting to PayFast..."
              ) : payfastEnabled ? (
                <>
                  <CreditCard size={18} /> Pay Now — R{amount || "0"}
                </>
              ) : (
                <>
                  <Heart size={18} /> Submit donation pledge — R{amount || "0"}
                </>
              )}
            </button>

            {payfastEnabled && (
              <p className="text-center text-xs text-gray-500">
                Secure payment powered by PayFast.
              </p>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
