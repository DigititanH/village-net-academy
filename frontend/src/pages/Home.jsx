import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, CheckCircle, GraduationCap, MapPin, Users } from "lucide-react";
import HeroSlideshow from "../components/HeroSlideshow";
import {
  homeBannerSlides,
  digititanHomeHero,
  homeLearnerBenefits,
  digititanRegistration,
} from "../data/digititanAbout";
import api from "../lib/api";

const benefitIcons = [MapPin, Award, GraduationCap, Users];
const benefitStyles = [
  { wrap: "from-burnt-400/30 to-burnt-600/10 border-burnt-400/40", icon: "bg-burnt-500/25 text-burnt-300" },
  { wrap: "from-primary-400/30 to-primary-600/10 border-primary-400/40", icon: "bg-primary-500/25 text-primary-300" },
  { wrap: "from-accent-400/30 to-accent-600/10 border-accent-400/40", icon: "bg-accent-500/25 text-accent-300" },
  { wrap: "from-sky-400/30 to-cyan-600/10 border-sky-400/40", icon: "bg-sky-500/25 text-sky-300" },
];

const fallbackSlides = homeBannerSlides.map((s, i) => ({
  ...s,
  id: `fallback-${i}`,
  label: digititanHomeHero.label,
  title: digititanHomeHero.title,
  titleHighlight: digititanHomeHero.titleHighlight,
  subtitle: digititanHomeHero.subtitle,
  body: digititanHomeHero.body,
  text_position: "center",
  buttons: [
    { id: `fb-${i}-1`, label: "Explore Courses", url: "/courses", style: "primary" },
    { id: `fb-${i}-2`, label: "Join Now", url: "/login", style: "outline-primary" },
    { id: `fb-${i}-3`, label: "Contact Us", url: "/contact", style: "outline-accent" },
  ],
}));

export default function Home() {
  const [slides, setSlides] = useState(fallbackSlides);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/hero")
      .then((res) => {
        if (cancelled || !res.data) return;
        const apiSlides = (res.data.slides || [])
          .filter((s) => s.image || s.image_url)
          .map((s) => ({
            id: s.id,
            image: s.image || s.image_url,
            alt: s.alt || s.alt_text || "",
            label: s.label || "",
            title: s.title || "",
            titleHighlight: s.title_highlight || "",
            subtitle: s.subtitle || "",
            body: s.body || "",
            text_position: s.text_position || "center",
            buttons: (s.buttons || []).filter((b) => b.label && b.url),
          }));
        if (apiSlides.length) setSlides(apiSlides);
      })
      .catch(() => {
        /* keep static defaults */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[28rem] h-[28rem] bg-burnt-400 rounded-full blur-[140px] opacity-30 top-0 left-0 animate-pulse" />
        <div className="absolute w-[26rem] h-[26rem] bg-primary-400 rounded-full blur-[140px] opacity-25 top-20 right-0 animate-pulse" />
        <div className="absolute w-80 h-80 bg-accent-400 rounded-full blur-[120px] opacity-20 bottom-10 left-1/3" />
      </div>

      {slides.length > 0 && (
        <div className="relative z-10 w-full">
          <HeroSlideshow slides={slides} />
        </div>
      )}

      <section className="relative z-10 py-16 md:py-24 px-6 sm:px-10 lg:px-12 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
              What Learners <span className="text-burnt-400">Get</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Practical support and <span className="text-primary-300 font-medium">recognised skills</span>, delivered
              where you live and learn.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {homeLearnerBenefits.map((item, i) => {
              const Icon = benefitIcons[i] || CheckCircle;
              const style = benefitStyles[i % benefitStyles.length];
              return (
                <div
                  key={item}
                  className={`p-6 rounded-3xl flex gap-4 items-start border bg-gradient-to-br ${style.wrap} hover:-translate-y-1.5 transition duration-300`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${style.icon}`}>
                    <Icon size={22} />
                  </div>
                  <p className="text-white font-semibold leading-relaxed pt-2">{item}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-12">
            <a
              href={digititanRegistration.asc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-burnt-500 px-8 py-3 rounded-full font-semibold hover:scale-105 transition shadow-lg shadow-burnt-500/30"
            >
              Centres Registration
            </a>
            <Link
              to="/training-academy"
              className="border border-primary-400/50 text-primary-200 px-8 py-3.5 rounded-full font-semibold hover:bg-primary-500/15 transition"
            >
              Training Academy
            </Link>
            <Link
              to="/contact"
              className="border border-accent-400/45 text-accent-200 px-8 py-3.5 rounded-full font-semibold hover:bg-accent-500/15 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
