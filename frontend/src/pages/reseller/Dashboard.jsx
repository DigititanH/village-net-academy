import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Copy, CheckCircle } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

export default function ResellerDashboard() {
  const [profile, setProfile] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const p = await api.get("/resellers/profile");
        setProfile(p.data);
        if (p.data.status === "approved") {
          const c = await api.get("/resellers/commissions");
          setCommissions(c.data);
        }
      } catch { /* empty */ }
      setLoading(false);
    };
    load();
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(profile.referral_code);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/shop?ref=${profile.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  if (!profile) return <div className="text-center py-20"><p className="text-gray-500 text-lg">Reseller profile not found.</p></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Reseller Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center"><DollarSign size={22} className="text-green-600" /></div>
          <div><p className="text-sm text-gray-500">Total Earned</p><p className="text-xl font-bold">R{Number(profile.total_earned).toFixed(2)}</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-burnt-100 dark:bg-burnt-900/30 rounded-xl flex items-center justify-center"><TrendingUp size={22} className="text-accent-400" /></div>
          <div><p className="text-sm text-gray-500">Commission Rate</p><p className="text-xl font-bold">{profile.commission_rate}%</p></div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Your Referral Code</h3>
        <div className="flex items-center gap-3">
          <code className="glass px-4 py-2 rounded-lg font-mono text-lg flex-1 text-burnt-600">{profile.referral_code}</code>
          <button onClick={copyCode} className="btn-primary !py-2 !px-4 inline-flex items-center gap-2">
            {copied ? <CheckCircle size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <button onClick={copyLink} className="text-sm text-burnt-600 hover:underline mt-2">Copy full referral link</button>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Recent Commissions</h3>
        {!commissions.length ? <p className="text-gray-500 text-sm">No commissions yet. Share your referral code to start earning!</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b dark:border-gray-700"><th className="pb-3">Order</th><th className="pb-3">Order Total</th><th className="pb-3">Commission</th><th className="pb-3">Status</th><th className="pb-3">Date</th></tr></thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="border-b dark:border-gray-800">
                  <td className="py-3 font-medium">#{c.order_id}</td>
                  <td className="py-3">R{Number(c.order_total).toFixed(2)}</td>
                  <td className="py-3 text-green-600 font-semibold">R{Number(c.amount).toFixed(2)}</td>
                  <td className="py-3"><span className={`text-xs px-2 py-1 rounded-full capitalize ${c.status === "paid" ? "bg-green-900/30 text-green-400" : "bg-yellow-900/30 text-yellow-400"}`}>{c.status}</span></td>
                  <td className="py-3 text-gray-500">{new Date(c.order_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
