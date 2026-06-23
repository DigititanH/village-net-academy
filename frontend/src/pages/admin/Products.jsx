import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import api, { getImageUrl } from "../../lib/api";
import toast from "react-hot-toast";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
  const [form, setForm] = useState({ name: "", description: "", price: "", compare_price: "", category_id: "", stock: "", sizes: "", colors: "" });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [p, c] = await Promise.all([api.get("/products"), api.get("/products/meta/categories")]);
    setProducts(p.data.products);
    setCategories(c.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: "", description: "", price: "", compare_price: "", category_id: "", stock: "", sizes: "", colors: "" }); setImage(null); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, description: p.description || "", price: String(p.price), compare_price: p.compare_price ? String(p.compare_price) : "", category_id: p.category_id ? String(p.category_id) : "", stock: String(p.stock), sizes: p.sizes || "", colors: p.colors || "" }); setImage(null); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (image) fd.append("image", image);

    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, fd, { headers: { "Content-Type": undefined } });
        toast.success("Product updated");
      } else {
        await api.post("/products", fd, { headers: { "Content-Type": undefined } });
        toast.success("Product created");
      }
      setShowModal(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try { await api.delete(`/products/${id}`); toast.success("Product deleted"); fetchData(); } catch { toast.error("Failed to delete"); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Products ({products.length})</h1>
        <button onClick={openNew} className="btn-primary text-sm inline-flex items-center gap-2"><Plus size={16} /> Add Product</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 border-b dark:border-gray-700"><th className="pb-3">Image</th><th className="pb-3">Product</th><th className="pb-3">Category</th><th className="pb-3">Price</th><th className="pb-3">Stock</th><th className="pb-3">Actions</th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b dark:border-gray-800">
                <td className="py-3">
                  {p.image ? (
                    <img src={getImageUrl(p.image)} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs">No img</div>
                  )}
                </td>
                <td className="py-3 font-medium">{p.name}</td>
                <td className="py-3">{p.category_name || "-"}</td>
                <td className="py-3">R{Number(p.price).toFixed(2)}</td>
                <td className="py-3">{p.stock}</td>
                <td className="py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 glass-clear z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editing ? "Edit" : "Add"} Product</h2>
              <button onClick={() => setShowModal(false)} className="p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" />
                <input type="number" step="0.01" placeholder="Compare Price" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-field">
                  <option value="">Select Category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sizes</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((s) => {
                    const selected = (() => { try { return JSON.parse(form.sizes || "[]"); } catch { return []; } })();
                    const isChecked = selected.includes(s);
                    return (
                      <label key={s} className={`px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${isChecked ? "bg-primary-600 text-white border-primary-600" : "border-gray-300 dark:border-gray-600 hover:border-primary-400"}`}>
                        <input type="checkbox" className="sr-only" checked={isChecked} onChange={() => {
                          const current = isChecked ? selected.filter((x) => x !== s) : [...selected, s];
                          setForm({ ...form, sizes: current.length ? JSON.stringify(current) : "" });
                        }} />
                        {s}
                      </label>
                    );
                  })}
                </div>
              </div>
              <input placeholder='Colors JSON: ["Black","White"]' value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} className="input-field" />
              <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="input-field" />
              <button type="submit" className="btn-primary w-full">{editing ? "Update" : "Create"} Product</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
