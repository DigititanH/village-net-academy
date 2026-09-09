import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthTabs from "../components/AuthTabs";
import { LogIn } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email.trim().toLowerCase(), password);
      toast.success(`Welcome back, ${user.name}!`);
      if (redirect) navigate(redirect);
      else if (user.role === "admin" || user.role === "super_admin") navigate("/admin/dashboard");
      else if (user.role === "reseller") navigate("/reseller/dashboard");
      else if (user.role === "academy") navigate("/academy/dashboard");
      else navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="card w-full max-w-md">
        <AuthTabs />
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-burnt-400 to-primary-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <LogIn size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Confirm your email after registering, then sign in to access courses.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-300">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>
          <div className="flex justify-between items-center gap-2">
            <Link
              to={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register"}
              className="text-sm text-burnt-600 hover:underline"
            >
              Need an account?
            </Link>
            <Link to="/forgot-password" className="text-sm text-burnt-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
