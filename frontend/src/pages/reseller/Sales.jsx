import { useState, useEffect } from "react";
import api from "../../lib/api";

export default function ResellerSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/resellers/sales").then((res) => setSales(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-black mb-6 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">My Sales</h1>
      {!sales.length ? (
        <div className="card text-center py-12"><p className="text-gray-500">No sales yet. Share your referral code to start earning!</p></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b dark:border-gray-700"><th className="pb-3">Order #</th><th className="pb-3">Customer</th><th className="pb-3">Amount</th><th className="pb-3">Status</th><th className="pb-3">Date</th></tr></thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-b dark:border-gray-800">
                  <td className="py-3 font-medium">#{s.id}</td>
                  <td className="py-3">{s.customer_name}</td>
                  <td className="py-3 font-semibold">R{Number(s.total).toFixed(2)}</td>
                  <td className="py-3"><span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full capitalize">{s.status}</span></td>
                  <td className="py-3 text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
