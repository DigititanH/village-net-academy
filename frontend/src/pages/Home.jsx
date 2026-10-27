import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Laptop,
  Network,
  Shield,
  Sparkles,
} from "lucide-react";
import {
  homeCoursePreview,
  homeHero,
  homeHowItWorks,
  homeImpactMetrics,
  homePartners,
  homeProductShowcase,
  homeStories,
} from "../data/homePage";
import { digititanLinks } from "../data/digititanAbout";
import api, { mediaUrl } from "../lib/api";

const howIcons = [BookOpen, Laptop, GraduationCap];
const courseIcons = [Shield, Network, Sparkles, BookOpen];

function NeonCta({ to, href, children, variant = "solid", openInNewTab = false }) {
  const className =
    variant === "solid"
      ? "neon-btn inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm sm:text-base"
      : "neon-btn-outline inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm sm:text-base";
  if (href) {
    const external = openInNewTab || /^https?:\/\//i.test(href);
    return (
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}

function HeroMediaLoop({ images, onIndexChange }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
  }, [images]);
  useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);
  useEffect(() => {
    if (images.length < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), 3500);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="relative aspect-[16/9] md:aspect-[16/10] rounded-xl overflow-hidden neon-frame">
      {images.map((img, i) => (
        <img
          key={`${img.src}-${i}`}
          src={img.src}
          alt={img.alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-primary-500/10 pointer-events-none" />
      <div className="absolute bottom-3 left-3 right-3 flex gap-1.5 justify-center">
        {images.map((img, i) => (
          <span
            key={`${img.src}-dot-${i}`}
            className={`h-1 rounded-full transition-all ${i === index ? "w-6 bg-primary-300 shadow-[0_0_10px_rgba(34,211,238,0.9)]" : "w-1.5 bg-white/35"}`}
          />
        ))}
      </div>
    </div>
  );
}

function mapHeroButtons(buttons) {
  if (!buttons?.length) {
    return [
      { label: homeHero.primaryCta.label, to: homeHero.primaryCta.to, variant: "solid" },
      { label: homeHero.secondaryCta.label, to: homeHero.secondaryCta.to, variant: "outline" },
    ];
  }
  return buttons.map((btn, i) => {
    const url = String(btn.url || "").trim() || "/";
    const isExternal = /^https?:\/\//i.test(url) || Number(btn.open_in_new_tab) === 1;
    const variant = i === 0 || btn.style === "primary" ? "solid" : "outline";
    if (isExternal || url.startsWith("mailto:") || url.startsWith("tel:")) {
      return { label: btn.label, href: url, variant, openInNewTab: Number(btn.open_in_new_tab) === 1 || /^https?:\/\//i.test(url) };
    }
    return { label: btn.label, to: url, variant };
  });
}

function StoriesCarousel({ stories }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % stories.length), 5000);
    return () => clearInterval(id);
  }, [stories.length]);
  const story = stories[index];

  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="neon-frame rounded-2xl p-6 sm:p-8 glass-clear flex flex-col sm:flex-row gap-6 items-center">
        <img
          src={story.image}
          alt=""
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-primary-400/60 shadow-[0_0_24px_rgba(34,211,238,0.35)]"
        />
        <div className="text-center sm:text-left">
          <p className="text-lg sm:text-xl text-white font-medium leading-relaxed">“{story.quote}”</p>
          <p className="mt-3 text-primary-300 font-semibold">— {story.name}</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 mt-5">
        <button
          type="button"
          aria-label="Previous story"
          onClick={() => setIndex((i) => (i - 1 + stories.length) % stories.length)}
          className="p-2 rounded-full border border-primary-400/40 text-primary-200 hover:shadow-[0_0_16px_rgba(34,211,238,0.45)] transition"
        >
          <ChevronLeft size={18} />
        </button>
        {stories.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Story ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-primary-300" : "w-2 bg-white/30"}`}
          />
        ))}
        <button
          type="button"
          aria-label="Next story"
          onClick={() => setIndex((i) => (i + 1) % stories.length)}
          className="p-2 rounded-full border border-primary-400/40 text-primary-200 hover:shadow-[0_0_16px_rgba(34,211,238,0.45)] transition"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function PartnersCarousel({ partners }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const len = partners.length;

  useEffect(() => {
    if (len < 2 || paused) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % len), 3200);
    return () => clearInterval(id);
  }, [len, paused]);

  const visible = [0, 1, 2].map((offset) => partners[(index + offset) % len]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Partner logos"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Previous partners"
          onClick={() => setIndex((i) => (i - 1 + len) % len)}
          className="flex-shrink-0 p-2 rounded-full border border-primary-400/40 text-primary-200 hover:shadow-[0_0_16px_rgba(34,211,238,0.45)] transition"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {visible.map((p, slot) => (
            <div
              key={`${p.name}-${index}-${slot}`}
              title={p.name}
              className={`partner-chip flex h-28 flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-2xl border border-primary-400/35 bg-white overflow-hidden transition-all duration-500 ${
                slot > 0 ? "hidden sm:flex" : "flex"
              }`}
            >
              <img
                src={`${p.logo}?v=9`}
                alt={p.shortName || p.name}
                className="h-[4.75rem] w-full object-contain"
              />
              <span className="text-xs sm:text-sm font-bold tracking-wide text-slate-900 text-center leading-tight">
                {p.shortName || p.name}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          aria-label="Next partners"
          onClick={() => setIndex((i) => (i + 1) % len)}
          className="flex-shrink-0 p-2 rounded-full border border-primary-400/40 text-primary-200 hover:shadow-[0_0_16px_rgba(34,211,238,0.45)] transition"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mt-5">
        {partners.map((p, i) => (
          <button
            key={p.name}
            type="button"
            aria-label={p.shortName || p.name}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-primary-300 shadow-[0_0_10px_rgba(34,211,238,0.9)]" : "w-2 bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/** Homepage — unique neon hero; other pages use their own PageHero photos. */
export default function Home() {
  const [slides, setSlides] = useState([]);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/hero")
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data?.slides) ? res.data.slides : [];
        setSlides(list.filter((s) => s?.image_url || s?.image));
      })
      .catch(() => {
        if (!cancelled) setSlides([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const mediaImages = useMemo(() => {
    if (slides.length) {
      return slides.map((s) => ({
        src: mediaUrl(s.image_url || s.image),
        alt: s.alt_text || s.alt || "Village NetAcad",
      }));
    }
    return homeHero.mediaImages;
  }, [slides]);

  const activeSlide = slides[slideIndex] || slides[0] || null;
  const eyebrow = (activeSlide?.label || "").trim() || "Village NetAcad";
  const headline = activeSlide
    ? [activeSlide.title, activeSlide.title_highlight].filter(Boolean).join(" ").trim() || homeHero.headline
    : homeHero.headline;
  const subtext = activeSlide
    ? (activeSlide.subtitle || activeSlide.body || "").trim() || homeHero.subtext
    : homeHero.subtext;
  const ctas = mapHeroButtons(activeSlide?.buttons);

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-primary-300/40">
        <div className="neon-grid neon-grid-vivid absolute inset-0 pointer-events-none" aria-hidden />
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-20 -left-24 w-[28rem] h-[28rem] rounded-full bg-burnt-400/55 blur-[80px] animate-pulse" />
          <div className="absolute top-0 right-0 w-[26rem] h-[26rem] rounded-full bg-sky-400/50 blur-[85px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[20rem] rounded-full bg-primary-400/40 blur-[100px]" />
          <div className="absolute -bottom-24 left-1/4 w-96 h-96 rounded-full bg-accent-400/45 blur-[90px]" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-fuchsia-500/20 blur-[80px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-burnt-500/25 via-transparent to-primary-500/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/50" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-6 lg:py-8">
          <div className="grid lg:grid-cols-2 gap-3 lg:gap-5 items-center">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-burnt-500/15 via-black/25 to-primary-500/20 p-4 sm:p-5 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
              <p className="inline-flex items-center rounded-full border border-burnt-300/50 bg-gradient-to-r from-burnt-500/25 to-primary-500/25 px-3 py-1 text-burnt-100 uppercase tracking-[0.28em] text-[10px] sm:text-xs font-semibold mb-2 shadow-[0_0_20px_rgba(74,222,128,0.35)]">
                {eyebrow}
              </p>
              <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl leading-snug drop-shadow-[0_0_24px_rgba(34,211,238,0.35)]">
                <span className="brand-text">{headline}</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-cyan-50/95 max-w-xl leading-snug">
                {subtext}
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {ctas.map((cta) => (
                  <NeonCta
                    key={`${cta.label}-${cta.to || cta.href}`}
                    to={cta.to}
                    href={cta.href}
                    variant={cta.variant}
                    openInNewTab={cta.openInNewTab}
                  >
                    {cta.label}
                  </NeonCta>
                ))}
              </div>
            </div>
            <div className="relative">
              <div
                className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-burnt-400 via-primary-400 to-accent-400 opacity-70 blur-lg pointer-events-none animate-pulse"
                aria-hidden
              />
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-burnt-400/80 via-primary-300/70 to-accent-300/80 pointer-events-none" aria-hidden />
              <div className="relative rounded-xl overflow-hidden">
                <HeroMediaLoop images={mediaImages} onIndexChange={setSlideIndex} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT METRICS */}
      <section id="impact" className="scroll-mt-24 border-b border-white/10 bg-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {homeImpactMetrics.map((m) => (
              <div key={m.label} className="neon-metric py-4">
                <p className="font-display font-bold text-3xl sm:text-4xl text-primary-300 drop-shadow-[0_0_18px_rgba(34,211,238,0.55)]">
                  {m.value}
                </p>
                <p className="mt-1 text-sm uppercase tracking-widest text-gray-400">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-24 section-padding border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl">
              How the Programme <span className="text-primary-300">Works</span>
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
              A simple path from first lesson to recognised skills.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {homeHowItWorks.map((item, i) => {
              const Icon = howIcons[i] || Briefcase;
              return (
                <div key={item.title} className="neon-frame rounded-2xl p-6 text-center bg-white/[0.03]">
                  <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center border border-primary-400/50 text-primary-300 shadow-[0_0_22px_rgba(34,211,238,0.35)] mb-4">
                    <Icon size={26} />
                  </div>
                  <h3 className="font-display font-bold text-xl text-white">{item.title}</h3>
                  <p className="text-primary-300 text-sm font-semibold mt-1">{item.subtitle}</p>
                  <p className="text-gray-400 text-sm mt-3 leading-relaxed">{item.body}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-10 flex justify-center">
            <NeonCta to="/how-it-works">See How It Works</NeonCta>
          </div>
        </div>
      </section>

      {/* COURSE CATALOGUE PREVIEW */}
      <section className="section-padding border-b border-white/10 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl">
              Course <span className="text-primary-300">Catalogue</span>
            </h2>
            <p className="mt-3 text-gray-400">Start with high-demand digital pathways.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {homeCoursePreview.map((course, i) => {
              const Icon = courseIcons[i] || BookOpen;
              return (
                <div key={course.title} className="neon-frame rounded-2xl p-5 flex flex-col bg-white/[0.03]">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-primary-400/45 text-primary-300 mb-4 shadow-[0_0_16px_rgba(34,211,238,0.3)]">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-bold text-lg">{course.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">Duration: {course.duration}</p>
                  <div className="mt-auto pt-5">
                    {course.enrollUrl ? (
                      <a
                        href={course.enrollUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-primary-300 hover:text-primary-200 underline-offset-4 hover:underline"
                      >
                        View Course
                      </a>
                    ) : (
                      <Link
                        to={course.to}
                        className="text-sm font-semibold text-primary-300 hover:text-primary-200 underline-offset-4 hover:underline"
                      >
                        View Course
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-10 flex justify-center">
            <NeonCta to="/courses">Explore All Courses</NeonCta>
          </div>
        </div>
      </section>

      {/* PRODUCT LINE SHOWCASE — placeholder images for now */}
      <section className="section-padding border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl">
              Product Line <span className="text-primary-300">Showcase</span>
            </h2>
            <p className="mt-3 text-gray-400">Gear and devices that support learning on the go.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {homeProductShowcase.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className="group neon-frame rounded-2xl overflow-hidden bg-white/[0.03] transition hover:-translate-y-1"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <div className="p-3 sm:p-4 text-center">
                  <h3 className="font-bold text-sm sm:text-base">{item.title}</h3>
                  <span className="inline-block mt-2 text-xs sm:text-sm font-semibold text-primary-300">
                    View Item
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <NeonCta to="/shop">Visit the Store</NeonCta>
          </div>
        </div>
      </section>

      {/* COMMUNITY STORIES */}
      <section className="section-padding border-b border-white/10 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display font-bold text-3xl md:text-4xl">
              Community <span className="text-primary-300">Stories</span>
            </h2>
          </div>
          <StoriesCarousel stories={homeStories} />
        </div>
      </section>

      {/* PARTNERS */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-10">
            Our <span className="text-primary-300">Partners</span>
          </h2>
          <PartnersCarousel partners={homePartners} />
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <NeonCta href={`mailto:${digititanLinks.email}?subject=Partnership%20enquiry`}>
              Become a Partner
            </NeonCta>
            <NeonCta to="/ambassadors" variant="outline">
              Become an Ambassador
            </NeonCta>
          </div>
        </div>
      </section>
    </div>
  );
}
