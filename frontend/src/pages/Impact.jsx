import PageHero from "../components/PageHero";
import { pageHeroImages } from "../data/pageHeroImages";
import { homeImpactMetrics } from "../data/homePage";

export default function Impact() {
  return (
    <div>
      <PageHero
        image={pageHeroImages.impact}
        alt="Village NetAcad impact across communities"
        title="Our Impact"
        subtitle="Digital skills delivered where learning happens — for youth across Africa."
      />

      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {homeImpactMetrics.map((m) => (
              <div key={m.label} className="neon-metric neon-frame rounded-2xl py-8 px-4 bg-white/[0.03]">
                <p className="font-display font-bold text-3xl sm:text-4xl text-primary-300 drop-shadow-[0_0_18px_rgba(34,211,238,0.55)]">
                  {m.value}
                </p>
                <p className="mt-2 text-sm uppercase tracking-widest text-gray-400">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
