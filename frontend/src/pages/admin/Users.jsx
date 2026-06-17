import { useState, useEffect } from "react";
import { Trash2, Search, Check, X } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

const approvalColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const res = await api.get("/admin/users", { params: { search } });
    setUsers(res.data.users);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [search]);

  const changeRole = async (id, role) => {
    try { await api.put(`/admin/users/${id}/role`, { role }); toast.success("Role updated"); fetchUsers(); } catch { toast.error("Failed"); }
  };

  const approveUser = async (id, status) => {
    try {
      await api.put(`/admin/users/${id}/approve`, { status });
      toast.success(`User ${status}`);
      fetchUsers();
    } catch { toast.error("Failed to update"); }
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    try { await api.delete(`/admin/users/${id}`); toast.success("User deleted"); fetchUsers(); } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-black mb-6 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Users ({users.length})</h1>
      <div className="relative mb-6 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b dark:border-gray-700">
              <th className="pb-3">Name</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Role</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Joined</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b dark:border-gray-800">
                <td className="py-3 font-medium">{u.name}</td>
                <td className="py-3 text-gray-500">{u.email}</td>
                <td className="py-3">
                  <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} className="select-field-sm">
                    <option value="customer">Customer</option>
                    <option value="reseller">Reseller</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${approvalColors[u.is_approved] || approvalColors.pending}`}>
                    {u.is_approved || "pending"}
                  </span>
                </td>
                <td className="py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="py-3">
                  <div className="flex gap-1">
                    {(u.is_approved === "pending" || u.is_approved === "declined") && (
                      <button onClick={() => approveUser(u.id, "approved")} title="Approve" className="p-1.5 rounded bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50">
                        <Check size={14} />
                      </button>
                    )}
                    {(u.is_approved === "pending" || u.is_approved === "approved") && (
                      <button onClick={() => approveUser(u.id, "declined")} title="Decline" className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50">
                        <X size={14} />
                      </button>
                    )}
                    <button onClick={() => deleteUser(u.id)} title="Delete" className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
