import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="glass-nav border-t border-white/10 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/Village Netacad Programme (6).png" alt="Village NetAcad" className="h-16 w-auto object-contain" />
              <div>
                <span className="font-display font-bold text-lg tracking-wide">
                  <span className="text-burnt-400">Village</span>{" "}
                  <span className="brand-text">NetAcad</span>
                </span>
                <p className="text-[9px] tracking-wide text-primary-300/70">Village NetAcad powered by Digititan</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Nature meets technology — empowering communities through digital education and smart skills.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-burnt-600 mb-4 tracking-wider uppercase text-sm">Quick Links</h4>
            <div className="space-y-2 text-sm">
              <Link to="/" className="block hover:text-burnt-600 transition-colors">Home</Link>
              <Link to="/about" className="block hover:text-burnt-600 transition-colors">About Us</Link>
              <Link to="/courses" className="block hover:text-burnt-600 transition-colors">Courses</Link>
              <Link to="/training-academy" className="block hover:text-burnt-600 transition-colors">Training Academy</Link>
              <Link to="/shop" className="block hover:text-burnt-600 transition-colors">Shop</Link>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-burnt-600 mb-4 tracking-wider uppercase text-sm">Support</h4>
            <div className="space-y-2 text-sm">
              <Link to="/contact" className="block hover:text-burnt-600 transition-colors">Contact Us</Link>
              <Link to="/register" className="block hover:text-burnt-600 transition-colors">Register</Link>
              <Link to="/login" className="block hover:text-burnt-600 transition-colors">Login</Link>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Village NetAcad powered by Digititan
        </div>
      </div>
    </footer>
  );
}
