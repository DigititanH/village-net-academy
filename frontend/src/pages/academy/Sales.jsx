import { useState, useEffect } from "react";
import api from "../../lib/api";

export default function AcademySales() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/academy/sales")
      .then((res) => setPayload(res.data))
      .catch(() => setPayload(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const sales = payload?.sales || [];

  return (
    <div>
      <h1 className="text-2xl font-black mb-2 bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
        Academy Reseller Sales
      </h1>
      <p className="text-sm text-gray-400 mb-6">
        Sales from resellers affiliated with{" "}
        <span className="text-burnt-300 font-semibold">{payload?.academy_name || "your academy"}</span>
        {payload?.academy_rate != null && (
          <>
            . Academy share is{" "}
            <span className="text-burnt-600 font-semibold">{payload.academy_rate}%</span> of each sale.
          </>
        )}
      </p>

      {!payload?.academy_registered ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            {payload?.message ||
              "Your academy must be registered on the system before sales appear."}
          </p>
        </div>
      ) : !sales.length ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No reseller sales for this academy yet.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3">Order #</th>
                <th className="pb-3">Reseller</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Sale amount</th>
                <th className="pb-3">Reseller commission</th>
                <th className="pb-3">Academy share</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={`${s.id}-${s.referral_code}`} className="border-b dark:border-gray-800">
                  <td className="py-3 font-medium">#{s.id}</td>
                  <td className="py-3">
                    <div className="font-medium">{s.reseller_name}</div>
                    <div className="text-xs text-gray-500 font-mono">{s.referral_code}</div>
                  </td>
                  <td className="py-3">{s.customer_name}</td>
                  <td className="py-3 font-semibold">R{Number(s.total).toFixed(2)}</td>
                  <td className="py-3 text-green-500">R{Number(s.reseller_commission).toFixed(2)}</td>
                  <td className="py-3 text-sky-400">R{Number(s.academy_share).toFixed(2)}</td>
                  <td className="py-3">
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full capitalize">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
