import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const INTERVAL_MS = 5000;

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

  if (count === 0) return null;

  return (
    <section
      className="relative w-full h-[min(65vh,720px)] min-h-[320px] overflow-hidden glass-clear"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Homepage banner"
    >
      {slides.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === active ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          aria-hidden={i !== active}
        >
          <img
            src={s.image}
            alt={s.alt || ""}
            className="absolute inset-0 w-full h-full object-cover scale-110 -translate-y-[6%]"
            style={{ objectPosition: s.objectPosition || "center top" }}
          />
        </div>
      ))}

      {/* Subtle bottom fade so dots stay visible — not a text overlay */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 to-transparent z-20 pointer-events-none" />

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full glass border border-white/20 hover:bg-white/10 transition"
            aria-label="Previous slide"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full glass border border-white/20 hover:bg-white/10 transition"
            aria-label="Next slide"
          >
            <ChevronRight size={22} />
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === active ? "w-8 bg-burnt-500" : "w-2 bg-white/50 hover:bg-burnt-400/80"
                }`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
