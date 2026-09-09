import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const INTERVAL_MS = 5000;

function buttonClass(style) {
  if (style === "outline-primary") {
    return "border border-primary-400/50 text-primary-200 px-5 sm:px-8 py-2.5 sm:py-3.5 text-sm sm:text-base rounded-full font-semibold hover:bg-primary-500/15 transition bg-black/25 backdrop-blur-sm";
  }
  if (style === "outline-accent") {
    return "border border-accent-400/45 text-accent-200 px-5 sm:px-8 py-2.5 sm:py-3.5 text-sm sm:text-base rounded-full font-semibold hover:bg-accent-500/15 transition bg-black/25 backdrop-blur-sm";
  }
  return "btn-primary inline-flex items-center gap-2 rounded-full px-5 sm:px-8 py-2.5 sm:py-3.5 text-sm sm:text-base";
}

function isExternalUrl(url) {
  return /^https?:\/\//i.test(url) || url.startsWith("//") || url.startsWith("mailto:") || url.startsWith("tel:");
}

function SlideButton({ button }) {
  const className = buttonClass(button.style);
  const url = button.url || "/";
  const label = (
    <>
      {button.style === "primary" && <Zap size={18} />}
      {button.label}
    </>
  );

  if (isExternalUrl(url) || button.open_in_new_tab) {
    return (
      <a
        href={url}
        className={className}
        target={button.open_in_new_tab || isExternalUrl(url) ? "_blank" : undefined}
        rel={button.open_in_new_tab || isExternalUrl(url) ? "noopener noreferrer" : undefined}
      >
        {label}
      </a>
    );
  }

  return (
    <Link to={url.startsWith("/") ? url : `/${url}`} className={className}>
      {label}
    </Link>
  );
}

function textAlignClass(position) {
  if (position?.includes("left")) return "text-left";
  if (position?.includes("right")) return "text-right";
  return "text-center";
}

function contentJustifyClass(position) {
  if (position?.includes("left")) return "mr-auto";
  if (position?.includes("right")) return "ml-auto";
  return "mx-auto";
}

function overlayPlacementClass(position) {
  const map = {
    center: "items-center justify-center",
    left: "items-center justify-start",
    right: "items-center justify-end",
    top: "items-start justify-center",
    bottom: "items-end justify-center",
    "top-left": "items-start justify-start",
    "top-right": "items-start justify-end",
    "bottom-left": "items-end justify-start",
    "bottom-right": "items-end justify-end",
  };
  return map[position] || map.center;
}

function SlideOverlay({ slide }) {
  if (!slide) return null;
  const buttons = (slide.buttons || []).filter((b) => b.label && b.url);
  const position = slide.text_position || slide.textPosition || "center";
  const align = textAlignClass(position);
  const justify = contentJustifyClass(position);
  const buttonsJustify =
    position.includes("left") ? "justify-start" : position.includes("right") ? "justify-end" : "justify-center";

  const labelColor = slide.label_color || "#FDE68A";
  const titleColor = slide.title_color || "#FFFFFF";
  const highlightColor = slide.title_highlight_color || "";
  const subtitleColor = slide.subtitle_color || "#F5F5F5";
  const bodyColor = slide.body_color || "#E5E5E5";

  return (
    <div
      key={slide.id ?? slide.image}
      className={`w-full max-w-4xl min-w-0 animate-[fadeIn_0.45s_ease] ${align} ${justify}`}
    >
      {slide.label && (
        <p
          className={`inline-flex max-w-full items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-5 text-xs sm:text-sm font-semibold border border-white/25 bg-black/35 backdrop-blur-sm ${
            position.includes("left") ? "" : position.includes("right") ? "ml-auto" : ""
          }`}
          style={{ color: labelColor }}
        >
          <Sparkles size={14} className="text-accent-400 shrink-0" />
          <span className="min-w-0 break-words">{slide.label}</span>
        </p>
      )}

      {(slide.title || slide.titleHighlight || slide.title_highlight) && (
        <h1
          className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-display font-bold leading-tight drop-shadow-lg break-words"
          style={{ color: titleColor }}
        >
          {slide.title}{" "}
          {(slide.titleHighlight || slide.title_highlight) && (
            <span
              className={highlightColor ? "" : "brand-text"}
              style={highlightColor ? { color: highlightColor } : undefined}
            >
              {slide.titleHighlight || slide.title_highlight}
            </span>
          )}
        </h1>
      )}

      {slide.subtitle && (
        <p
          className={`mt-3 sm:mt-5 text-sm sm:text-lg leading-relaxed max-w-2xl drop-shadow break-words ${justify}`}
          style={{ color: subtitleColor }}
        >
          {slide.subtitle}
        </p>
      )}

      {slide.body && (
        <p
          className={`mt-3 sm:mt-4 text-xs sm:text-base leading-relaxed max-w-3xl break-words ${justify}`}
          style={{ color: bodyColor }}
        >
          {slide.body}
        </p>
      )}

      {buttons.length > 0 && (
        <div className={`flex flex-wrap gap-2 sm:gap-4 mt-5 sm:mt-8 ${buttonsJustify}`}>
          {buttons.map((btn) => (
            <SlideButton key={btn.id || `${btn.label}-${btn.url}`} button={btn} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HeroSlideshow({ slides }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const goTo = useCallback(
    (index) => {
      if (count === 0) return;
      setActive(((index % count) + count) % count);
    },
    [count]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setInterval(next, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused, count, next, active]);

  useEffect(() => {
    if (active >= count && count > 0) setActive(0);
  }, [count, active]);

  if (count === 0) return null;

  const current = slides[active] || slides[0];

  return (
    <section
      className="relative w-full overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Homepage banner"
    >
      <div className="relative w-full h-[70vh] sm:h-[80vh] lg:h-[90vh] min-h-[280px] max-h-[900px]">
        {slides.map((s, i) => {
          const isActive = i === active;
          return (
            <div
              key={s.id ?? s.image}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
              }`}
              aria-hidden={!isActive}
            >
              <img
                src={s.image}
                alt={s.alt || s.title || ""}
                className="block h-full w-full object-cover object-center"
                draggable={false}
              />
            </div>
          );
        })}

        <div className={`absolute inset-0 z-30 flex px-4 sm:px-10 lg:px-12 py-12 sm:py-16 lg:py-20 ${overlayPlacementClass(current.text_position || current.textPosition || "center")}`}>
          <SlideOverlay slide={current} />
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 sm:left-6 bottom-16 sm:bottom-auto sm:top-1/2 z-40 sm:-translate-y-1/2 rounded-full border border-white/20 p-2 sm:p-2.5 glass transition hover:bg-white/10"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 sm:right-6 bottom-16 sm:bottom-auto sm:top-1/2 z-40 sm:-translate-y-1/2 rounded-full border border-white/20 p-2 sm:p-2.5 glass transition hover:bg-white/10"
              aria-label="Next slide"
            >
              <ChevronRight size={20} />
            </button>

            <div className="absolute bottom-4 sm:bottom-5 left-1/2 z-40 flex -translate-x-1/2 gap-2">
              {slides.map((_, dot) => (
                <button
                  key={dot}
                  type="button"
                  onClick={() => goTo(dot)}
                  className={`h-2 rounded-full transition-all ${
                    dot === active ? "w-8 bg-burnt-500" : "w-2 bg-white/50 hover:bg-burnt-400/80"
                  }`}
                  aria-label={`Go to slide ${dot + 1}`}
                  aria-current={dot === active}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
