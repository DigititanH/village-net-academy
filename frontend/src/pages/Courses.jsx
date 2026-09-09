import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  GraduationCap,
  LockOpen,
  Mail,
  Users,
} from "lucide-react";
import {
  academyBenefits,
  academyCourses,
  academyHero,
  academyMission,
  academyLinks,
  courseCategories,
  enrollmentHighlights,
  enrollmentSteps,
  getCourseImage,
  isCcnaCourse,
} from "../data/academyCourses";
import PageHero from "../components/PageHero";
import { pageHeroImages } from "../data/pageHeroImages";

const benefitIcons = [GraduationCap, LockOpen, BookOpen, Users];

function CourseCover({ course }) {
  const [failed, setFailed] = useState(false);
  const src = getCourseImage(course);

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-sky-950">
      {!failed ? (
        <img
          src={src}
          alt={course.title}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 via-sky-950 to-slate-900">
          <BookOpen size={40} className="text-burnt-500/70" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white">
        <span className="inline-flex items-center gap-1">
          <Clock size={12} /> {course.hours} Hours
        </span>
        <span className="inline-flex items-center gap-1">
          <LockOpen size={12} /> {course.price}
        </span>
        <span>{course.level}</span>
      </div>
    </div>
  );
}

export default function Courses() {
  const [searchParams] = useSearchParams();
  const track = (searchParams.get("track") || "").toLowerCase();
  const [activeCategory, setActiveCategory] = useState("All Courses");

  useEffect(() => {
    setActiveCategory("All Courses");
  }, [track]);

  const trackCourses = useMemo(() => {
    if (track === "ccna") return academyCourses.filter((c) => isCcnaCourse(c.title));
    if (track === "free") return academyCourses.filter((c) => !isCcnaCourse(c.title));
    return academyCourses;
  }, [track]);

  const filteredCourses = useMemo(() => {
    if (activeCategory === "All Courses") return trackCourses;
    return trackCourses.filter((course) => course.category === activeCategory);
  }, [activeCategory, trackCourses]);

  const visibleCategories = useMemo(() => {
    if (track === "ccna") return ["All Courses"];
    const cats = new Set(trackCourses.map((c) => c.category));
    return courseCategories.filter((c) => c === "All Courses" || cats.has(c));
  }, [track, trackCourses]);

  const heroTitle =
    track === "ccna" ? "CCNA Paid Course" : track === "free" ? "Free Courses" : academyHero.title;
  const ctaLabel = track === "ccna" ? "View CCNA Paid Courses" : "Browse Free Courses";

  return (
    <div>
      <PageHero
        image={pageHeroImages.courses}
        alt="Learners building digital skills through Village NetAcad"
        eyebrow="Village Netacad · Cisco Networking Academy"
        title={heroTitle}
        titleBrand
        subtitle={
          track === "ccna" ? (
            "This is a paid CCNA programme. Subscribe through Village NetAcad and prepare for industry certification."
          ) : track === "free" ? (
            "Browse free, self-paced Cisco Networking Academy courses you can start today."
          ) : (
            <>
              Build <span className="text-burnt-300 font-semibold">practical digital skills</span> with free Cisco
              Networking Academy courses — from networking fundamentals to cybersecurity and beyond.
            </>
          )
        }
      >
        <a href="#courses" className="btn-primary inline-flex items-center gap-2">
          <GraduationCap size={18} /> {ctaLabel}
        </a>
      </PageHero>

      <section id="courses" className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-burnt-600 uppercase tracking-[0.35em] text-xs font-semibold mb-3">
              {track === "ccna"
                ? "CCNA Paid Course"
                : track === "free"
                  ? "Free Self-Paced Courses"
                  : academyHero.catalogLabel}
            </p>
            <h2 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
              {track === "ccna"
                ? "CCNA Paid Courses"
                : track === "free"
                  ? "Free Course Catalog"
                  : academyHero.catalogTitle}
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {track === "ccna"
                ? "Paid monthly subscription access to CCNA 1, 2 and 3 through Village NetAcad."
                : track === "free"
                  ? "Free Skills for All courses on Cisco Networking Academy — start anytime."
                  : academyHero.catalogDescription}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <Link
                to="/courses?track=ccna"
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                  track === "ccna"
                    ? "bg-burnt-600 border-burnt-500 text-white"
                    : "bg-white/10 border-white/20 text-gray-200 hover:bg-white/20"
                }`}
              >
                CCNA Paid Course
              </Link>
              <Link
                to="/courses?track=free"
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                  track === "free"
                    ? "bg-burnt-600 border-burnt-500 text-white"
                    : "bg-white/10 border-white/20 text-gray-200 hover:bg-white/20"
                }`}
              >
                Free Courses
              </Link>
              <Link
                to="/courses"
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                  !track
                    ? "bg-burnt-600 border-burnt-500 text-white"
                    : "bg-white/10 border-white/20 text-gray-200 hover:bg-white/20"
                }`}
              >
                All
              </Link>
            </div>
          </div>

          {visibleCategories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {visibleCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2.5 rounded-full text-sm font-semibold border transition-all ${
                    activeCategory === category
                      ? "bg-burnt-600 border-burnt-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.35)]"
                      : "bg-white/10 border-white/20 text-gray-200 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.title}
                className="group card overflow-hidden hover:-translate-y-2 hover:border-burnt-500/35 transition-all p-0"
              >
                <CourseCover course={course} />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-burnt-600 mb-1">
                    {course.category}
                  </p>
                  <h3 className="text-lg font-bold mb-2 leading-snug">{course.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">{course.description}</p>
                  {isCcnaCourse(course.title) ? (
                    <Link
                      to={`/courses/enrol?course=${encodeURIComponent(course.title)}`}
                      className="btn-primary text-sm w-full text-center inline-flex items-center justify-center gap-2"
                    >
                      Enrol Now <GraduationCap size={14} />
                    </Link>
                  ) : (
                    <a
                      href={course.enrollUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-sm w-full text-center inline-flex items-center justify-center gap-2"
                    >
                      Enrol Now <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          {!filteredCourses.length && (
            <p className="text-center text-gray-500 mt-8">No courses found for this selection.</p>
          )}
        </div>
      </section>

      <section className="section-padding border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black mb-6 bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
            The Purpose of <span className="text-burnt-300">Village NetAcad</span>
          </h2>
          <p className="text-gray-400 leading-relaxed text-lg">
            Village NetAcad exists to open <span className="text-burnt-400 font-medium">digital opportunity</span>{" "}
            for communities across South Africa. Powered by Digititan, we deliver practical pathways in networking,
            cybersecurity, digital literacy, and related ICT skills — so learners can build confidence with
            technology, earn <span className="text-burnt-400 font-medium">recognised credentials</span>, and move
            into work, entrepreneurship, or further study in the digital economy.
          </p>
        </div>
      </section>

      <section className="section-padding border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-center mb-10 bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
            Why Choose Village Netacad Academy
          </h2>
          <p className="text-center text-gray-400 mb-10 -mt-6">
            Skills that set you up to work and learn anywhere.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {academyBenefits.map((item, i) => {
              const Icon = benefitIcons[i];
              return (
                <div key={item.title} className="card text-center hover:-translate-y-2 transition-transform">
                  <div className="w-14 h-14 rounded-2xl bg-burnt-800/30 flex items-center justify-center mx-auto mb-5">
                    <Icon size={28} className="text-burnt-600" />
                  </div>
                  <h3 className="font-bold text-burnt-600 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3 bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
              How to Enroll
            </h2>
            <p className="text-gray-400">A simple 4-step process to start learning today.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {enrollmentSteps.map((item) => (
              <div key={item.step} className="card text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-burnt-400 to-primary-400 flex items-center justify-center mx-auto mb-4 text-white font-black">
                  {item.step}
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {enrollmentHighlights.map((item) => (
              <div key={item.title} className="card flex items-start gap-4">
                <Calendar size={22} className="text-burnt-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding border-t border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <BookOpen size={40} className="text-burnt-600 mx-auto mb-5" />
          <h2 className="text-3xl font-black mb-4">Join Village Netacad Cisco Networking Academy</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Create your free Cisco Networking Academy account and begin developing digital skills that
            can help you succeed in work, education, and everyday life. For CCNA programmes, use our
            registration form for payment guidance.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={academyLinks.netacadDashboard}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2"
            >
              Create Account <ExternalLink size={16} />
            </a>
            <Link to="/courses/enrol" className="btn-secondary inline-flex items-center gap-2">
              CCNA Paid Course Registration <GraduationCap size={16} />
            </Link>
            <a
              href={`mailto:${academyLinks.email}`}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Mail size={18} /> Email Us
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-8">
            In partnership with Cisco Networking Academy & Digititan Holdings
          </p>
          <p className="text-sm text-gray-500 mt-2">
            © Village Netacad powered by Digititan
          </p>
        </div>
      </section>
    </div>
  );
}
