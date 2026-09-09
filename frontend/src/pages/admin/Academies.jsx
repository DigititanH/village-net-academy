import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { SA_PROVINCES } from "../../data/ascCentres";

const emptyForm = {
  name: "",
  province: "KwaZulu-Natal",
  city: "",
  address: "",
  contact: "",
  people_trained: "0",
  sales_made: "0",
};

export default function AdminAcademies() {
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCentres = async () => {
    try {
      const res = await api.get("/asc/admin/centres");
      setCentres(res.data.centres || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load academies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCentres();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return centres.filter((c) => {
      if (provinceFilter && c.province !== provinceFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q) ||
        (c.province || "").toLowerCase().includes(q)
      );
    });
  }, [centres, search, provinceFilter]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name || "",
      province: c.province || "KwaZulu-Natal",
      city: c.city || "",
      address: c.address || "",
      contact: c.contact || "",
      people_trained: String(c.people_trained ?? 0),
      sales_made: String(c.sales_made ?? 0),
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        province: form.province,
        city: form.city.trim(),
        address: form.address.trim(),
        contact: form.contact.trim(),
        people_trained: Number(form.people_trained || 0),
        sales_made: Number(form.sales_made || 0),
      };
      let res;
      if (editing) {
        res = await api.put(`/asc/admin/centres/${editing.id}`, payload);
      } else {
        res = await api.post("/asc/admin/centres", payload);
      }
      setCentres(res.data.centres || []);
      setShowModal(false);
      toast.success(editing ? "Academy updated" : "Academy added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this academy from the map?")) return;
    try {
      const res = await api.delete(`/asc/admin/centres/${id}`);
      setCentres(res.data.centres || []);
      toast.success("Academy deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black mb-1 bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
            Map academies
          </h1>
          <p className="text-sm text-gray-400">
            Add academies and set how many people each has trained — shown on the Training Academy map.
          </p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary rounded-xl px-4 py-2 inline-flex items-center gap-2 text-sm">
          <Plus size={16} /> Add academy
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Search academies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select-field-sm"
          value={provinceFilter}
          onChange={(e) => setProvinceFilter(e.target.value)}
        >
          <option value="">All provinces</option>
          {SA_PROVINCES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-white/10">
              <th className="pb-3 pr-3">Academy</th>
              <th className="pb-3 pr-3">Province</th>
              <th className="pb-3 pr-3">People trained</th>
              <th className="pb-3 pr-3">Sales made</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="py-3 pr-3 font-medium text-white">{c.name}</td>
                <td className="py-3 pr-3 text-gray-400">{c.province}</td>
                <td className="py-3 pr-3 text-burnt-300 font-semibold">
                  {Number(c.people_trained || 0).toLocaleString()}
                </td>
                <td className="py-3 pr-3 text-primary-300 font-semibold">
                  {Number(c.sales_made || 0).toLocaleString()}
                </td>
                <td className="py-3">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-white/10 text-gray-300">
                      <Pencil size={16} />
                    </button>
                    <button type="button" onClick={() => remove(c.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 py-8 text-center">No academies match your filters.</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md card relative">
            <button type="button" onClick={() => setShowModal(false)} className="absolute right-3 top-3 p-1 text-gray-400 hover:text-white">
              <X size={18} />
            </button>
            <h3 className="text-lg font-semibold mb-4">{editing ? "Edit academy" : "Add academy"}</h3>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Academy name</label>
                <input
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Province</label>
                <select
                  className="select-field-sm w-full"
                  value={form.province}
                  onChange={(e) => setForm({ ...form, province: e.target.value })}
                  required
                >
                  {SA_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">People trained</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={form.people_trained}
                  onChange={(e) => setForm({ ...form, people_trained: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Sales made</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={form.sales_made}
                  onChange={(e) => setForm({ ...form, sales_made: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">City (optional)</label>
                <input className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Address (optional)</label>
                <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Contact email (optional)</label>
                <input className="input-field" type="email" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full rounded-xl py-2.5 disabled:opacity-60">
                {saving ? "Saving…" : editing ? "Save changes" : "Add academy"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
