import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, X, Check, RefreshCw, Package } from "lucide-react";
import api from "../../lib/api";
import MustekImport from "./MustekImport";
import { brandsForType } from "../../data/laptopBrands";
import toast from "react-hot-toast";
import {
  productTypeLabel,
  typesForDepartment,
  merchandiseUsesSizes,
  STORE_DEPARTMENT_SLUGS,
} from "../../lib/productTypes";
import { parseColorStock, parseProductOptions, parseOptionPrices } from "../../lib/productOptions";

const CAPACITY_PRESETS = ["8 GB", "16 GB", "32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"];

function capacityRowsToPayload(rows) {
  const map = {};
  rows.forEach((r) => {
    const name = String(r.name || "").trim();
    if (!name) return;
    const price = parseFloat(r.price);
    map[name] = Number.isFinite(price) && price > 0 ? price : null;
  });
  return Object.keys(map).length ? JSON.stringify(map) : "";
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  compare_price: "",
  category_id: "",
  subcategory: "",
  brand: "",
  stock: "0",
  sizes: "",
  colors: "",
  color_stock: "",
  is_active: "1",
};

const DEPARTMENT_SLUGS = STORE_DEPARTMENT_SLUGS;

function appendFormData(fd, form) {
  const skipIfEmpty = new Set(["compare_price", "category_id", "subcategory", "sizes", "colors", "color_stock"]);
  Object.entries(form).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    if (skipIfEmpty.has(k) && v === "") return;
    fd.append(k, String(v));
  });
}

function colorRowsToPayload(rows) {
  const cleaned = rows
    .map((r) => ({ name: String(r.name || "").trim(), stock: Math.max(0, parseInt(r.stock, 10) || 0) }))
    .filter((r) => r.name);
  if (!cleaned.length) {
    return { colors: "", color_stock: "", stock: null };
  }
  const map = {};
  cleaned.forEach((r) => {
    map[r.name] = (map[r.name] || 0) + r.stock;
  });
  const total = Object.values(map).reduce((s, n) => s + n, 0);
  return {
    colors: JSON.stringify(Object.keys(map)),
    color_stock: JSON.stringify(map),
    stock: String(total),
  };
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMustek, setShowMustek] = useState(false);
  const [mustekSyncing, setMustekSyncing] = useState(false);
  const [editing, setEditing] = useState(null);
  const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
  const [form, setForm] = useState(emptyForm);
  const [colorRows, setColorRows] = useState([{ name: "", stock: "0" }]);
  const [capacityRows, setCapacityRows] = useState([]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stockDrafts, setStockDrafts] = useState({});
  const [stockSavingId, setStockSavingId] = useState(null);

  const departments = useMemo(
    () =>
      categories
        .filter((c) => DEPARTMENT_SLUGS.includes(c.slug))
        .sort((a, b) => DEPARTMENT_SLUGS.indexOf(a.slug) - DEPARTMENT_SLUGS.indexOf(b.slug)),
    [categories]
  );

  const selectedDepartment = useMemo(
    () => departments.find((c) => String(c.id) === String(form.category_id)) || null,
    [departments, form.category_id]
  );

  const departmentSlug = useMemo(() => {
    if (!selectedDepartment) return "";
    const slug = String(selectedDepartment.slug || "").toLowerCase();
    if (DEPARTMENT_SLUGS.includes(slug)) return slug;
    const name = String(selectedDepartment.name || "").toLowerCase();
    if (name.includes("electronic")) return "electronics";
    if (name.includes("merchandise")) return "merchandise";
    if (name.includes("accessor")) return "accessories";
    return slug;
  }, [selectedDepartment]);

  const isElectronics = departmentSlug === "electronics";
  const isMerchandise = departmentSlug === "merchandise";
  const isAccessories = departmentSlug === "accessories";
  const showSizes = isMerchandise && merchandiseUsesSizes(form.subcategory);
  const showCapacities = Boolean(departmentSlug) && !isMerchandise;
  const typeOptions = typesForDepartment(departmentSlug);

  const fetchData = async () => {
    try {
      const [p, c] = await Promise.all([
        api.get("/products/admin/all"),
        api.get("/products/meta/categories"),
      ]);
      const list = p.data.products || [];
      setProducts(list);
      setCategories(c.data || []);
      const drafts = {};
      list.forEach((item) => {
        drafts[item.id] = String(item.stock ?? 0);
      });
      setStockDrafts(drafts);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMustekSync = async () => {
    setMustekSyncing(true);
    try {
      const { data } = await api.post("/mustek/sync", {});
      const s = data.stats || {};
      const parts = [`Updated ${s.updated ?? 0} Mustek products`];
      if (s.specials_started) parts.push(`${s.specials_started} new specials`);
      if (s.specials_ended) parts.push(`${s.specials_ended} specials ended`);
      if (s.not_in_feed) parts.push(`${s.not_in_feed} no longer at Mustek (stock set to 0)`);
      toast.success(parts.join(" · "));
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Mustek sync failed");
    } finally {
      setMustekSyncing(false);
    }
  };

  const saveStock = async (product) => {
    if (product.color_stock) {
      toast.error("This product has colour stock — open Edit to update per-colour quantities");
      return;
    }
    const raw = stockDrafts[product.id];
    const next = Math.max(0, parseInt(String(raw ?? "0"), 10) || 0);
    if (next === Number(product.stock)) {
      toast.success("Stock unchanged");
      return;
    }
    setStockSavingId(product.id);
    try {
      await api.put(`/products/${product.id}`, { stock: next });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, stock: next } : p)));
      setStockDrafts((prev) => ({ ...prev, [product.id]: String(next) }));
      toast.success(`Stock updated to ${next}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update stock");
    } finally {
      setStockSavingId(null);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setColorRows([{ name: "", stock: "0" }]);
    setCapacityRows([]);
    setImage(null);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    let rows = parseColorStock(p.color_stock, null);
    if (!rows.length) {
      const names = parseProductOptions(p.colors);
      if (names.length) {
        const total = Math.max(0, parseInt(p.stock, 10) || 0);
        const each = Math.floor(total / names.length);
        let remainder = total - each * names.length;
        rows = names.map((name) => {
          const extra = remainder > 0 ? 1 : 0;
          if (remainder > 0) remainder -= 1;
          return { name, stock: String(each + extra) };
        });
      }
    }
    setColorRows(rows.length ? rows : [{ name: "", stock: "0" }]);
    setCapacityRows(
      String(p.category_slug || "").toLowerCase() === "merchandise"
        ? []
        : parseOptionPrices(p.sizes).map((o) => ({ name: o.name, price: o.price != null ? String(o.price) : "" }))
    );
    setForm({
      name: p.name || "",
      description: p.description || "",
      price: String(p.price ?? ""),
      compare_price: p.compare_price != null && p.compare_price !== "" ? String(p.compare_price) : "",
      category_id: p.category_id ? String(p.category_id) : "",
      subcategory: p.subcategory || "",
      brand: p.brand || "",
      stock: String(p.stock ?? 0),
      sizes: p.sizes || "",
      colors: p.colors || "",
      color_stock: p.color_stock || "",
      is_active: String(p.is_active ?? 1),
    });
    setImage(null);
    setShowModal(true);
  };

  const handleCategoryChange = (categoryId) => {
    const dept = departments.find((c) => String(c.id) === String(categoryId));
    const slug = String(dept?.slug || "").toLowerCase();
    const isMerch = slug === "merchandise" || String(dept?.name || "").toLowerCase().includes("merchandise");
    setForm((prev) => ({
      ...prev,
      category_id: categoryId,
      subcategory: "",
      sizes: isMerch ? prev.sizes : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category_id) {
      toast.error("Please select Merchandise, Electronics, or Accessories");
      return;
    }
    if (isElectronics && !form.subcategory) {
      toast.error("Please select Laptop or Tablet");
      return;
    }
    if (isMerchandise && !form.subcategory) {
      toast.error("Please select Hoodie, T-shirt, Cap, or Golf t-shirt");
      return;
    }
    if (isAccessories && !form.subcategory) {
      toast.error("Please select Bags, USB, Headphones, Powerbank, or Cameras");
      return;
    }

    const colorPayload = colorRowsToPayload(colorRows);
    const hasColors = colorRows.some((r) => String(r.name || "").trim());
    if (hasColors && !colorPayload.color_stock) {
      toast.error("Add at least one colour with a name");
      return;
    }

    const payload = {
      ...form,
      subcategory: form.subcategory || "",
      sizes: showSizes ? form.sizes : showCapacities ? capacityRowsToPayload(capacityRows) : "",
      colors: colorPayload.colors,
      color_stock: colorPayload.color_stock,
      stock: hasColors ? colorPayload.stock : form.stock,
    };

    const fd = new FormData();
    appendFormData(fd, payload);
    if (!payload.subcategory) fd.append("subcategory", "");
    if (!payload.sizes) fd.append("sizes", "");
    if (!hasColors) {
      fd.append("colors", "");
      fd.append("color_stock", "");
    }
    if (image) fd.append("image", image);

    setSaving(true);
    try {
      if (editing) {
        await api.post(`/products/${editing.id}`, fd);
        toast.success("Product updated");
      } else {
        if (!image) {
          toast.error("Please choose a product image");
          setSaving(false);
          return;
        }
        await api.post("/products", fd);
        toast.success("Product created");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-black bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
          Products ({products.length})
        </h1>
        <button onClick={openNew} className="btn-primary text-sm inline-flex items-center gap-2">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="card mb-6 border border-burnt-500/40 bg-burnt-500/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Mustek catalogue</p>
          <p className="text-sm text-gray-500">
            Browse Mustek products and pick which ones to add to your store. Syncing updates prices and stock; Mustek
            price drops of 5% or more become specials automatically.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row shrink-0">
          <button
            type="button"
            onClick={handleMustekSync}
            disabled={mustekSyncing}
            className="btn-secondary text-sm inline-flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className={mustekSyncing ? "animate-spin" : ""} />
            {mustekSyncing ? "Syncing..." : "Sync Mustek prices"}
          </button>
          <button
            type="button"
            onClick={() => setShowMustek(true)}
            className="btn-primary text-sm inline-flex items-center justify-center gap-2"
          >
            <Package size={16} /> Browse Mustek products
          </button>
        </div>
      </div>

      {showMustek && (
        <MustekImport departments={departments} onClose={() => setShowMustek(false)} onImported={fetchData} />
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b dark:border-gray-700">
              <th className="pb-3">Image</th>
              <th className="pb-3">Product</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Type</th>
              <th className="pb-3">Price</th>
              <th className="pb-3">Stock</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  No products yet. Click Add Product to create one.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b dark:border-gray-800">
                  <td className="py-3">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </td>
                  <td className="py-3 font-medium">
                    {p.name}
                    {p.mustek_sku ? (
                      <span className="block text-xs font-normal text-sky-500">
                        Mustek {p.mustek_sku}
                        {Number(p.mustek_special) === 1 ? " · special" : ""}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3">{p.category_name || "-"}</td>
                  <td className="py-3">{productTypeLabel(p.subcategory) || "-"}</td>
                  <td className="py-3">R{Number(p.price).toFixed(2)}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5 min-w-[9rem]">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={stockDrafts[p.id] ?? String(p.stock ?? 0)}
                        onChange={(e) =>
                          setStockDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveStock(p);
                          }
                        }}
                        className="input-field !py-1.5 !px-2 w-20 text-sm"
                        aria-label={`Stock for ${p.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => saveStock(p)}
                        disabled={stockSavingId === p.id}
                        className="p-1.5 rounded-lg border border-white/15 hover:bg-white/10 text-burnt-300 disabled:opacity-50"
                        title="Save stock"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        Number(p.is_active) === 1
                          ? "bg-green-900/30 text-green-400"
                          : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {Number(p.is_active) === 1 ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Edit product"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                        title="Delete product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 glass-clear z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="card w-full max-w-lg my-4 sm:my-8 max-h-[min(92vh,900px)] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-bold">{editing ? "Edit" : "Add"} Product</h2>
              <button type="button" onClick={() => setShowModal(false)} className="p-1">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto overscroll-contain pr-1 flex-1 min-h-0">
              <input
                required
                placeholder="Product Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field"
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="input-field"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Compare Price"
                  value={form.compare_price}
                  onChange={(e) => setForm({ ...form, compare_price: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Department</label>
                <select
                  required
                  value={form.category_id}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Merchandise, Electronics, or Accessories</option>
                  {departments.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {typeOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isElectronics
                      ? "Electronics type"
                      : isAccessories
                        ? "Accessories type"
                        : "Merchandise type"}
                  </label>
                  <select
                    required
                    value={form.subcategory}
                    onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select type</option>
                    {typeOptions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {isElectronics && brandsForType(form.subcategory).length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">Brand</label>
                  <select
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Detect from product name</option>
                    {brandsForType(form.subcategory).map(({ name: b }) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Shoppers filter laptops and tablets by these round brand logos.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  {colorRows.some((r) => String(r.name || "").trim()) ? "Total stock (from colours)" : "Stock quantity"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="0"
                  value={
                    colorRows.some((r) => String(r.name || "").trim())
                      ? String(
                          colorRows.reduce((sum, r) => sum + (Math.max(0, parseInt(r.stock, 10) || 0)), 0)
                        )
                      : form.stock
                  }
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  disabled={colorRows.some((r) => String(r.name || "").trim())}
                  className="input-field disabled:opacity-60"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {colorRows.some((r) => String(r.name || "").trim())
                    ? "Total updates automatically from colour stock below."
                    : "How many units are available when this product has no colour variants."}
                </p>
              </div>
              {showSizes && (
                <div>
                  <label className="block text-sm font-medium mb-2">Sizes</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SIZES.map((s) => {
                      let selected = [];
                      try {
                        selected = JSON.parse(form.sizes || "[]");
                      } catch {
                        selected = [];
                      }
                      const isChecked = selected.includes(s);
                      return (
                        <label
                          key={s}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-primary-600 text-white border-primary-600"
                              : "border-gray-300 dark:border-gray-600 hover:border-primary-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isChecked}
                            onChange={() => {
                              const current = isChecked
                                ? selected.filter((x) => x !== s)
                                : [...selected, s];
                              setForm({ ...form, sizes: current.length ? JSON.stringify(current) : "" });
                            }}
                          />
                          {s}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              {showCapacities && (
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="block text-sm font-medium">Capacity options (e.g. SanDisk 16 GB, 32 GB)</label>
                    <button
                      type="button"
                      className="text-xs text-burnt-500 hover:underline"
                      onClick={() => setCapacityRows((prev) => [...prev, { name: "", price: "" }])}
                    >
                      + Add capacity
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {CAPACITY_PRESETS.map((preset) => {
                      const added = capacityRows.some((r) => r.name.trim().toLowerCase() === preset.toLowerCase());
                      return (
                        <button
                          key={preset}
                          type="button"
                          disabled={added}
                          onClick={() => setCapacityRows((prev) => [...prev, { name: preset, price: "" }])}
                          className="px-2.5 py-1 rounded-lg border border-white/15 text-xs font-semibold hover:border-burnt-400/50 disabled:opacity-40"
                        >
                          + {preset}
                        </button>
                      );
                    })}
                  </div>
                  {capacityRows.length > 0 && (
                    <div className="space-y-2">
                      {capacityRows.map((row, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            placeholder="Capacity (e.g. 64 GB)"
                            value={row.name}
                            onChange={(e) => {
                              const next = [...capacityRows];
                              next[idx] = { ...next[idx], name: e.target.value };
                              setCapacityRows(next);
                            }}
                            className="input-field flex-1"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={form.price ? `R${form.price}` : "Price"}
                            value={row.price}
                            onChange={(e) => {
                              const next = [...capacityRows];
                              next[idx] = { ...next[idx], price: e.target.value };
                              setCapacityRows(next);
                            }}
                            className="input-field w-28"
                            title="Price for this capacity (blank = base price)"
                          />
                          <button
                            type="button"
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                            onClick={() => setCapacityRows((prev) => prev.filter((_, i) => i !== idx))}
                            title="Remove capacity"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Shoppers must pick a capacity. Set a price per capacity, or leave it blank to use the main price. Leave empty if the product has no capacity options.
                  </p>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="block text-sm font-medium">Colours & stock</label>
                  <button
                    type="button"
                    className="text-xs text-burnt-500 hover:underline"
                    onClick={() => setColorRows((prev) => [...prev, { name: "", stock: "0" }])}
                  >
                    + Add colour
                  </button>
                </div>
                <div className="space-y-2">
                  {colorRows.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        placeholder="Colour name (e.g. Black)"
                        value={row.name}
                        onChange={(e) => {
                          const next = [...colorRows];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setColorRows(next);
                        }}
                        className="input-field flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Qty"
                        value={row.stock}
                        onChange={(e) => {
                          const next = [...colorRows];
                          next[idx] = { ...next[idx], stock: e.target.value };
                          setColorRows(next);
                        }}
                        className="input-field w-24"
                        title="Stock for this colour"
                      />
                      <button
                        type="button"
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                        onClick={() => {
                          setColorRows((prev) => (prev.length <= 1 ? [{ name: "", stock: "0" }] : prev.filter((_, i) => i !== idx)));
                        }}
                        title="Remove colour"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Shoppers pick a colour and only that colour’s stock is used. Leave blank if the product has no colour options.
                </p>
              </div>
              {editing?.image && !image && (
                <div className="flex items-center gap-3">
                  <img src={editing.image} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  <p className="text-xs text-gray-500">Current image — upload a new file to replace it</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="input-field"
              />
              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? "Saving..." : editing ? "Update Product" : "Create Product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
