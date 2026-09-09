/**
 * Full-bleed page header with a complementary background photo.
 */
export default function PageHero({
  image,
  alt = "",
  eyebrow,
  title,
  subtitle,
  children,
  compact = false,
  titleBrand = false,
}) {
  return (
    <section
      className={`relative overflow-hidden flex items-center ${
        compact ? "min-h-[220px] md:min-h-[260px] py-10" : "min-h-[320px] md:min-h-[420px] py-16 md:py-20"
      }`}
    >
      <img
        src={image}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="eager"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/75" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-r from-burnt-950/25 via-transparent to-primary-950/20" aria-hidden />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {eyebrow && (
          <p className="text-burnt-300 uppercase tracking-[0.35em] text-xs font-semibold mb-4 drop-shadow">
            {eyebrow}
          </p>
        )}
        <h1
          className={`${
            compact ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl lg:text-6xl"
          } font-display font-bold leading-tight drop-shadow-lg ${
            titleBrand
              ? "brand-text"
              : "bg-gradient-to-r from-burnt-300 via-primary-300 to-sky-300 bg-clip-text text-transparent"
          }`}
        >
          {title}
        </h1>
        {subtitle && (
          <div className="mt-5 text-base md:text-lg text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow">
            {subtitle}
          </div>
        )}
        {children && <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>}
      </div>
    </section>
  );
}
