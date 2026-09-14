import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DollarSign, Users, TrendingUp, MapPinned } from "lucide-react";
import api from "../../lib/api";

export default function AcademyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/academy/overview")
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Could not load academy overview.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
          Centre Dashboard
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Centre: <span className="text-burnt-300 font-semibold">{data.academy_name}</span> — you receive 26% of linked reseller sales.
        </p>
      </div>

      {!data.academy_registered ? (
        <div className="card border border-yellow-500/30 bg-yellow-500/10">
          <div className="flex items-start gap-3">
            <MapPinned className="text-yellow-400 flex-shrink-0 mt-0.5" size={22} />
            <div>
              <h2 className="font-semibold text-yellow-200 mb-1">Academy not registered yet</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                {data.message ||
                  "Once an admin registers your academy under Map academies (same name), you will see reseller sales here."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-burnt-100 dark:bg-burnt-900/30 rounded-xl flex items-center justify-center">
                <Users size={22} className="text-burnt-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Resellers</p>
                <p className="text-xl font-bold">{data.reseller_count}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp size={22} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Reseller sales</p>
                <p className="text-xl font-bold">R{Number(data.sales_total || 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center">
                <DollarSign size={22} className="text-sky-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Academy share ({data.academy_rate}%)</p>
                <p className="text-xl font-bold">R{Number(data.academy_share || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="card flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-400">
              View every sale made by resellers under {data.academy_name}.
            </p>
            <Link to="/academy/sales" className="btn-primary !py-2 !px-4">
              View sales
            </Link>
          </div>

          <div className="card overflow-x-auto">
            <h2 className="font-semibold mb-4">Resellers under this academy</h2>
            {!data.resellers?.length ? (
              <p className="text-gray-500 text-sm py-6 text-center">
                No resellers have registered under this academy name yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                    <th className="pb-3">Reseller</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Referral code</th>
                    <th className="pb-3">Sales</th>
                    <th className="pb-3">Earned</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.resellers.map((r) => (
                    <tr key={r.id} className="border-b dark:border-gray-800">
                      <td className="py-3 font-medium">{r.name}</td>
                      <td className="py-3 text-gray-400">{r.email}</td>
                      <td className="py-3 font-mono text-burnt-400">{r.referral_code}</td>
                      <td className="py-3">R{Number(r.sales_total || 0).toFixed(2)}</td>
                      <td className="py-3 text-green-500">R{Number(r.total_earned || 0).toFixed(2)}</td>
                      <td className="py-3 capitalize">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
