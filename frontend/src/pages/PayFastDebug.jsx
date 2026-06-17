import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { handlePayment } from "../lib/payfast";
import toast from "react-hot-toast";

/** Dev-only PayFast diagnostics */
export default function PayFastDebug() {
  const [check, setCheck] = useState(null);
  const [signature, setSignature] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/payfast/check"),
      api.get("/payfast/debug-signature"),
    ])
      .then(([c, s]) => {
        setCheck(c.data);
        setSignature(s.data);
      })
      .catch((err) => toast.error(err.response?.data?.message || "Debug fetch failed"))
      .finally(() => setLoading(false));
  }, []);

  const testPay = async () => {
    try {
      await handlePayment({
        amount: 50,
        item_name: "PayFast debug test",
        name_first: "Debug",
        email_address: "debug@test.com",
        m_payment_id: "debug-test",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Test payment failed");
    }
  };

  if (import.meta.env.PROD) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <p className="text-gray-400">Not available in production.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div>
        <Link to="/donation" className="text-burnt-600 text-sm hover:underline">
          ← Back to donation
        </Link>
        <h1 className="text-3xl font-black mt-4 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">
          PayFast debug
        </h1>
        <p className="text-gray-400 text-sm mt-2">Development only. Backend must be running on port 5000.</p>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <>
          <section className="card">
            <h2 className="font-bold text-lg mb-3">Configuration</h2>
            <pre className="text-xs overflow-auto glass p-4 rounded-xl text-burnt-100/90">
              {JSON.stringify(check, null, 2)}
            </pre>
            {check?.warnings?.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm text-amber-300">
                {check.warnings.map((w) => (
                  <li key={w}>⚠ {w}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2 className="font-bold text-lg mb-3">Sample signature</h2>
            <pre className="text-xs overflow-auto glass p-4 rounded-xl text-burnt-100/90 break-all">
              {signature?.signature_string}
            </pre>
            {check?.blockers?.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm text-red-300">
                {check.blockers.map((b) => (
                  <li key={b}>✕ {b}</li>
                ))}
              </ul>
            )}
          </section>

          <button type="button" onClick={testPay} className="btn-primary">
            Test PayFast redirect (R50 sandbox)
          </button>
        </>
      )}
    </div>
  );
}
