import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import api from "../lib/api";

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  processing: "bg-accent-900/30 text-accent-400 border border-accent-700/35",
  shipped: "bg-accent-900/20 text-accent-400 border border-accent-700/35",
  delivered: "bg-green-500/20 text-green-400 border border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/my-orders").then((res) => setOrders(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-burnt-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="section-padding">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black mb-8 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">My Orders</h1>
        {!orders.length ? (
          <div className="text-center py-20"><Package size={48} className="text-gray-600 mx-auto mb-4" /><p className="text-gray-500">No orders yet.</p></div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="card">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                  <div>
                    <p className="font-bold">Order #{order.id}</p>
                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${statusColors[order.status]}`}>{order.status}</span>
                    <span className="font-black text-burnt-600">R{Number(order.total).toFixed(2)}</span>
                  </div>
                </div>
                {order.tracking_number && <p className="text-sm text-gray-400">Tracking: {order.tracking_number}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
