import { useState, useEffect } from "react";
import { Heart, DollarSign, TrendingUp, Download, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../lib/api";
import { chartAxisTick, chartGrid, chartTooltipStyle } from "../../lib/chartTheme";

export default function AdminDonations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/donations/admin/all").then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  if (!data) return <p>Failed to load</p>;

  const downloadReport = (format) => {
    const token = localStorage.getItem("token");
    fetch(`/api/admin/reports/donations/${format}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `donations-report.${format === "pdf" ? "pdf" : "csv"}`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success(`Donations report downloaded (${format.toUpperCase()})`);
      })
      .catch(() => toast.error("Download failed"));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Donations</h1>
        <div className="flex gap-2">
          <button onClick={() => downloadReport("csv")} className="btn-secondary text-sm inline-flex items-center gap-2 !py-2 !px-4"><Download size={16} /> CSV</button>
          <button onClick={() => downloadReport("pdf")} className="btn-primary text-sm inline-flex items-center gap-2 !py-2 !px-4"><FileText size={16} /> PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center"><DollarSign size={22} className="text-pink-600" /></div>
          <div><p className="text-sm text-gray-500">Total Donated</p><p className="text-xl font-bold">R{Number(data.summary.total).toLocaleString()}</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-burnt-100 dark:bg-burnt-900/30 rounded-xl flex items-center justify-center"><Heart size={22} className="text-accent-400" /></div>
          <div><p className="text-sm text-gray-500">Total Donors</p><p className="text-xl font-bold">{data.summary.count}</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-burnt-100 dark:bg-burnt-900/30 rounded-xl flex items-center justify-center"><TrendingUp size={22} className="text-accent-400" /></div>
          <div><p className="text-sm text-gray-500">Average</p><p className="text-xl font-bold">R{data.summary.count > 0 ? (data.summary.total / data.summary.count).toFixed(0) : 0}</p></div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Monthly Donations</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthly}>
            <CartesianGrid {...chartGrid} />
            <XAxis dataKey="month" tick={chartAxisTick} />
            <YAxis tick={chartAxisTick} />
            <Tooltip {...chartTooltipStyle} />
            <Bar dataKey="total" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card overflow-x-auto">
        <h3 className="font-semibold mb-4">All Donations</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 border-b dark:border-gray-700"><th className="pb-3">Donor</th><th className="pb-3">Academy</th><th className="pb-3">Email</th><th className="pb-3">Amount</th><th className="pb-3">Status</th><th className="pb-3">Date</th></tr></thead>
          <tbody>
            {data.donations.map((d) => (
              <tr key={d.id} className="border-b dark:border-gray-800">
                <td className="py-3 font-medium">{d.is_anonymous ? "Anonymous" : d.donor_name}</td>
                <td className="py-3 text-gray-400 max-w-[180px]">{d.academy || "—"}</td>
                <td className="py-3 text-gray-500">{d.email || "-"}</td>
                <td className="py-3 font-semibold text-green-600">R{Number(d.amount).toFixed(2)}</td>
                <td className="py-3"><span className={`text-xs px-2 py-1 rounded-full capitalize ${d.payment_status === "completed" ? "bg-green-900/30 text-green-400" : "bg-yellow-900/30 text-yellow-400"}`}>{d.payment_status}</span></td>
                <td className="py-3 text-gray-500">{new Date(d.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
