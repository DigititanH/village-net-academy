import { Link, useLocation } from "react-router-dom";

export default function AuthTabs() {
  const { pathname } = useLocation();
  const isLogin = pathname === "/login";

  return (
    <div className="flex rounded-xl bg-gray-800/60 p-1 mb-6 border border-gray-700/50">
      <Link
        to="/login"
        className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          isLogin ? "bg-burnt-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
        }`}
      >
        Login
      </Link>
      <Link
        to="/register"
        className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          !isLogin ? "bg-burnt-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
        }`}
      >
        Register
      </Link>
    </div>
  );
}
