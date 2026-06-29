import { Link } from "react-router-dom";
import { Briefcase, GraduationCap, Users, Rocket, Mail, MapPin } from "lucide-react";
import { digititanContact, digititanLinks } from "../data/digititanAbout";
import { SITE_EMAIL } from "../lib/site";

const opportunities = [
  {
    title: "ICT Facilitator",
    type: "Part-time / Contract",
    location: "Gauteng & remote support",
    description: "Deliver networking, cybersecurity, and digital literacy sessions for youth and community learners.",
  },
  {
    title: "Programme Coordinator",
    type: "Full-time",
    location: "Pretoria",
    description: "Support academy registrations, partner onboarding, and rollout of Village NetAcad programmes.",
  },
  {
    title: "Community Ambassador",
    type: "Volunteer",
    location: "Nationwide",
    description: "Represent Village NetAcad in schools, hubs, and local events to grow digital skills access.",
  },
];

const benefits = [
  { icon: GraduationCap, title: "Grow Your Skills", desc: "Work with Cisco-aligned training pathways and real community impact." },
  { icon: Users, title: "Inclusive Team", desc: "Join a mission-driven network focused on South Africa's digital economy." },
  { icon: Rocket, title: "Career Pathways", desc: "Build experience in facilitation, programme delivery, and tech partnerships." },
];

export default function Career() {
  return (
    <div>
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 glass-section" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-burnt-600 uppercase tracking-[0.4em] text-xs font-semibold mb-4">Join Our Mission</p>
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">
            Careers
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Help us empower communities through digital skills training, innovation programmes, and inclusive growth.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {benefits.map((item, i) => (
              <div key={i} className="card text-center hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(14,165,233,0.18)]">
                <div className="w-14 h-14 rounded-2xl bg-burnt-800/30 flex items-center justify-center mx-auto mb-5">
                  <item.icon size={28} className="text-burnt-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-center mb-10 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">
            Open Opportunities
          </h2>
          <div className="space-y-6">
            {opportunities.map((role, i) => (
              <div key={i} className="card hover:border-burnt-500/35 transition-all">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-burnt-400 to-burnt-700 flex items-center justify-center flex-shrink-0">
                      <Briefcase size={22} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{role.title}</h3>
                      <p className="text-sm text-burnt-600 font-semibold mb-2">{role.type}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                        <MapPin size={14} /> {role.location}
                      </p>
                      <p className="text-gray-400 leading-relaxed">{role.description}</p>
                    </div>
                  </div>
                  <Link to="/contact" className="btn-primary text-sm whitespace-nowrap self-start md:self-center">
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding border-t border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black mb-4">Don&apos;t see your role?</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Send your CV and a short motivation to our team. We welcome facilitators, partners, and volunteers who share our vision for a digitally empowered South Africa.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`mailto:${SITE_EMAIL}?subject=Career%20Enquiry`} className="btn-primary inline-flex items-center gap-2">
              <Mail size={18} /> Email {SITE_EMAIL}
            </a>
            <Link to="/contact" className="btn-secondary">Contact Us</Link>
          </div>
          <p className="text-sm text-gray-500 mt-6">{digititanContact.location}</p>
          <a
            href={digititanLinks.maps}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-burnt-600 hover:underline mt-2 inline-block"
          >
            View on Google Maps
          </a>
        </div>
      </section>
    </div>
  );
}
