import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { digititanLinks } from "../data/digititanAbout";

export default function Footer() {
  const [email, setEmail] = useState("");

  const onNewsletter = (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !value.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    toast.success("Thanks — we will keep you posted.");
    setEmail("");
  };

  return (
    <footer className="glass-nav border-t border-primary-400/25 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/Village Netacad Programme (6).png" alt="Village NetAcad" className="h-16 w-auto object-contain" />
              <div>
                <span className="font-display font-bold text-lg tracking-wide">
                  <span className="text-burnt-400">Village</span>{" "}
                  <span className="brand-text">NetAcad</span>
                </span>
                <p className="text-[10px] font-black tracking-wide text-primary-200">Village NetAcad powered by Digititan</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Empowering Africa’s digital future through free skills training, academies and community leadership.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-primary-300 mb-4 tracking-wider uppercase text-sm">Quick Links</h4>
            <div className="space-y-2 text-sm">
              <Link to="/" className="block hover:text-primary-300 transition-colors">Home</Link>
              <Link to="/training-academy" className="block hover:text-primary-300 transition-colors">Academies</Link>
              <Link to="/shop" className="block hover:text-primary-300 transition-colors">Shop</Link>
              <Link to="/ambassadors" className="block hover:text-primary-300 transition-colors">Ambassadors</Link>
              <Link to="/contact" className="block hover:text-primary-300 transition-colors">Contact</Link>
              <Link to="/how-it-works" className="block hover:text-primary-300 transition-colors">How It Works</Link>
              <Link to="/impact" className="block hover:text-primary-300 transition-colors">Impact</Link>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-primary-300 mb-4 tracking-wider uppercase text-sm">Support</h4>
            <div className="space-y-2 text-sm">
              <Link to="/register" className="block hover:text-primary-300 transition-colors">Register</Link>
              <Link to="/login" className="block hover:text-primary-300 transition-colors">Login</Link>
              <a href="/docs/terms-and-conditions.pdf" target="_blank" rel="noopener noreferrer" className="block hover:text-primary-300 transition-colors">
                Terms and Conditions
              </a>
              <a href="/docs/privacy-policy.pdf" target="_blank" rel="noopener noreferrer" className="block hover:text-primary-300 transition-colors">
                Privacy Policy
              </a>
              <a href="/docs/return-policy.pdf" target="_blank" rel="noopener noreferrer" className="block hover:text-primary-300 transition-colors">
                Return Policy
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-primary-300 mb-4 tracking-wider uppercase text-sm">Social & Newsletter</h4>
            <div className="flex flex-wrap gap-3 mb-5 text-sm">
              <a href={digititanLinks.facebook} target="_blank" rel="noopener noreferrer" className="partner-chip px-3 py-1.5 rounded-lg border border-primary-400/35 hover:text-primary-200">
                Facebook
              </a>
              <a href={digititanLinks.instagram} target="_blank" rel="noopener noreferrer" className="partner-chip px-3 py-1.5 rounded-lg border border-primary-400/35 hover:text-primary-200">
                Instagram
              </a>
              <a href={digititanLinks.tiktok} target="_blank" rel="noopener noreferrer" className="partner-chip px-3 py-1.5 rounded-lg border border-primary-400/35 hover:text-primary-200">
                TikTok
              </a>
              <a href={digititanLinks.linkedin} target="_blank" rel="noopener noreferrer" className="partner-chip px-3 py-1.5 rounded-lg border border-primary-400/35 hover:text-primary-200">
                LinkedIn
              </a>
            </div>
            <form onSubmit={onNewsletter} className="space-y-2">
              <label htmlFor="newsletter-email" className="sr-only">
                Email for newsletter
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="input-field text-sm"
              />
              <button type="submit" className="neon-btn w-full py-2.5 rounded-xl text-sm font-bold">
                Sign up
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-400/20 text-center text-sm font-black text-gray-400">
          &copy; {new Date().getFullYear()} Village NetAcad powered by Digititan
        </div>
      </div>
    </footer>
  );
}
