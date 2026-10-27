import { useEffect, useState } from "react";
import { X, RefreshCw, Download } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { typesForDepartment } from "../../lib/productTypes";

const money = (n) => `R${Number(n || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function MustekImport({ departments, onClose, onImported }) {
  const [items, setItems] = useState([]);
  const [lines, setLines] = useState([]);
  const [total, setTotal] = useState(0);
  const [markup, setMarkup] = useState(1.25);
  const [search, setSearch] = useState("");
  const [line, setLine] = useState("");
  const [onlyStock, setOnlyStock] = useState(true);
  const [selected, setSelected] = useState({});
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const load = async (opts = {}) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/mustek/catalog", {
        params: {
          search: opts.search ?? search,
          product_line: (opts.line ?? line) || undefined,
          only_in_stock: (opts.onlyStock ?? onlyStock) ? 1 : 0,
          refresh: opts.refresh ? 1 : undefined,
          limit: 200,
        },
      });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setLines(res.data.product_lines || []);
      setMarkup(res.data.markup || 1.25);
      setSelected({});
    } catch (err) {
      setItems([]);
      setTotal(0);
      const status = err.response?.status;
      const apiMsg = err.response?.data?.message;
      if (status === 401) {
        setError("Please log in again as an admin to browse the Mustek catalogue.");
      } else if (status === 502 || apiMsg) {
        setError(apiMsg || "Could not reach Mustek. Check MUSTEK_CUSTOMER_TOKEN in backend-php/.env.");
      } else {
        setError("Could not load Mustek list. Check that the API is running and you are logged in as admin.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const department = departments.find((d) => String(d.id) === String(categoryId));
  const typeOptions = typesForDepartment(department?.slug || "");
  const selectedSkus = Object.keys(selected).filter((k) => selected[k]);
  const allSelected = items.length > 0 && selectedSkus.length === items.length;

  const toggle = (sku) => setSelected((prev) => ({ ...prev, [sku]: !prev[sku] }));
  const toggleAll = () =>
    setSelected(allSelected ? {} : Object.fromEntries(items.map((i) => [i.item_id, true])));

  const handleImport = async () => {
    if (!selectedSkus.length) return;
    if (!categoryId || !subcategory) {
      toast.error("Choose a store department and type before adding Mustek products");
      return;
    }
    setImporting(true);
    try {
      const chosen = items.filter((i) => selectedSkus.includes(i.item_id));
      const res = await api.post("/mustek/import", {
        category_id: categoryId,
        subcategory,
        skus: selectedSkus,
        items: chosen,
      });
      const typeLabel = typeOptions.find((t) => t.value === subcategory)?.label || subcategory;
      toast.success(`Created ${res.data.created}, updated ${res.data.updated} under ${department?.name} › ${typeLabel}`);
      setItems((prev) => prev.filter((i) => !selectedSkus.includes(i.item_id)));
      setTotal((t) => Math.max(0, t - res.data.created));
      setSelected({});
      onImported();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add Mustek products");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 glass-clear z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="card w-full max-w-5xl my-2 sm:my-6 max-h-[94vh] flex flex-col overflow-hidden !p-0">
        <div className="shrink-0 border-b dark:border-gray-700 px-4 sm:px-6 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Select Mustek products to add</h2>
            <button type="button" onClick={onClose} className="p-1" aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-xs font-semibold mb-1">Store department *</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategory("");
                }}
                className="input-field"
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Type *</label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                disabled={!categoryId}
                className="input-field disabled:opacity-60"
              >
                <option value="">Select type</option>
                {typeOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") load();
                }}
                placeholder="Search SKU or name..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Mustek line</label>
              <select
                value={line}
                onChange={(e) => {
                  setLine(e.target.value);
                  load({ line: e.target.value });
                }}
                className="input-field"
              >
                <option value="">All Mustek lines</option>
                {lines.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => load()}
                disabled={loading}
                className="btn-primary text-sm w-full inline-flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Search
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Pick the shop department and type (e.g. Accessories › USB). Selected products are saved there.
          </p>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyStock}
              onChange={(e) => {
                setOnlyStock(e.target.checked);
                load({ onlyStock: e.target.checked });
              }}
            />
            Only show items with stock (markup ×{markup}, then + 15% VAT)
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Showing <span className="font-semibold">{items.length}</span> of{" "}
            <span className="font-semibold">{total}</span> matching products. Already-added SKUs are hidden.
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-auto px-2 sm:px-4 py-3">
          {loading ? (
            <p className="p-10 text-center text-gray-500">Loading Mustek catalogue...</p>
          ) : error ? (
            <div className="p-8 text-center text-sm space-y-2">
              <p className="text-red-500 font-medium">{error}</p>
              <p className="text-gray-500">
                Add your Mustek Customer Token to <code>backend-php/.env</code> as <code>MUSTEK_CUSTOMER_TOKEN=...</code>.
              </p>
            </div>
          ) : items.length === 0 ? (
            <p className="p-10 text-center text-gray-500">No products match your filters</p>
          ) : (
            <table className="w-full text-sm min-w-[720px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-800 text-white text-left">
                  <th className="p-3 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                  </th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Line</th>
                  <th className="p-3 text-right">Stock</th>
                  <th className="p-3 text-right">Cost (excl. VAT)</th>
                  <th className="p-3 text-right">Sell (excl. VAT)</th>
                  <th className="p-3 text-right">Sell (incl. VAT)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.item_id}
                    onClick={() => toggle(item.item_id)}
                    className={`border-b dark:border-gray-800 cursor-pointer ${
                      selected[item.item_id] ? "bg-sky-500/15" : "hover:bg-sky-500/5"
                    }`}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={!!selected[item.item_id]} onChange={() => toggle(item.item_id)} />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {item.preview_url ? (
                          <img
                            src={item.preview_url}
                            alt=""
                            loading="lazy"
                            className="w-12 h-12 object-contain rounded border dark:border-gray-700 bg-white shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded border dark:border-gray-700 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold line-clamp-2">{item.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{item.item_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">{item.product_line || "-"}</td>
                    <td className="p-3 text-right">{item.qty_available}</td>
                    <td className="p-3 text-right text-gray-500">{money(item.cost_price)}</td>
                    <td className="p-3 text-right">{money(item.sell_price_excl_vat)}</td>
                    <td className="p-3 text-right font-bold">{money(item.sell_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="shrink-0 border-t dark:border-gray-700 px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">
            {selectedSkus.length} selected
            {categoryId && subcategory ? (
              <span className="font-normal text-gray-500">
                {" "}
                · {department?.name} › {typeOptions.find((t) => t.value === subcategory)?.label}
              </span>
            ) : (
              <span className="font-normal text-red-500"> · choose a store department and type above</span>
            )}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!selectedSkus.length || importing || !categoryId || !subcategory}
              className="btn-primary text-sm inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Download size={16} />
              {importing ? "Adding..." : `Add ${selectedSkus.length || ""} to store`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
