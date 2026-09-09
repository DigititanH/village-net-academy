import { Link } from "react-router-dom";
import { GraduationCap, Heart, MapPin, Target, Users } from "lucide-react";
import PageHero from "../components/PageHero";
import { pageHeroImages } from "../data/pageHeroImages";

/** Fill in each person’s name and position below */
const teamMembers = [
  { name: "Dennis Memela", position: "Managing Director", image: "/IMG_7485.jpg" },
  { name: "Cincinnatia Rathete", position: "Projects & Training Manager", image: "/IMG_7506.jpg" },
  { name: "Ditebogo Monareng", position: "Information Technology (IT) Manager", image: "/IMG_7517.jpg" },
  { name: "Gofaone Grand", position: "Marketing & Strategic Partnerships Manager", image: "/IMG_7556.jpg" },
  { name: "Nelisiwe Msiza", position: "Quality Manager", image: "/IMG_7550.jpg" },
];

export default function About() {
  return (
    <div>
      <PageHero
        image={pageHeroImages.about}
        alt="Village NetAcad community and digital skills"
        eyebrow="Village Netacad powered by Digititan"
        title="Bringing Technology Skills Closer to Home."
        titleBrand
      />

      <section className="section-padding">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="space-y-6 order-2 lg:order-1">
              <p className="text-gray-300 text-lg leading-relaxed">
                <span className="text-burnt-400 font-semibold">Village NetAcad</span> was started to solve a simple
                problem: young people in rural areas have the talent, but not always the opportunity.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Many young people have to travel far to access quality ICT training. Village NetAcad brings the{" "}
                <span className="text-burnt-400 font-semibold">training closer to them</span>.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Village NetAcad is a <span className="text-burnt-400 font-semibold">Cisco Networking Academy</span>{" "}
                partner. The programme teaches the same curriculum taught in cities and top companies, delivered in
                villages in a way that is accessible, practical and relevant.
              </p>
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-burnt-500/25 via-primary-500/15 to-accent-400/20 blur-2xl opacity-80 pointer-events-none" />
              <figure className="relative overflow-hidden rounded-[1.75rem] border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)]">
                <img
                  src="/WhatsApp Image 2026-08-14 at 14.40.11 (1).jpeg"
                  alt="Young people learning digital skills in a rural community"
                  className="w-full h-full object-cover aspect-[4/3]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <figcaption className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <p className="text-sm sm:text-base font-semibold text-white drop-shadow">
                    Talent is everywhere. Opportunity should be too.
                  </p>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
          <div className="card p-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-burnt-400 to-primary-400 flex items-center justify-center mb-5">
              <Target size={22} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-burnt-400 mb-3">Mission</h2>
            <p className="text-gray-400 leading-relaxed">
              To close the <span className="text-burnt-400 font-medium">digital divide</span> by equipping rural
              youth with skills for jobs, entrepreneurship and further study.
            </p>
          </div>

          <div className="card p-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-burnt-400 to-primary-400 flex items-center justify-center mb-5">
              <MapPin size={22} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-burnt-400 mb-3">Vision</h2>
            <p className="text-gray-400 leading-relaxed">
              A South Africa where <span className="text-burnt-400 font-medium">location does not limit</span>{" "}
              learning.
            </p>
          </div>

          <div className="card p-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-burnt-400 to-primary-400 flex items-center justify-center mb-5">
              <Heart size={22} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-burnt-400 mb-3">Why It Matters</h2>
            <p className="text-gray-400 leading-relaxed">
              When a young person gains a skill in their village, the{" "}
              <span className="text-burnt-400 font-medium">whole village grows</span>.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-burnt-400 to-primary-400 flex items-center justify-center mx-auto mb-4">
              <Users size={22} className="text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent mb-3">
              Meet the Team
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Village NetAcad is led by trainers, mentors and community builders. Many team members come from the same communities served by the programme, bringing lived experience, local understanding and practical support.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {teamMembers.map((member, i) => (
              <div key={i} className="card p-4 text-center flex flex-col items-center">
                <div className="w-full aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 overflow-hidden">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name || "Team member"}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <Users size={64} className="text-burnt-600/70" />
                  )}
                </div>
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Name</p>
                <p className={`font-bold text-lg mb-3 min-h-[1.75rem] ${member.name ? "text-white" : "text-gray-600 italic font-normal"}`}>
                  {member.name || "Add name here"}
                </p>
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Position</p>
                <p className={`text-sm min-h-[1.25rem] ${member.position ? "text-burnt-600" : "text-gray-600 italic"}`}>
                  {member.position || "Add position here"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding border-t border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 mb-6">Ready to start your learning journey?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/courses" className="btn-primary inline-flex items-center gap-2">
              <GraduationCap size={18} /> Explore Courses
            </Link>
            <Link to="/contact" className="btn-outline inline-block">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
