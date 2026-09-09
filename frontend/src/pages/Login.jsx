import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthTabs from "../components/AuthTabs";
import { LogIn } from "lucide-react";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNeedsVerification(false);
    try {
      const user = await login(email.trim().toLowerCase(), password);
      toast.success(`Welcome back, ${user.name}!`);
      if (redirect) navigate(redirect);
      else if (user.role === "admin" || user.role === "super_admin") navigate("/admin/dashboard");
      else if (user.role === "reseller") navigate("/reseller/dashboard");
      else if (user.role === "academy") navigate("/academy/dashboard");
      else navigate("/");
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 403 && data?.needs_verification) {
        setNeedsVerification(true);
        if (data.email) setEmail(data.email);
      }
      toast.error(data?.message || "Login failed");
    }
    setLoading(false);
  };

  const resendLink = async () => {
    setResendLoading(true);
    try {
      const res = await api.post("/auth/resend-verification", { email: email.trim().toLowerCase() });
      toast.success(res.data?.message || "If needed, a new confirmation link was sent");
      if (res.data?.email_sent === false) {
        toast.error("Email could not be sent. Ask the admin to configure SMTP.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not resend link");
    }
    setResendLoading(false);
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

        {needsVerification && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
            <p className="mb-2">Your email is not confirmed yet.</p>
            <button
              type="button"
              disabled={resendLoading || !email}
              onClick={resendLink}
              className="w-full rounded-lg border border-amber-400/40 px-3 py-2 font-semibold hover:bg-amber-500/20 disabled:opacity-60"
            >
              {resendLoading ? "Sending…" : "Send another confirmation link"}
            </button>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link to="/verify-email" className="text-burnt-600 hover:underline">
            Resend confirmation email
          </Link>
        </p>
      </div>
    </div>
  );
}
