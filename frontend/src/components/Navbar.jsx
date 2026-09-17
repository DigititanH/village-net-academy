import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ChevronDown, Menu, X, ShoppingCart, User, LogOut, LayoutDashboard } from "lucide-react";
import GlobalSearch from "./GlobalSearch";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/training-academy", label: "Training Academy" },
  { to: "/shop", label: "Shop" },
  { to: "/contact", label: "Contact Us" },
];

const courseLinks = [
  { to: "/courses?track=ccna", label: "CCNA Paid Course" },
  { to: "/courses?track=free", label: "Free Courses" },
];

const authBtnClass =
  "inline-flex items-center justify-center text-sm font-bold px-5 py-2 min-w-[96px] rounded-xl bg-glossy-gradient hover:scale-105 transition-all duration-300 shadow-[0_0_22px_rgba(74,222,128,0.4)]";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [mobileCoursesOpen, setMobileCoursesOpen] = useState(false);
  const coursesRef = useRef(null);
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const dashPath =
    user?.role === "admin" || user?.role === "super_admin"
      ? "/admin/dashboard"
      : user?.role === "reseller"
        ? "/reseller/dashboard"
        : user?.role === "academy"
          ? "/academy/dashboard"
          : null;

  useEffect(() => {
    const onDocClick = (e) => {
      if (coursesRef.current && !coursesRef.current.contains(e.target)) {
        setCoursesOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMenuOpen(false);
    setOpen(false);
  };

  return (
    <nav
      className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,auto)_1fr_minmax(0,auto)] items-center gap-2 sm:gap-4 h-14 sm:h-20">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <img
              src="/Village Netacad Programme (6).png"
              alt="Village NetAcad"
              className="h-9 sm:h-14 md:h-16 w-auto max-w-[88px] sm:max-w-none object-contain flex-shrink-0"
            />
            <div className="min-w-0">
              <span className="font-display font-bold text-sm sm:text-base lg:text-lg tracking-wide leading-tight block truncate">
                <span className="text-burnt-600">Village</span>{" "}
                <span className="text-slate-800">NetAcad</span>
              </span>
              <p className="hidden sm:block text-[9px] tracking-wide text-slate-500 leading-tight">
                Village NetAcad powered by Digititan
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center justify-center gap-6 lg:gap-8">
            {navLinks.slice(0, 2).map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className="text-sm font-semibold uppercase tracking-widest text-slate-800 hover:text-burnt-600 transition duration-300 whitespace-nowrap"
              >
                {l.label}
              </Link>
            ))}

            <div className="relative" ref={coursesRef}>
              <button
                type="button"
                onClick={() => setCoursesOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-widest text-slate-800 hover:text-burnt-600 transition duration-300 whitespace-nowrap"
                aria-expanded={coursesOpen}
                aria-haspopup="true"
              >
                Courses
                <ChevronDown size={16} className={`transition-transform ${coursesOpen ? "rotate-180" : ""}`} />
              </button>
              {coursesOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-3 w-48 -translate-x-1/2 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                  {courseLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setCoursesOpen(false)}
                      className="block px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-burnt-50 hover:text-burnt-700 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    to="/courses"
                    onClick={() => setCoursesOpen(false)}
                    className="block px-4 py-2.5 text-xs font-medium text-slate-500 hover:bg-slate-50 border-t border-slate-100 mt-1"
                  >
                    View all courses
                  </Link>
                </div>
              )}
            </div>

            {navLinks.slice(2).map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className="text-sm font-semibold uppercase tracking-widest text-slate-800 hover:text-burnt-600 transition duration-300 whitespace-nowrap"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-end gap-1 sm:gap-3 col-start-2 md:col-start-auto">
            <GlobalSearch />

            <Link
              to="/cart"
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors relative text-slate-700 hover:text-burnt-600 flex-shrink-0"
              aria-label="Cart"
            >
              <ShoppingCart size={18} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-glossy-gradient text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </Link>

            <div className="relative hidden sm:block">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-10 h-10 rounded-full bg-glossy-gradient flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0"
                    aria-label="Account menu"
                  >
                    <User size={18} className="text-white" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                        <span className="inline-block mt-1 text-xs bg-burnt-100 text-burnt-700 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
                      </div>
                      {dashPath && (
                        <Link
                          to={dashPath}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-burnt-600 transition-colors"
                        >
                          <LayoutDashboard size={16} /> Dashboard
                        </Link>
                      )}
                      <Link
                        to="/my-orders"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-burnt-600 transition-colors"
                      >
                        <User size={16} /> My Orders
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link to="/login" className={authBtnClass}>
                  Login
                </Link>
              )}
            </div>

            <button type="button" onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-700 flex-shrink-0">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          {navLinks.slice(0, 2).map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-800 hover:text-burnt-600 transition-colors uppercase tracking-wider"
            >
              {l.label}
            </Link>
          ))}

          <div>
            <button
              type="button"
              onClick={() => setMobileCoursesOpen((v) => !v)}
              className="w-full flex items-center justify-between py-2 text-sm font-semibold text-slate-800 uppercase tracking-wider"
            >
              Courses
              <ChevronDown size={16} className={`transition-transform ${mobileCoursesOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileCoursesOpen && (
              <div className="pl-3 pb-2 space-y-1">
                {courseLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      setOpen(false);
                      setMobileCoursesOpen(false);
                    }}
                    className="block py-2 text-sm font-medium text-slate-600 hover:text-burnt-600"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/courses"
                  onClick={() => {
                    setOpen(false);
                    setMobileCoursesOpen(false);
                  }}
                  className="block py-2 text-sm text-slate-500 hover:text-burnt-600"
                >
                  View all courses
                </Link>
              </div>
            )}
          </div>

          {navLinks.slice(2).map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-800 hover:text-burnt-600 transition-colors uppercase tracking-wider"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 space-y-2">
            {user ? (
              <>
                {dashPath && (
                  <Link
                    to={dashPath}
                    onClick={() => setOpen(false)}
                    className="block text-sm text-center py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  to="/my-orders"
                  onClick={() => setOpen(false)}
                  className="block text-sm text-center py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
                >
                  My Orders
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-sm text-center py-2 rounded-xl bg-glossy-gradient font-bold text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="block text-sm text-center py-2 rounded-xl bg-glossy-gradient font-bold text-white"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
