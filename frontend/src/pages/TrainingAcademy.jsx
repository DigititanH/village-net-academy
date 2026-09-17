import { useEffect, useState } from "react";
import { Building2, CheckCircle, ExternalLink, GraduationCap, Phone, Users } from "lucide-react";
import { digititanLinks, digititanRegistration } from "../data/digititanAbout";
import { ascCentres as defaultAscCentres } from "../data/ascCentres";
import SaProvinceMap from "../components/SaProvinceMap";
import PageHero from "../components/PageHero";
import { pageHeroImages } from "../data/pageHeroImages";
import api from "../lib/api";

const highlights = [
  {
    icon: GraduationCap,
    title: "Industry-aligned learning",
    desc: "Networking, Cybersecurity, Programming, and ICT fundamentals through Cisco NetAcad.",
  },
  {
    icon: Users,
    title: "Community-focused delivery",
    desc: "Training centres support schools, youth programmes, and local hubs across South Africa.",
  },
  {
    icon: Building2,
    title: "Centres partner support",
    desc: "Onboarding, facilitator enablement, and learner pathways toward certification.",
  },
];

const requirements = [
  "A school, youth programme, community hub, or similar organisation that can support learners.",
  "A facilitator or support contact to guide learners through NetAcad delivery.",
  "Accurate organisation and contact details for registration and verification.",
  "Commitment to help learners enrol, stay engaged, and progress toward skills outcomes.",
];

const learnerRegistrationFields = [
  "Name and surname",
  "Village",
  "Phone number with WhatsApp",
  "ID number",
  "Highest qualification",
];

const LEARNER_REGISTER_URL = digititanRegistration.learner.url;
const LEARNER_QR_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(LEARNER_REGISTER_URL)}`;

export default function TrainingAcademy() {
  const [ascList, setAscList] = useState(defaultAscCentres);

  useEffect(() => {
    api
      .get("/asc/centres")
      .then((res) => {
        if (Array.isArray(res.data?.centres) && res.data.centres.length > 0) {
          setAscList(res.data.centres);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <PageHero
        image={pageHeroImages.trainingAcademy}
        alt="Digititan Centres across South Africa"
        eyebrow="Training Academy"
        title="Digititan Centres network"
        titleBrand
        compact
        subtitle="Select a province on the map to see Digititan Centres across South Africa."
      />

      {/* Map first — primary view after the page header */}
      <section className="pt-4 pb-8 md:pt-6 md:pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <SaProvinceMap centres={ascList} />
        </div>
      </section>

      <div className="section-padding pt-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
            About the Training Academy
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            <span className="text-burnt-400 font-semibold">Village NetAcad Training Academy</span>{" "}
            connects communities to Cisco Networking Academy (NetAcad) — a global platform for practical, self-paced{" "}
            <span className="text-burnt-400 font-medium">digital skills</span>. Partners run local training centres
            that help learners develop Networking, Cybersecurity, and ICT skills that support{" "}
            <span className="text-burnt-400 font-medium">certification</span> and work-ready outcomes.
          </p>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-white mb-6">At a glance</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {highlights.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="card p-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-burnt-400 to-primary-400 flex items-center justify-center mb-3">
                    <Icon size={20} className="text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-1">{title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-2xl font-bold text-white">Who can open a training centre?</h2>
            <p className="text-gray-400 leading-relaxed">{digititanRegistration.asc.description}</p>
            <ul className="space-y-2">
              {requirements.map((item) => (
                <li key={item} className="flex gap-3 text-gray-400">
                  <CheckCircle size={18} className="text-burnt-600 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">How to Register in 4 Easy Steps</h2>
            </div>

            <ol className="space-y-4">
              <li className="card p-5 sm:p-6">
                <div className="flex gap-4 items-start">
                  <span className="w-9 h-9 rounded-full bg-gradient-to-br from-burnt-400 to-primary-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    1
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white mb-2 uppercase tracking-wide text-sm">Step 1: Scan or Click</h3>
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">
                      Scan the QR code or follow this link to open the registration form:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <img
                        src={LEARNER_QR_SRC}
                        alt="QR code for Village NetAcad learner registration"
                        className="w-[140px] h-[140px] rounded-xl bg-white p-2 border border-white/10"
                      />
                      <a
                        href={LEARNER_REGISTER_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary inline-flex items-center gap-2"
                      >
                        Open registration form
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </li>

              <li className="card p-5 sm:p-6 flex gap-4 items-start">
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-burnt-400 to-primary-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  2
                </span>
                <div>
                  <h3 className="font-bold text-white mb-2 uppercase tracking-wide text-sm">Step 2: Fill in Your Details</h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-3">
                    Complete the short registration form with your:
                  </p>
                  <ul className="space-y-2">
                    {learnerRegistrationFields.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-gray-300">
                        <CheckCircle size={16} className="text-burnt-500 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>

              <li className="card p-5 sm:p-6 flex gap-4 items-start">
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-burnt-400 to-primary-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  3
                </span>
                <div>
                  <h3 className="font-bold text-white mb-2 uppercase tracking-wide text-sm">Step 3: Verify on WhatsApp</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    You’ll receive a call from our Learning Coordinator within 2–3 days.
                  </p>
                </div>
              </li>

              <li className="card p-5 sm:p-6 flex gap-4 items-start">
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-burnt-400 to-primary-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  4
                </span>
                <div>
                  <h3 className="font-bold text-white mb-2 uppercase tracking-wide text-sm">Step 4: Start Learning</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Once your registration is verified, you’ll receive a call from our Learning Coordinator to create a
                    profile and wait for approval to start your training.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <section className="mt-10 card p-8 border-burnt-700/30">
            <h2 className="text-xl font-bold text-white mb-2">Need Help Registering?</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Call <a href="tel:+27128440176" className="text-burnt-300 font-semibold hover:underline">012 844 0176</a>
              {" "}or WhatsApp{" "}
              <a href={digititanLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="text-burnt-300 font-semibold hover:underline">
                {digititanLinks.whatsappDisplay}
              </a>
              .
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="tel:+27128440176" className="btn-primary inline-flex items-center gap-2">
                <Phone size={16} /> Call 012 844 0176
              </a>
              <a
                href={digititanLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-primary-400/50 text-primary-200 px-6 py-2.5 rounded-full font-semibold hover:bg-primary-500/15 transition inline-flex items-center gap-2"
              >
                WhatsApp {digititanLinks.whatsappDisplay}
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
