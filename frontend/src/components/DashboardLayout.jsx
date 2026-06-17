import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, Package, ShoppingBag, Users, Heart, UserCheck, Menu, X, LogOut, Home, TrendingUp } from "lucide-react";

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/donations", label: "Donations", icon: Heart },
  { to: "/admin/resellers", label: "Resellers", icon: UserCheck },
];

const resellerLinks = [
  { to: "/reseller/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/reseller/sales", label: "Sales", icon: TrendingUp },
];

export default function DashboardLayout({ role, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const links = role === "admin" ? adminLinks : resellerLinks;

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="dark min-h-screen text-white flex">
      {sidebarOpen && <div className="fixed inset-0 glass-clear z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass-clear border-r border-white/10 transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between h-20 px-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img src="/logo.jpeg" alt="Village Netacad" className="h-14 w-auto object-contain flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-sm bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent block leading-tight">Village Netacad</span>
              <span className="text-[9px] text-burnt-200/60 block leading-tight">Village Netacad powered by Digititan</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-white"><X size={18} /></button>
        </div>

        <nav className="p-4 space-y-1">
          {links.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link key={l.to} to={l.to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? "bg-burnt-800/20 text-burnt-600 border border-burnt-600/20" : "text-gray-400 hover:bg-white/5 hover:text-burnt-600"}`}>
                <l.icon size={18} /> {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-burnt-600 transition-colors">
            <Home size={18} /> Back to Site
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 glass-nav border-b border-white/10 h-16 flex items-center px-4 gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-white/10 text-gray-300">
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold capitalize bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">{role} Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-burnt-800/30 rounded-full flex items-center justify-center border border-burnt-700/30">
              <span className="text-burnt-600 text-sm font-semibold">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-200">{user?.name}</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
