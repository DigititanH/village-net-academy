import { Link } from "react-router-dom";
import { GraduationCap, Network, Shield, Code, ExternalLink } from "lucide-react";
import { digititanPillars, digititanRegistration } from "../data/digititanAbout";

const courseIcons = [GraduationCap, Network, Shield, Code];

const courses = [
  {
    title: "Networking Essentials",
    desc: "Foundations of computer networks, routing, switching, and connectivity for beginners and career starters.",
    level: "Beginner",
  },
  {
    title: "ICT Fundamentals",
    desc: "Core digital literacy, hardware, software, and troubleshooting skills for the modern workplace.",
    level: "Beginner",
  },
  {
    title: "Cybersecurity Basics",
    desc: "Protect systems and data with practical security awareness and safe online practices.",
    level: "Intermediate",
  },
  {
    title: "Career Readiness",
    desc: "Employability skills, certifications pathways, and job preparation for ICT roles.",
    level: "All levels",
  },
];

export default function Courses() {
  return (
    <div>
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 glass-section" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-burnt-600 uppercase tracking-[0.4em] text-xs font-semibold mb-4">Village Netacad powered by Digititan</p>
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">
            Our Courses
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Practical digital skills programmes in networking, ICT, and employability — designed for youth, educators, and communities across South Africa.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {courses.map((course, i) => {
              const Icon = courseIcons[i % courseIcons.length];
              return (
                <div key={course.title} className="card hover:-translate-y-2 transition-transform">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-burnt-800/30 flex items-center justify-center flex-shrink-0">
                      <Icon size={24} className="text-burnt-600" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-burnt-600">{course.level}</span>
                      <h2 className="text-xl font-bold mt-1 mb-2">{course.title}</h2>
                      <p className="text-gray-400 leading-relaxed">{course.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-padding border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-center mb-10 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">
            Programme Pillars
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {digititanPillars.map((p) => (
              <div key={p.title} className="card text-center">
                <h3 className="font-bold text-burnt-600 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-xl font-bold mb-3">{digititanRegistration.academy.title}</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">{digititanRegistration.academy.description}</p>
              <a
                href={digititanRegistration.academy.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2"
              >
                {digititanRegistration.academy.cta} <ExternalLink size={16} />
              </a>
            </div>
            <div className="card">
              <h3 className="text-xl font-bold mb-3">{digititanRegistration.asc.title}</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">{digititanRegistration.asc.description}</p>
              <a
                href={digititanRegistration.asc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline inline-flex items-center gap-2"
              >
                {digititanRegistration.asc.cta} <ExternalLink size={16} />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-12">
            <Link to="/register" className="btn-primary">Register on Village NetAcad</Link>
            <Link to="/contact" className="btn-secondary">Ask About Courses</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
