import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  GraduationCap,
  Landmark,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/api";
import { redirectToPayFast } from "../lib/payfast";
import { SITE_EMAIL } from "../lib/site";
import { CCNA_PROGRAM_TITLE, ccnaCourses, enrolmentPayments, isCcnaCourse } from "../data/academyCourses";
import PageHero from "../components/PageHero";
import { pageHeroImages } from "../data/pageHeroImages";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  country: "South Africa",
  course: "",
  message: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  code: "",
};

export default function CourseEnrol() {
  const [searchParams] = useSearchParams();
  const courseFromQuery = searchParams.get("course") || "";
  const initialCourse = isCcnaCourse(courseFromQuery) ? courseFromQuery : CCNA_PROGRAM_TITLE;

  const [form, setForm] = useState({ ...emptyForm, course: initialCourse });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      course: isCcnaCourse(courseFromQuery) ? courseFromQuery : CCNA_PROGRAM_TITLE,
    }));
  }, [courseFromQuery]);

  const courseOptions = useMemo(() => ccnaCourses.map((c) => c.title), []);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.course || !isCcnaCourse(form.course)) {
      return toast.error("Please select a CCNA course");
    }
    if (!form.line1.trim() || !form.city.trim() || !form.region.trim() || !form.code.trim()) {
      return toast.error("Please complete the shipping address (required by PayFast Subscribe)");
    }

    setLoading(true);
    try {
      const { data } = await api.post("/ccna/enrol", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        student_type: "south-african",
        country: "South Africa",
        course: form.course,
        message: form.message,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        region: form.region,
        code: form.code,
      });

      if (!data?.url || !data?.fields) {
        throw new Error("Invalid PayFast response");
      }

      toast.loading("Redirecting to PayFast...", { id: "ccna-payfast" });
      redirectToPayFast(data.url, data.fields);
    } catch (err) {
      toast.dismiss("ccna-payfast");
      toast.error(err.response?.data?.message || err.message || "Failed to start PayFast payment");
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHero
        image={pageHeroImages.courseEnrol}
        alt="CCNA registration with Village NetAcad"
        eyebrow="Village NetAcad · PayFast"
        title="CCNA Paid Course Registration"
        subtitle="Register for the Village NetAcad CCNA Paid Course and complete payment securely with PayFast."
      >
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-burnt-300 transition-colors border border-white/20 rounded-full px-4 py-2 bg-black/30 backdrop-blur-sm"
        >
          <ArrowLeft size={16} /> Back to Courses
        </Link>
      </PageHero>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black mb-3 bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
                {enrolmentPayments.heading}
              </h2>
              <p className="text-gray-400 max-w-3xl mx-auto leading-relaxed">{enrolmentPayments.intro}</p>
            </div>

            <div className="max-w-2xl mx-auto mb-6">
              <div className="card border border-burnt-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-burnt-800/40 flex items-center justify-center">
                    <Landmark size={22} className="text-burnt-500" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-burnt-500 font-semibold">
                      {enrolmentPayments.southAfrican.badge}
                    </p>
                    <h3 className="text-xl font-bold">{enrolmentPayments.southAfrican.title}</h3>
                  </div>
                </div>
                <ul className="space-y-3">
                  {enrolmentPayments.southAfrican.points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm text-gray-400 leading-relaxed">
                      <CheckCircle size={16} className="text-burnt-500 flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-sm text-center text-gray-500 max-w-3xl mx-auto flex items-start justify-center gap-2">
              <CreditCard size={16} className="text-burnt-600 flex-shrink-0 mt-0.5" />
              <span>{enrolmentPayments.note}</span>
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="card space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-burnt-400 to-primary-400 flex items-center justify-center">
                  <GraduationCap size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black">CCNA Subscribe Checkout</h2>
                  <p className="text-sm text-gray-400">
                    Complete your details and shipping address, then subscribe on PayFast (R550 × 6 months).
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-300">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-300">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    className="input-field"
                    placeholder="+27 ..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-300">Country</label>
                  <input
                    type="text"
                    readOnly
                    value="South Africa"
                    className="input-field opacity-80 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-300">CCNA Programme *</label>
                {courseOptions.length === 1 ? (
                  <input
                    type="text"
                    readOnly
                    value={courseOptions[0]}
                    className="input-field opacity-80 cursor-not-allowed"
                  />
                ) : (
                  <select
                    required
                    value={form.course}
                    onChange={(e) => setField("course", e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select a CCNA course</option>
                    {courseOptions.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <MapPin size={18} className="text-burnt-500" />
                  Shipping Address <span className="text-red-400">*</span>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-300">Line 1 *</label>
                  <input
                    type="text"
                    required
                    value={form.line1}
                    onChange={(e) => setField("line1", e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-300">Line 2</label>
                  <input
                    type="text"
                    value={form.line2}
                    onChange={(e) => setField("line2", e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-300">City *</label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-300">Province *</label>
                    <input
                      type="text"
                      required
                      value={form.region}
                      onChange={(e) => setField("region", e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-300">Postal Code *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={form.code}
                    onChange={(e) => setField("code", e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-300">Notes (optional)</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setField("message", e.target.value)}
                  className="input-field resize-y"
                  placeholder="Preferred start date, academy partner, or billing questions…"
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
                <p className="font-semibold text-white mb-1">PayFast Subscribe — R550 × 6 months</p>
                <p>
                  You will be redirected to PayFast to start a R550 monthly subscription for 6 payments.
                  Card details stay on PayFast. Questions?{" "}
                  <a href={`mailto:${SITE_EMAIL}`} className="text-burnt-600 hover:underline">
                    {SITE_EMAIL}
                  </a>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full inline-flex items-center justify-center gap-2"
              >
                <CreditCard size={16} />
                {loading ? "Redirecting to PayFast..." : "Subscribe with PayFast — R550/mo"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
