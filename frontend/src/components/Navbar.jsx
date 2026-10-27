import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ChevronDown, Menu, X, ShoppingCart, User, LogOut, LayoutDashboard } from "lucide-react";
const navLinks = [
  { to: "/", label: "Home" },
  { to: "/courses", label: "Courses" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/training-academy", label: "Academies" },
  { to: "/shop", label: "Shop" },
  { to: "/impact", label: "Impact" },
  { to: "/ambassadors", label: "Ambassadors" },
  { to: "/contact", label: "Contact" },
];

const courseLinks = [
  { to: "/courses?track=ccna", label: "CCNA Paid Course" },
  { to: "/courses?track=free", label: "Free Courses" },
];

const authBtnClass =
  "neon-btn inline-flex items-center justify-center text-sm font-bold px-5 py-2 min-w-[96px] rounded-xl";

const linkClass =
  "text-sm font-bold uppercase tracking-widest text-slate-800 hover:text-burnt-600 whitespace-nowrap transition duration-300";

function NavItem({ item, onNavigate, className = linkClass }) {
  if (item.hash) {
    return (
      <a
        href={item.to}
        className={className}
        onClick={(e) => {
          if (window.location.pathname === "/") {
            e.preventDefault();
            const id = item.to.split("#")[1];
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          onNavigate?.();
        }}
      >
        {item.label}
      </a>
    );
  }
  return (
    <Link to={item.to} className={className} onClick={onNavigate}>
      {item.label}
    </Link>
  );
}

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

  const beforeCourses = navLinks.filter((l) => l.label === "Home");
  const afterCourses = navLinks.filter((l) => l.label !== "Home" && l.label !== "Courses");

  return (
    <nav
      className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between gap-3 sm:gap-4 h-14 sm:h-20">
          <div className="flex items-center gap-3 sm:gap-5 lg:gap-7 min-w-0 flex-1">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
              <img
                src="/Village Netacad Programme (6).png"
                alt="Village NetAcad"
                className="h-9 sm:h-14 md:h-16 w-auto object-contain flex-shrink-0"
              />
              <div className="min-w-0 hidden sm:block">
                <span className="font-display font-bold text-sm sm:text-base lg:text-lg tracking-wide leading-tight block truncate">
                  <span className="text-burnt-600">Village</span>{" "}
                  <span className="text-slate-800">NetAcad</span>
                </span>
                <p className="text-[10px] font-black tracking-wide text-slate-700 leading-tight">
                  Village NetAcad powered by Digititan
                </p>
              </div>
            </Link>

            <div className="hidden lg:flex items-center justify-start gap-3 xl:gap-5 min-w-0">
              {beforeCourses.map((l) => (
                <NavItem key={l.label} item={l} />
              ))}

              <div className="relative" ref={coursesRef}>
                <button
                  type="button"
                  onClick={() => setCoursesOpen((v) => !v)}
                  className={`${linkClass} inline-flex items-center gap-1`}
                  aria-expanded={coursesOpen}
                  aria-haspopup="true"
                >
                  Courses
                  <ChevronDown size={16} className={`transition-transform ${coursesOpen ? "rotate-180" : ""}`} />
                </button>
                {coursesOpen && (
                  <div className="absolute left-0 top-full z-50 mt-3 w-52 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                    {courseLinks.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setCoursesOpen(false)}
                        className="block px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-primary-50 hover:text-burnt-600 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {afterCourses.map((l) => (
                <NavItem key={l.label} item={l} />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 sm:gap-3 shrink-0">
            <Link
              to="/cart"
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors relative text-slate-700 hover:text-primary-600 flex-shrink-0"
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
                        <span className="inline-block mt-1 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full capitalize">
                          {user.role}
                        </span>
                      </div>
                      {dashPath && (
                        <Link
                          to={dashPath}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-700 transition-colors"
                        >
                          <LayoutDashboard size={16} /> Dashboard
                        </Link>
                      )}
                      <Link
                        to="/my-orders"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-700 transition-colors"
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

            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-700 flex-shrink-0"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          {beforeCourses.map((l) => (
            <NavItem
              key={l.label}
              item={l}
              onNavigate={() => setOpen(false)}
              className="block py-2 text-sm font-bold text-slate-800 hover:text-burnt-600 uppercase tracking-wider transition-colors"
            />
          ))}

          <div>
            <button
              type="button"
              onClick={() => setMobileCoursesOpen((v) => !v)}
              className="w-full flex items-center justify-between py-2 text-sm font-bold text-slate-800 uppercase tracking-wider"
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
                    className="block py-2 text-sm font-bold text-slate-800 hover:text-burnt-600"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {afterCourses.map((l) => (
            <NavItem
              key={l.label}
              item={l}
              onNavigate={() => setOpen(false)}
              className="block py-2 text-sm font-bold text-slate-800 hover:text-burnt-600 uppercase tracking-wider transition-colors"
            />
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
                  className="w-full text-sm text-center py-2 rounded-xl neon-btn font-bold"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="block text-sm text-center py-2 rounded-xl neon-btn font-bold"
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
