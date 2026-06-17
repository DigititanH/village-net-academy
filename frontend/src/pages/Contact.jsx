import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import api from "../lib/api";
import { SITE_EMAIL } from "../lib/site";
import { digititanContact, digititanLinks } from "../data/digititanAbout";
import toast from "react-hot-toast";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contact", form);
      setSent(true);
      toast.success("Message sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send");
    }
    setLoading(false);
  };

  return (
    <div>
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 glass-section" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Contact Us</h1>
          <p className="text-lg text-gray-400">Have questions? We'd love to hear from you.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              {[
                { icon: Mail, title: "Email", text: SITE_EMAIL, href: `mailto:${SITE_EMAIL}` },
                { icon: Phone, title: "Phone", text: "+27 128440176" },
                { icon: MapPin, title: "Location", text: digititanContact.location, href: digititanLinks.maps },
              ].map((item, i) => (
                <div key={i} className="card flex items-start gap-4 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(14,165,233,0.22)]">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-burnt-400 to-burnt-700 flex items-center justify-center flex-shrink-0">
                    <item.icon size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-burnt-600">{item.title}</h3>
                    <p className="text-sm text-gray-400">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-2">
              {sent ? (
                <div className="card text-center py-12">
                  <CheckCircle size={48} className="text-burnt-600 mx-auto mb-4" />
                  <h2 className="text-xl font-black mb-2">Message Sent!</h2>
                  <p className="text-gray-400 mb-4">
                    We&apos;ll get back to you as soon as possible. Messages are sent to{" "}
                    <a href={`mailto:${SITE_EMAIL}`} className="text-burnt-600 hover:underline">{SITE_EMAIL}</a>.
                  </p>
                  <button onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }} className="btn-primary">Send Another</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="card space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-300">Name *</label>
                      <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-300">Email *</label>
                      <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-300">Subject</label>
                    <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-300">Message *</label>
                    <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-field" rows={5} />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
                    {loading ? "Sending..." : <><Send size={16} /> Send Message</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
