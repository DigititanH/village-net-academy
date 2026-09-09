import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Headphones,
  Layers,
  MonitorPlay,
  Sparkles,
  Target,
} from "lucide-react";
import { academyCourses, isCcnaCourse } from "../data/academyCourses";
import { courseDetailsBySlug, courseSlug } from "../data/courseDetails";
import { pageHeroImages } from "../data/pageHeroImages";

const includesIcons = [GraduationCap, MonitorPlay, BookOpen, Award];

export default function CourseDetail() {
  const { slug } = useParams();
  const course = academyCourses.find((c) => courseSlug(c.title) === slug);
  const details = courseDetailsBySlug[slug];

  if (!course) {
    return (
      <div className="section-padding text-center">
        <p className="text-gray-400 text-lg mb-6">Course not found.</p>
        <Link to="/courses" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft size={18} /> Back to Courses
        </Link>
      </div>
    );
  }

  const hasExtendedDetails = Boolean(details);
  const enrollUrl = details?.enrollUrl || course.enrollUrl;
  const enrolPath = `/courses/enrol?course=${encodeURIComponent(course.title)}`;
  const enrollClassName = "btn-primary inline-flex items-center justify-center gap-2 text-base px-8";
  const useCcnaEnrol = isCcnaCourse(course.title);

  const EnrollButton = ({ className = enrollClassName }) =>
    useCcnaEnrol ? (
      <Link to={enrolPath} className={className}>
        Enrol Now
      </Link>
    ) : enrollUrl ? (
      <a href={enrollUrl} target="_blank" rel="noopener noreferrer" className={className}>
        Enrol Now
      </a>
    ) : (
      <Link to="/register" className={className}>
        Enrol Now
      </Link>
    );

  return (
    <div>
      {/* Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <img
          src={pageHeroImages.courseDetail}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-br from-burnt-600/15 via-transparent to-sky-500/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-burnt-400 transition-colors mb-8"
          >
            <ArrowLeft size={16} /> Back to Courses
          </Link>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <span className="text-5xl mb-4 block" aria-hidden="true">
                {details?.emoji ?? "📚"}
              </span>
              <p className="text-burnt-600 uppercase tracking-[0.35em] text-xs font-semibold mb-3">
                {course.category}
              </p>
              <h1 className="text-4xl md:text-5xl font-black mb-5 bg-gradient-to-r from-burnt-300 to-burnt-600 bg-clip-text text-transparent leading-tight">
                {course.title}
              </h1>
              <p className="text-lg text-gray-300 leading-relaxed mb-8">{course.description}</p>

              <div className="flex flex-wrap gap-3 mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-gray-200">
                  <Clock size={16} className="text-burnt-500" /> {course.hours} hours
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-gray-200">
                  <Layers size={16} className="text-burnt-500" /> {course.level}
                </span>
                {details?.pace && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-gray-200">
                    <Headphones size={16} className="text-burnt-500" /> {details.pace}
                  </span>
                )}
                {details?.price && (
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                      details.price === "Free"
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                        : "bg-burnt-600/20 border border-burnt-500/40 text-burnt-300"
                    }`}
                  >
                    <Sparkles size={16} /> {details.price}
                  </span>
                )}
              </div>

              <EnrollButton />
            </div>

            <div className="relative">
              <div className="aspect-[16/10] rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(234,88,12,0.15)] bg-gradient-to-br from-slate-800 via-slate-900 to-sky-950 flex items-center justify-center">
                <BookOpen size={56} className="text-burnt-500/70" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-2xl bg-gradient-to-br from-burnt-400 to-primary-400 flex items-center justify-center shadow-lg">
                <Headphones size={40} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {hasExtendedDetails ? (
        <>
          {/* This course includes */}
          <section className="section-padding border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-black mb-8 text-center md:text-left">This course includes:</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {details.includes.map((item, i) => {
                  const Icon = includesIcons[i % includesIcons.length];
                  return (
                    <div
                      key={item}
                      className="card flex items-center gap-4 hover:border-burnt-500/30 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-burnt-800/40 flex items-center justify-center flex-shrink-0">
                        <Icon size={22} className="text-burnt-500" />
                      </div>
                      <span className="font-semibold text-gray-200">{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Cisco Career Path */}
          <section className="section-padding">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="card relative overflow-hidden border-sky-500/20 bg-gradient-to-br from-sky-950/40 to-burnt-950/30 p-8 md:p-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative grid md:grid-cols-[auto_1fr] gap-8 items-start">
                  <div className="flex flex-col items-center md:items-start gap-3">
                    <div className="px-5 py-3 rounded-xl bg-[#1BA0D7]/20 border border-[#1BA0D7]/40">
                      <span className="text-xl font-black tracking-tight text-[#1BA0D7]">Cisco</span>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-0.5">Networking Academy</p>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black mb-4 text-white">
                      {details.careerPath.title}
                    </h2>
                    <p className="text-gray-300 leading-relaxed mb-6">{details.careerPath.description}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {details.careerPath.badges.map((badge) => (
                        <span
                          key={badge}
                          className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-burnt-600/20 border border-burnt-500/40 text-burnt-300"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                    <EnrollButton />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="grid lg:grid-cols-3 gap-10">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-10">
                <section className="card">
                  <h2 className="text-2xl font-black mb-5 flex items-center gap-3">
                    <BookOpen size={24} className="text-burnt-500" /> Course Overview
                  </h2>
                  <p className="text-gray-300 leading-relaxed">{details.overview}</p>
                </section>

                <section className="card">
                  <h2 className="text-2xl font-black mb-5 flex items-center gap-3">
                    <Target size={24} className="text-burnt-500" /> What You&apos;ll Learn
                  </h2>
                  <ul className="space-y-3">
                    {details.learnings.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-gray-300">
                        <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="card">
                  <h2 className="text-2xl font-black mb-5">Course Curriculum</h2>
                  <div className="space-y-4">
                    {details.curriculum.map((module, index) => (
                      <div
                        key={module.title}
                        className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
                      >
                        <div className="px-5 py-4 bg-burnt-900/20 border-b border-white/10 flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-burnt-600/30 flex items-center justify-center text-sm font-black text-burnt-400">
                            {index + 1}
                          </span>
                          <h3 className="font-bold text-gray-100">{module.title}</h3>
                        </div>
                        <ul className="px-5 py-4 space-y-2">
                          {module.topics.map((topic) => (
                            <li key={topic} className="flex items-center gap-2 text-sm text-gray-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-burnt-500" />
                              {topic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="card sticky top-24 border-burnt-500/20">
                  <h3 className="text-lg font-black mb-4">Prerequisites</h3>
                  <ul className="space-y-3 mb-8">
                    {details.prerequisites.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-400">
                        <CheckCircle2 size={16} className="text-burnt-500 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <h3 className="text-lg font-black mb-3">Certification</h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-8">{details.certification}</p>

                  <div className="rounded-2xl bg-gradient-to-br from-burnt-900/40 to-burnt-800/20 border border-burnt-500/20 p-5 text-center">
                    <h3 className="font-black text-lg mb-2">Ready to Start?</h3>
                    <p className="text-sm text-gray-400 mb-5">
                      Enroll now and take the first step towards your IT career.
                    </p>
                    <EnrollButton className="btn-primary w-full text-center block" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <section className="section-padding border-t border-white/10">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <p className="text-gray-400 mb-8 leading-relaxed">
              Full course details for this programme are coming soon. Register now to express your interest
              and our team will guide you through enrollment.
            </p>
            <EnrollButton />
          </div>
        </section>
      )}
    </div>
  );
}
