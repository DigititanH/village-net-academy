import { BookOpen, Briefcase, GraduationCap, Laptop } from "lucide-react";
import PageHero from "../components/PageHero";
import { pageHeroImages } from "../data/pageHeroImages";
import { homeHowItWorks } from "../data/homePage";

const howIcons = [BookOpen, Laptop, GraduationCap];

export default function HowItWorks() {
  return (
    <div>
      <PageHero
        image={pageHeroImages.howItWorks}
        alt="How the Village NetAcad programme works"
        title="How It Works"
        subtitle="A simple path from first lesson to recognised skills."
      />

      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {homeHowItWorks.map((item, i) => {
              const Icon = howIcons[i] || Briefcase;
              return (
                <div key={item.title} className="neon-frame rounded-2xl p-6 text-center bg-white/[0.03]">
                  <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center border border-primary-400/50 text-primary-300 shadow-[0_0_22px_rgba(34,211,238,0.35)] mb-4">
                    <Icon size={26} />
                  </div>
                  <h2 className="font-display font-bold text-xl text-white">{item.title}</h2>
                  <p className="text-primary-300 text-sm font-semibold mt-1">{item.subtitle}</p>
                  <p className="text-gray-400 text-sm mt-3 leading-relaxed">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
