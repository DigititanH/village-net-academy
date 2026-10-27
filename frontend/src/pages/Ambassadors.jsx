import { Link } from "react-router-dom";
import { Award, Handshake, Megaphone, Network, Users } from "lucide-react";
import {
  ambassadorBenefits,
  ambassadorHero,
  ambassadorSteps,
  ambassadorWho,
} from "../data/ambassadors";
import { digititanLinks } from "../data/digititanAbout";
import PageHero from "../components/PageHero";
import { pageHeroImages } from "../data/pageHeroImages";

const benefitIcons = [Megaphone, Award, Network, Handshake];

function NeonCta({ to, href, children, variant = "solid" }) {
  const className =
    variant === "solid"
      ? "neon-btn inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm sm:text-base"
      : "neon-btn-outline inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm sm:text-base";
  if (href) {
    return (
      <a
        href={href}
        className={className}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel="noopener noreferrer"
      >
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

export default function Ambassadors() {
  return (
    <div>
      <PageHero
        image={pageHeroImages.ambassadors}
        alt="Village NetAcad Ambassadors"
        title={ambassadorHero.headline}
        subtitle={ambassadorHero.subtext}
      >
        <Link to={ambassadorHero.primaryCta.to} className="neon-btn inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm">
          {ambassadorHero.primaryCta.label}
        </Link>
        <a href="#who" className="neon-btn-outline inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm">
          {ambassadorHero.secondaryCta.label}
        </a>
      </PageHero>

      <section id="who" className="scroll-mt-24 section-padding border-b border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center border border-primary-400/50 text-primary-300 shadow-[0_0_22px_rgba(34,211,238,0.35)] mb-5">
            <Users size={26} />
          </div>
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">{ambassadorWho.title}</h2>
          <p className="text-gray-300 leading-relaxed text-base md:text-lg">{ambassadorWho.body}</p>
        </div>
      </section>

      <section className="section-padding border-b border-white/10 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-12">
            Ambassador <span className="text-primary-300">Benefits</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {ambassadorBenefits.map((b, i) => {
              const Icon = benefitIcons[i] || Award;
              return (
                <div key={b.title} className="neon-frame rounded-2xl p-6 bg-white/[0.03] flex gap-4">
                  <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center border border-primary-400/45 text-primary-300 shadow-[0_0_16px_rgba(34,211,238,0.3)]">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{b.title}</h3>
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed">{b.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-padding border-b border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-12">
            How to Become an <span className="text-primary-300">Ambassador</span>
          </h2>
          <ol className="space-y-4">
            {ambassadorSteps.map((s) => (
              <li key={s.step} className="neon-frame rounded-2xl px-5 py-4 flex items-center gap-4 bg-white/[0.03]">
                <span className="font-display font-bold text-primary-300 text-xl w-10 text-center drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]">
                  {s.step}
                </span>
                <span className="font-semibold text-white">
                  Step {s.step} — {s.title}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex justify-center">
            <NeonCta to="/contact">Apply Now</NeonCta>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-3xl mx-auto text-center neon-frame rounded-3xl p-8 sm:p-12 bg-white/[0.03]">
          <h2 className="font-display font-bold text-2xl sm:text-3xl mb-6">Ready to lead?</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <NeonCta to="/contact">Become an Ambassador</NeonCta>
            <NeonCta href={`mailto:${digititanLinks.email}?subject=Partnership%20enquiry`} variant="outline">
              Partner With Us
            </NeonCta>
          </div>
        </div>
      </section>
    </div>
  );
}
