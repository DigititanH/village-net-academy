import { useState, useEffect } from "react";
import { Check, X as XIcon } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

export default function AdminResellers() {
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchResellers = async () => {
    const res = await api.get("/resellers/admin/all");
    setResellers(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchResellers(); }, []);

  const updateStatus = async (id, status) => {
    try { await api.put(`/resellers/admin/${id}/status`, { status }); toast.success(`Reseller ${status}`); fetchResellers(); } catch { toast.error("Failed"); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  const statusColor = (s) => {
    if (s === "approved") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (s === "pending") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    if (s === "rejected") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    return "bg-gray-800 text-gray-300";
  };

  return (
    <div>
      <h1 className="text-2xl font-black mb-6 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Resellers ({resellers.length})</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 border-b dark:border-gray-700"><th className="pb-3">Name</th><th className="pb-3">Email</th><th className="pb-3">Academy</th><th className="pb-3">Referral Code</th><th className="pb-3">Earnings</th><th className="pb-3">Wallet</th><th className="pb-3">Status</th><th className="pb-3">Actions</th></tr></thead>
          <tbody>
            {resellers.map((r) => (
              <tr key={r.id} className="border-b dark:border-gray-800">
                <td className="py-3 font-medium">{r.name}</td>
                <td className="py-3 text-gray-500">{r.email}</td>
                <td className="py-3 text-gray-400 max-w-[180px]">{r.academy || "—"}</td>
                <td className="py-3 font-mono text-xs">{r.referral_code}</td>
                <td className="py-3 text-green-600 font-semibold">R{Number(r.total_earned).toFixed(2)}</td>
                <td className="py-3">R{Number(r.wallet_balance).toFixed(2)}</td>
                <td className="py-3"><span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor(r.status)}`}>{r.status}</span></td>
                <td className="py-3">
                  {r.status === "pending" && (
                    <div className="flex gap-1">
                      <button onClick={() => updateStatus(r.id, "approved")} className="p-1.5 rounded bg-green-100 text-green-600 hover:bg-green-200"><Check size={14} /></button>
                      <button onClick={() => updateStatus(r.id, "rejected")} className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200"><XIcon size={14} /></button>
                    </div>
                  )}
                  {r.status === "approved" && (
                    <button onClick={() => updateStatus(r.id, "suspended")} className="text-xs text-red-500 hover:underline">Suspend</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
