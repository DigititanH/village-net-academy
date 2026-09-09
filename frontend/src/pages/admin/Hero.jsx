import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Image as ImageIcon } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

const emptySlide = {
  alt_text: "",
  label: "",
  title: "",
  title_highlight: "",
  subtitle: "",
  body: "",
  text_position: "center",
  sort_order: "",
  is_active: "1",
};

const textPositionOptions = [
  { value: "center", label: "Center" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "top", label: "Top center" },
  { value: "bottom", label: "Bottom center" },
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
];

const emptyButton = {
  label: "",
  url: "",
  style: "primary",
  sort_order: "",
  is_active: "1",
  open_in_new_tab: false,
};

const buttonStyleOptions = [
  { value: "primary", label: "Primary (filled)" },
  { value: "outline-primary", label: "Outline (blue)" },
  { value: "outline-accent", label: "Outline (accent)" },
];

export default function AdminHero() {
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [slideForm, setSlideForm] = useState(emptySlide);
  const [image, setImage] = useState(null);
  const [slideSaving, setSlideSaving] = useState(false);
  const [showButtonModal, setShowButtonModal] = useState(false);
  const [buttonSlideId, setButtonSlideId] = useState(null);
  const [editingButton, setEditingButton] = useState(null);
  const [buttonForm, setButtonForm] = useState(emptyButton);
  const [buttonSaving, setButtonSaving] = useState(false);

  const applyHero = (data) => setHero(data);

  const fetchHero = async () => {
    try {
      const res = await api.get("/hero/admin");
      applyHero(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load hero");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHero();
  }, []);

  const openNewSlide = () => {
    setEditingSlide(null);
    setSlideForm(emptySlide);
    setImage(null);
    setShowSlideModal(true);
  };

  const openEditSlide = (slide) => {
    setEditingSlide(slide);
    setSlideForm({
      alt_text: slide.alt_text || slide.alt || "",
      label: slide.label || "",
      title: slide.title || "",
      title_highlight: slide.title_highlight || "",
      subtitle: slide.subtitle || "",
      body: slide.body || "",
      text_position: slide.text_position || "center",
      sort_order: String(slide.sort_order ?? ""),
      is_active: String(slide.is_active ?? 1),
    });
    setImage(null);
    setShowSlideModal(true);
  };

  const saveSlide = async (e) => {
    e.preventDefault();
    if (!editingSlide && !image) {
      toast.error("Please choose an image");
      return;
    }
    setSlideSaving(true);
    try {
      const fd = new FormData();
      Object.entries(slideForm).forEach(([k, v]) => {
        if (v === "" && k === "sort_order") return;
        fd.append(k, String(v));
      });
      if (image) fd.append("image", image);

      let res;
      if (editingSlide) {
        res = await api.post(`/hero/slides/${editingSlide.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/hero/slides", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      applyHero(res.data.hero);
      setShowSlideModal(false);
      toast.success(editingSlide ? "Slide updated" : "Slide added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save slide");
    } finally {
      setSlideSaving(false);
    }
  };

  const deleteSlide = async (id) => {
    if (!confirm("Delete this slide and its buttons?")) return;
    try {
      const res = await api.delete(`/hero/slides/${id}`);
      applyHero(res.data.hero);
      toast.success("Slide deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const openNewButton = (slideId) => {
    setButtonSlideId(slideId);
    setEditingButton(null);
    setButtonForm(emptyButton);
    setShowButtonModal(true);
  };

  const openEditButton = (slideId, btn) => {
    setButtonSlideId(slideId);
    setEditingButton(btn);
    setButtonForm({
      label: btn.label || "",
      url: btn.url || "",
      style: btn.style || "primary",
      sort_order: String(btn.sort_order ?? ""),
      is_active: String(btn.is_active ?? 1),
      open_in_new_tab: Boolean(btn.open_in_new_tab),
    });
    setShowButtonModal(true);
  };

  const saveButton = async (e) => {
    e.preventDefault();
    setButtonSaving(true);
    try {
      const payload = {
        slide_id: buttonSlideId,
        label: buttonForm.label,
        url: buttonForm.url,
        style: buttonForm.style,
        is_active: Number(buttonForm.is_active),
        open_in_new_tab: buttonForm.open_in_new_tab ? 1 : 0,
      };
      if (buttonForm.sort_order !== "") payload.sort_order = Number(buttonForm.sort_order);

      let res;
      if (editingButton) {
        res = await api.put(`/hero/buttons/${editingButton.id}`, payload);
      } else {
        res = await api.post("/hero/buttons", payload);
      }
      applyHero(res.data.hero);
      setShowButtonModal(false);
      toast.success(editingButton ? "Button updated" : "Button added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save button");
    } finally {
      setButtonSaving(false);
    }
  };

  const toggleButtonActive = async (btn) => {
    try {
      const res = await api.put(`/hero/buttons/${btn.id}`, {
        is_active: btn.is_active ? 0 : 1,
      });
      applyHero(res.data.hero);
      toast.success(btn.is_active ? "Button deactivated" : "Button activated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update button");
    }
  };

  const deleteButton = async (id) => {
    if (!confirm("Delete this button?")) return;
    try {
      const res = await api.delete(`/hero/buttons/${id}`);
      applyHero(res.data.hero);
      toast.success("Button deleted");
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
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black mb-2 bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
            Homepage Hero
          </h1>
          <p className="text-sm text-gray-400">
            Each slide has its own messages and centered buttons shown on the slideshow.
          </p>
        </div>
        <button type="button" onClick={openNewSlide} className="btn-primary rounded-xl px-4 py-2 inline-flex items-center gap-2 text-sm">
          <Plus size={16} /> Add slide
        </button>
      </div>

      <div className="space-y-6">
        {(hero?.slides || []).map((slide) => (
          <div key={slide.id} className="card space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="w-full lg:w-56 flex-shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-video lg:aspect-[4/3]">
                {slide.image_url || slide.image ? (
                  <img src={slide.image_url || slide.image} alt={slide.alt_text || ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <ImageIcon size={28} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Order {slide.sort_order} · {slide.is_active ? "Active" : "Hidden"} · Wording:{" "}
                      {slide.text_position || "center"}
                    </p>
                    <h2 className="text-lg font-semibold text-white">
                      {slide.title || "Untitled slide"}{" "}
                      {slide.title_highlight && <span className="text-burnt-300">{slide.title_highlight}</span>}
                    </h2>
                    {slide.label && <p className="text-xs text-gray-400 mt-1">{slide.label}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button type="button" onClick={() => openEditSlide(slide)} className="p-2 rounded-lg hover:bg-white/10 text-gray-300">
                      <Pencil size={16} />
                    </button>
                    <button type="button" onClick={() => deleteSlide(slide.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {slide.subtitle && <p className="text-sm text-gray-300 mt-3 line-clamp-2">{slide.subtitle}</p>}
                {slide.body && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{slide.body}</p>}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold text-white">Buttons for this slide</h3>
                <button
                  type="button"
                  onClick={() => openNewButton(slide.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/5 inline-flex items-center gap-1"
                >
                  <Plus size={14} /> Add button
                </button>
              </div>
              <div className="space-y-2">
                {(slide.buttons || []).map((btn) => (
                  <div
                    key={btn.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{btn.label}</p>
                      <p className="text-xs text-gray-400 truncate">{btn.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleButtonActive(btn)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                          btn.is_active
                            ? "border-green-500/40 text-green-300 bg-green-500/10"
                            : "border-white/20 text-gray-400"
                        }`}
                      >
                        {btn.is_active ? "Active" : "Activate"}
                      </button>
                      <button type="button" onClick={() => openEditButton(slide.id, btn)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300">
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => deleteButton(btn.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {(slide.buttons || []).length === 0 && (
                  <p className="text-xs text-gray-500">No buttons on this slide yet.</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showSlideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="w-full max-w-lg card relative my-8">
            <button type="button" onClick={() => setShowSlideModal(false)} className="absolute right-3 top-3 p-1 text-gray-400 hover:text-white">
              <X size={18} />
            </button>
            <h3 className="text-lg font-semibold mb-4">{editingSlide ? "Edit slide" : "Add slide"}</h3>
            <form onSubmit={saveSlide} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Image {editingSlide ? "(optional)" : ""}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-300"
                />
                {editingSlide?.image_url && !image && (
                  <img src={editingSlide.image_url} alt="" className="mt-2 w-full h-28 object-cover rounded-lg" />
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Label</label>
                <input className="input-field" value={slideForm.label} onChange={(e) => setSlideForm({ ...slideForm, label: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Title</label>
                  <input className="input-field" value={slideForm.title} onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Title highlight</label>
                  <input className="input-field" value={slideForm.title_highlight} onChange={(e) => setSlideForm({ ...slideForm, title_highlight: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Subtitle message</label>
                <textarea className="input-field min-h-[70px]" value={slideForm.subtitle} onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Body message</label>
                <textarea className="input-field min-h-[90px]" value={slideForm.body} onChange={(e) => setSlideForm({ ...slideForm, body: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Wording position on slide</label>
                <select
                  className="select-field-sm w-full"
                  value={slideForm.text_position}
                  onChange={(e) => setSlideForm({ ...slideForm, text_position: e.target.value })}
                >
                  {textPositionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Alt text</label>
                <input className="input-field" value={slideForm.alt_text} onChange={(e) => setSlideForm({ ...slideForm, alt_text: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sort order</label>
                  <input type="number" className="input-field" value={slideForm.sort_order} onChange={(e) => setSlideForm({ ...slideForm, sort_order: e.target.value })} placeholder="Auto" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select className="select-field-sm w-full" value={slideForm.is_active} onChange={(e) => setSlideForm({ ...slideForm, is_active: e.target.value })}>
                    <option value="1">Active</option>
                    <option value="0">Hidden</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={slideSaving} className="btn-primary w-full rounded-xl py-2.5 disabled:opacity-60">
                {slideSaving ? "Saving…" : editingSlide ? "Update slide" : "Add slide"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showButtonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md card relative">
            <button type="button" onClick={() => setShowButtonModal(false)} className="absolute right-3 top-3 p-1 text-gray-400 hover:text-white">
              <X size={18} />
            </button>
            <h3 className="text-lg font-semibold mb-4">{editingButton ? "Edit button" : "Add button"}</h3>
            <form onSubmit={saveButton} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Button text</label>
                <input className="input-field" value={buttonForm.label} onChange={(e) => setButtonForm({ ...buttonForm, label: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Redirect URL</label>
                <input className="input-field" value={buttonForm.url} onChange={(e) => setButtonForm({ ...buttonForm, url: e.target.value })} required placeholder="/courses or https://..." />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Style</label>
                <select className="select-field-sm w-full" value={buttonForm.style} onChange={(e) => setButtonForm({ ...buttonForm, style: e.target.value })}>
                  {buttonStyleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sort order</label>
                  <input type="number" className="input-field" value={buttonForm.sort_order} onChange={(e) => setButtonForm({ ...buttonForm, sort_order: e.target.value })} placeholder="Auto" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select className="select-field-sm w-full" value={buttonForm.is_active} onChange={(e) => setButtonForm({ ...buttonForm, is_active: e.target.value })}>
                    <option value="1">Active</option>
                    <option value="0">Off</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={buttonForm.open_in_new_tab} onChange={(e) => setButtonForm({ ...buttonForm, open_in_new_tab: e.target.checked })} />
                Open in new tab
              </label>
              <button type="submit" disabled={buttonSaving} className="btn-primary w-full rounded-xl py-2.5 disabled:opacity-60">
                {buttonSaving ? "Saving…" : editingButton ? "Update button" : "Add button"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
