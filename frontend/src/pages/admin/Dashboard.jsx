import { useState, useEffect } from "react";
import { Users, DollarSign, ShoppingBag, Package, Heart, UserCheck, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import api from "../../lib/api";
import { chartAxisTick, chartGrid, chartTooltipStyle } from "../../lib/chartTheme";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/dashboard").then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  if (!data) return <p>Failed to load dashboard</p>;

  const { stats } = data;
  const cards = [
    { label: "Total Users", value: stats.total_users, icon: Users, color: "blue" },
    { label: "Total Revenue", value: `R${Number(stats.total_revenue).toLocaleString()}`, icon: DollarSign, color: "green" },
    { label: "Total Orders", value: stats.total_orders, icon: ShoppingBag, color: "purple" },
    { label: "Pending Orders", value: stats.pending_orders, icon: Package, color: "yellow" },
    { label: "Donations", value: `R${Number(stats.total_donations).toLocaleString()}`, icon: Heart, color: "pink" },
    { label: "Products", value: stats.total_products, icon: Package, color: "indigo" },
    { label: "Pending Resellers", value: stats.pending_resellers, icon: UserCheck, color: "orange" },
    { label: "Donation Count", value: stats.donation_count, icon: TrendingUp, color: "teal" },
  ];

  const colorMap = {
    blue: "bg-accent-900/30 text-accent-400",
    green: "bg-green-900/30 text-green-400",
    purple: "bg-accent-900/30 text-accent-400",
    yellow: "bg-yellow-900/30 text-yellow-400",
    pink: "bg-pink-900/30 text-pink-400",
    indigo: "bg-burnt-900/30 text-burnt-600",
    orange: "bg-orange-900/30 text-orange-400",
    teal: "bg-teal-900/30 text-teal-400",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Dashboard Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[c.color]}`}>
              <c.icon size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-400">{c.label}</p>
              <p className="text-xl font-bold">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthly_sales}>
              <CartesianGrid {...chartGrid} />
              <XAxis dataKey="month" tick={chartAxisTick} />
              <YAxis tick={chartAxisTick} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Orders Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthly_sales}>
              <CartesianGrid {...chartGrid} />
              <XAxis dataKey="month" tick={chartAxisTick} />
              <YAxis tick={chartAxisTick} />
              <Tooltip {...chartTooltipStyle} />
              <Line type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2} dot={{ fill: "#2563eb" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-400 border-b border-white/10"><th className="pb-2">Order</th><th className="pb-2">Customer</th><th className="pb-2">Amount</th><th className="pb-2">Status</th></tr></thead>
              <tbody>
                {data.recent_orders.map((o) => (
                  <tr key={o.id} className="border-b border-white/5">
                    <td className="py-2 font-medium">#{o.id}</td>
                    <td className="py-2">{o.name}</td>
                    <td className="py-2">R{Number(o.total).toFixed(2)}</td>
                    <td className="py-2"><span className="text-xs bg-white/10 px-2 py-1 rounded-full capitalize">{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            {data.top_products.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.sold} sold</p>
                </div>
                <span className="font-semibold text-green-400">R{Number(p.revenue).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
