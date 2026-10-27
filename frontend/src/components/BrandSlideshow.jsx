import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const SPEED_PX_PER_SEC = 30;
const NUDGE_MS = 350;
const DRAG_THRESHOLD_PX = 6;

/** Auto-sliding row of round brand logos with arrows, pause/play and drag / swipe. */
export default function BrandSlideshow({ brands, activeBrand, onSelect, itemLabel }) {
  // The strip loops by half its width, so each half must be wider than the widest screen.
  const slides = useMemo(() => {
    if (!brands.length) return [];
    const repeats = Math.max(1, Math.ceil(16 / brands.length));
    const half = Array.from({ length: repeats }, () => brands).flat();
    return [...half, ...half];
  }, [brands]);

  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const nudgeRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);

  const halfWidth = () => (trackRef.current ? trackRef.current.scrollWidth / 2 : 0);
  const itemWidth = () => trackRef.current?.firstElementChild?.getBoundingClientRect().width || 96;

  const wrap = (value) => {
    const half = halfWidth();
    if (!half) return value;
    return ((value % half) + half) % half;
  };

  const paint = () => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    }
  };

  const autoRunning = playing && !hovering;
  const autoRef = useRef(autoRunning);
  autoRef.current = autoRunning;

  useEffect(() => {
    let frame;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const nudge = nudgeRef.current;
      if (nudge) {
        const t = Math.min(1, (now - nudge.start) / NUDGE_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        offsetRef.current = wrap(nudge.from + (nudge.to - nudge.from) * eased);
        if (t >= 1) nudgeRef.current = null;
      } else if (!dragRef.current && autoRef.current) {
        offsetRef.current = wrap(offsetRef.current + SPEED_PX_PER_SEC * dt);
      }
      paint();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [slides.length]);

  const step = (direction) => {
    const from = offsetRef.current;
    nudgeRef.current = { from, to: from + direction * itemWidth() * 2, start: performance.now() };
  };

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    nudgeRef.current = null;
    dragRef.current = { x: e.clientX, offset: offsetRef.current, moved: false, id: e.pointerId };
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > DRAG_THRESHOLD_PX) {
      drag.moved = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (drag.moved) {
      offsetRef.current = wrap(drag.offset - dx);
    }
  };

  const endDrag = (e) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    suppressClickRef.current = drag.moved;
    dragRef.current = null;
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === " " && e.target === e.currentTarget) {
      e.preventDefault();
      setPlaying((p) => !p);
    }
  };

  const controlClass =
    "flex items-center justify-center w-9 h-9 rounded-full border border-white/15 bg-white/5 text-gray-300 hover:border-burnt-400/60 hover:text-white transition shrink-0";

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => step(-1)} className={controlClass} aria-label="Previous brands">
        <ChevronLeft size={18} />
      </button>

      <div
        className="relative flex-1 min-w-0 overflow-hidden py-2 cursor-grab active:cursor-grabbing select-none touch-pan-y focus:outline-none focus-visible:ring-2 focus-visible:ring-burnt-400/50 rounded-xl"
        style={{
          maskImage: "linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)",
        }}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${itemLabel} brands. Use left and right arrow keys to move, space to pause.`}
        onKeyDown={onKeyDown}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHovering(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (suppressClickRef.current) {
            e.stopPropagation();
            e.preventDefault();
            suppressClickRef.current = false;
          }
        }}
      >
        <div ref={trackRef} className="flex w-max will-change-transform">
          {slides.map((b, i) => {
            const active = String(activeBrand || "").toLowerCase() === b.name.toLowerCase();
            const isCopy = i >= slides.length / 2;
            return (
              <button
                key={`${b.name}-${i}`}
                type="button"
                onClick={() => onSelect(b.name)}
                draggable={false}
                aria-hidden={isCopy || undefined}
                tabIndex={isCopy ? -1 : undefined}
                title={`${b.name} ${itemLabel} (${b.suppliers.join(" & ")})`}
                className="group flex flex-col items-center gap-1.5 shrink-0 w-20 sm:w-24"
              >
                <span
                  className={`flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 shadow-sm transition ${
                    b.dark ? "bg-gray-900" : "bg-white"
                  } ${
                    active
                      ? "border-burnt-400 ring-4 ring-burnt-400/30 scale-105"
                      : "border-white/20 group-hover:border-burnt-400/60 group-hover:scale-105"
                  }`}
                >
                  {b.logo ? (
                    <img
                      src={b.logo}
                      alt={b.name}
                      draggable={false}
                      className="w-3/5 h-3/5 object-contain pointer-events-none"
                    />
                  ) : (
                    <span className="text-sm font-black text-gray-800">{b.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </span>
                <span
                  className={`text-[11px] sm:text-xs font-semibold truncate max-w-full ${
                    active ? "text-burnt-300" : "text-gray-400 group-hover:text-gray-200"
                  }`}
                >
                  {b.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button type="button" onClick={() => step(1)} className={controlClass} aria-label="Next brands">
        <ChevronRight size={18} />
      </button>
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        className={controlClass}
        aria-label={playing ? "Pause brand slideshow" : "Play brand slideshow"}
        aria-pressed={!playing}
        title={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
    </div>
  );
}
