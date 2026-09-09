import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle, Facebook, Instagram, Linkedin } from "lucide-react";
import api from "../lib/api";
import { SITE_EMAIL } from "../lib/site";
import { digititanContact, digititanLinks } from "../data/digititanAbout";
import toast from "react-hot-toast";
import PageHero from "../components/PageHero";
import { pageHeroImages } from "../data/pageHeroImages";

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function TikTokIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.52a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15z" />
    </svg>
  );
}

const socials = [
  { name: "Facebook", href: digititanLinks.facebook, Icon: Facebook },
  { name: "Instagram", href: digititanLinks.instagram, Icon: Instagram },
  { name: "TikTok", href: digititanLinks.tiktok, Icon: TikTokIcon },
  { name: "LinkedIn", href: digititanLinks.linkedin, Icon: Linkedin },
];

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
      <PageHero
        image={pageHeroImages.contact}
        alt="Get in touch with Village NetAcad"
        title="Contact Us"
        subtitle="Have questions? We'd love to hear from you."
      />

      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              {[
                { icon: Mail, title: "Email", text: SITE_EMAIL, href: `mailto:${SITE_EMAIL}` },
                { icon: Phone, title: "Phone", text: "+27 128440176" },
                { icon: WhatsAppIcon, title: "WhatsApp", text: digititanLinks.whatsappDisplay, href: digititanLinks.whatsapp },
                { icon: MapPin, title: "Location", text: digititanContact.location, href: digititanLinks.maps },
              ].map((item, i) => (
                <a
                  key={i}
                  href={item.href || undefined}
                  target={item.href?.startsWith("http") ? "_blank" : undefined}
                  rel={item.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="card flex items-start gap-4 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(14,165,233,0.22)] block"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-burnt-400 to-primary-400 flex items-center justify-center flex-shrink-0">
                    <item.icon size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-burnt-600">{item.title}</h3>
                    <p className="text-sm text-gray-400">{item.text}</p>
                  </div>
                </a>
              ))}

              <div className="card">
                <h3 className="font-bold text-lg text-burnt-600 mb-1">Follow Village NetAcad</h3>
                <p className="text-sm text-gray-400 mb-5">Stay connected with us on social media.</p>
                <div className="grid grid-cols-2 gap-3">
                  {socials.map(({ name, href, Icon }) => (
                    <a
                      key={name}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 hover:border-burnt-600/40 hover:bg-burnt-800/20 transition-colors"
                    >
                      <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-burnt-400 to-primary-400 flex items-center justify-center flex-shrink-0 text-white">
                        <Icon size={18} />
                      </span>
                      <span className="text-sm font-semibold text-gray-200">{name}</span>
                    </a>
                  ))}
                </div>
              </div>
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
