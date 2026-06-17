import { useState, useEffect } from "react";
import { Download, FileText } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-burnt-100 text-burnt-800 dark:bg-accent-900/30 dark:text-accent-400",
  shipped: "bg-burnt-100 text-burnt-800 dark:bg-accent-900/30 dark:text-accent-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const res = await api.get("/orders/admin/all");
    setOrders(res.data.orders);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id, status) => {
    try { await api.put(`/orders/${id}`, { status }); toast.success("Order updated"); fetchOrders(); } catch { toast.error("Failed to update"); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  const downloadReport = (format) => {
    const token = localStorage.getItem("token");
    const url = `/api/admin/reports/sales/${format}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `sales-report.${format === "pdf" ? "pdf" : "csv"}`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success(`Sales report downloaded (${format.toUpperCase()})`);
      })
      .catch(() => toast.error("Download failed"));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Orders ({orders.length})</h1>
        <div className="flex gap-2">
          <button onClick={() => downloadReport("csv")} className="btn-secondary text-sm inline-flex items-center gap-2 !py-2 !px-4"><Download size={16} /> CSV</button>
          <button onClick={() => downloadReport("pdf")} className="btn-primary text-sm inline-flex items-center gap-2 !py-2 !px-4"><FileText size={16} /> PDF</button>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 border-b dark:border-gray-700"><th className="pb-3">#</th><th className="pb-3">Customer</th><th className="pb-3">Total</th><th className="pb-3">Status</th><th className="pb-3">Date</th><th className="pb-3">Action</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b dark:border-gray-800">
                <td className="py-3 font-medium">{o.id}</td>
                <td className="py-3">{o.customer_name}<br /><span className="text-xs text-gray-500">{o.customer_email}</span></td>
                <td className="py-3 font-semibold">R{Number(o.total).toFixed(2)}</td>
                <td className="py-3"><span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusColors[o.status]}`}>{o.status}</span></td>
                <td className="py-3 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="py-3">
                  <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="select-field-sm">
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
