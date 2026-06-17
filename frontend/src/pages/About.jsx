import { Link } from "react-router-dom";
import { Globe, Award, Handshake, GraduationCap, Lightbulb, Users, Target, Building2, Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import {
  digititanLinks,
  digititanHero,
  digititanStats,
  digititanAbout,
  digititanServices,
  digititanPillars,
  digititanRegistration,
  digititanContact,
  digititanPartners,
} from "../data/digititanAbout";

const serviceIcons = [Globe, Award, Handshake];
const pillarIcons = [GraduationCap, Users, Lightbulb, Target];

export default function About() {
  return (
    <div>
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 glass-section" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-burnt-600 uppercase tracking-[0.4em] text-xs font-semibold mb-4">{digititanHero.label}</p>
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">
            {digititanHero.title}
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">{digititanHero.subtitle}</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {digititanStats.map((s, i) => (
              <div key={i} className="card text-center hover:-translate-y-3 hover:shadow-[0_0_40px_rgba(14,165,233,0.22)]">
                <p className="text-4xl font-black bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent mb-1">{s.value}</p>
                <p className="text-sm text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">
                {digititanAbout.heading}
              </h2>
              {digititanAbout.paragraphs.map((p, i) => (
                <p key={i} className="text-gray-300 text-lg leading-9 mb-6 last:mb-0">
                  {p}
                </p>
              ))}
              <p className="text-gray-400 leading-8 mt-6">
                <strong className="text-burnt-600">Village NetAcad Academy</strong> is Digititan&apos;s initiative introducing {digititanAbout.villageNetAcad}
              </p>
            </div>
            <div className="card p-10">
              <Building2 size={40} className="text-burnt-600 mb-6" />
              <h3 className="text-2xl font-black mb-4">Our Mission</h3>
              <p className="text-gray-400 leading-8">{digititanAbout.mission}</p>
              <a
                href={digititanLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 text-burnt-600 text-sm font-semibold hover:underline"
              >
                Visit digititan.co.za <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-center mb-4 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">What We Do</h2>
          <p className="text-gray-400 text-center max-w-3xl mx-auto mb-12">
            Building capacity through strategic partnerships and programmes at scale.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {digititanServices.map((item, i) => {
              const Icon = serviceIcons[i];
              return (
                <div key={i} className="card text-center hover:-translate-y-3 hover:shadow-[0_0_40px_rgba(14,165,233,0.22)]">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-burnt-400 to-burnt-700 flex items-center justify-center mx-auto mb-4">
                    <Icon size={28} className="text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {digititanPillars.map((item, i) => {
              const Icon = pillarIcons[i];
              return (
                <div key={i} className="card flex gap-5 hover:border-burnt-600/35 hover:-translate-y-2 transition-all duration-500">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-burnt-400 to-burnt-700 flex items-center justify-center flex-shrink-0">
                    <Icon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-400 leading-7">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Registration â€” extracted links */}
      <section className="section-padding">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="card p-10 border-accent-700/35">
            <h2 className="text-2xl font-black mb-4 text-accent-400">{digititanRegistration.asc.title}</h2>
            <p className="text-gray-300 leading-8 mb-6">{digititanRegistration.asc.description}</p>
            <a
              href={digititanRegistration.asc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline inline-flex items-center gap-2"
            >
              {digititanRegistration.asc.cta} <ExternalLink size={16} />
            </a>
          </div>

        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-center mb-4 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">
            {digititanContact.heading}
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">{digititanContact.subtitle}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <a href={`mailto:${digititanLinks.email}`} className="card flex items-start gap-4 hover:-translate-y-2 hover:border-burnt-600/35 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-burnt-400 to-burnt-700 flex items-center justify-center flex-shrink-0">
                <Mail size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-burnt-600 mb-1">Email</h3>
                <p className="text-sm text-gray-400">{digititanLinks.email}</p>
              </div>
            </a>
            <a href={digititanLinks.website} target="_blank" rel="noopener noreferrer" className="card flex items-start gap-4 hover:-translate-y-2 hover:border-burnt-600/35 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-burnt-400 to-burnt-700 flex items-center justify-center flex-shrink-0">
                <Phone size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-burnt-600 mb-1">Website</h3>
                <p className="text-sm text-gray-400">digititan.co.za</p>
              </div>
            </a>
            <a href={digititanLinks.maps} target="_blank" rel="noopener noreferrer" className="card flex items-start gap-4 hover:-translate-y-2 hover:border-burnt-600/35 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-burnt-400 to-burnt-700 flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-burnt-600 mb-1">Location</h3>
                <p className="text-sm text-gray-400">{digititanContact.location}</p>
              </div>
            </a>
          </div>
          <div className="text-center">
            <Link to="/contact" className="btn-primary inline-block">Send Us A Message</Link>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">
            {digititanPartners.heading}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-12">{digititanPartners.subtitle}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {digititanPartners.names.map((p, i) => (
              <div key={i} className="card flex items-center justify-center h-24 hover:-translate-y-2">
                <span className="text-sm font-bold text-gray-400">{p}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-500 mt-10 text-sm">Interested in partnering on digital skills delivery?</p>
          <Link to="/contact" className="inline-block mt-4 text-burnt-600 font-semibold hover:underline">
            Partner With Digititan
          </Link>
        </div>
      </section>
    </div>
  );
}
