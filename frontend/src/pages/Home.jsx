import { Link } from "react-router-dom";
import { Globe, Award, Handshake } from "lucide-react";
import HeroSlideshow from "../components/HeroSlideshow";
import {
  homeBannerSlides,
  digititanHomeHero,
  digititanStats,
  digititanServices,
  digititanRegistration,
} from "../data/digititanAbout";

const serviceIcons = [Globe, Award, Handshake];

export default function Home() {
  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-burnt-500 rounded-full blur-[150px] opacity-[0.12] top-10 left-10 animate-pulse" />
        <div className="absolute w-96 h-96 bg-accent-600 rounded-full blur-[150px] opacity-[0.08] bottom-10 right-10 animate-pulse" />
      </div>

      {/* Full-width image banner — 1in below header */}
      <div className="relative z-10 w-full mt-[1in]">
        <HeroSlideshow slides={homeBannerSlides} />
      </div>

      {/* Hero copy below banner */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-12 md:py-16 text-center">
        <p className="inline-block px-4 py-2 glass rounded-full border-burnt-500/30 mb-6 text-sm font-medium">
          {digititanHomeHero.label}
        </p>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight max-w-4xl mx-auto">
          {digititanHomeHero.title}{" "}
          <span className="bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">
            {digititanHomeHero.titleHighlight}
          </span>
        </h1>

        <p className="mt-6 text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
          {digititanHomeHero.subtitle}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 max-w-4xl mx-auto">
          {digititanStats.map((s, i) => (
            <div
              key={i}
              className="glass rounded-2xl p-4 text-center hover:border-burnt-500/40 transition-colors"
            >
              <p className="text-2xl sm:text-3xl font-black text-burnt-500">{s.value}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-10">
          <Link
            to="/courses"
            className="bg-glossy-gradient px-8 py-3.5 rounded-full font-semibold hover:scale-105 transition shadow-lg shadow-burnt-500/30"
          >
            Explore Courses
          </Link>
          <Link
            to="/donation"
            className="border border-burnt-600 px-8 py-3.5 rounded-full font-semibold hover:bg-burnt-800/30 transition"
          >
            Donate
          </Link>
          <Link to="/shop" className="border border-white/30 px-8 py-3.5 rounded-full font-semibold hover:bg-white/10 transition">
            Shop
          </Link>
          <Link to="/contact" className="border border-white/30 px-8 py-3.5 rounded-full font-semibold hover:bg-white/10 transition">
            Contact Us
          </Link>
        </div>
      </section>

      {/* Services */}
      <section className="relative z-10 py-16 md:py-24 px-6 sm:px-10 lg:px-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">What We Do</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Building capacity through strategic partnerships and programmes at scale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {digititanServices.map((item, i) => {
              const Icon = serviceIcons[i];
              return (
                <div
                  key={i}
                  className="glass p-8 rounded-3xl hover:-translate-y-2 transition hover:border-burnt-500/40 hover:shadow-[0_0_40px_rgba(14,165,233,0.18)]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-burnt-800/30 flex items-center justify-center mb-5">
                    <Icon size={28} className="text-burnt-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-12">
            <a
              href={digititanRegistration.asc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-burnt-700 px-8 py-3 rounded-full font-semibold hover:scale-105 transition"
            >
              ASC Registration
            </a>
            <Link to="/register" className="border border-burnt-600 px-8 py-3 rounded-full font-semibold hover:bg-burnt-800/30 transition">
              Join Now
            </Link>
            <Link to="/contact" className="border border-white/30 px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
