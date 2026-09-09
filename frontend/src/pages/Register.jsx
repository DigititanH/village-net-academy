import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthTabs from "../components/AuthTabs";
import { UserPlus } from "lucide-react";
import toast from "react-hot-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [academy, setAcademy] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const isPartner = role === "reseller" || role === "academy";
  const backendRole = role === "customer" ? "customer" : role;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (isPartner && !academy.trim()) return toast.error("Please enter the name of your academy");

    setLoading(true);
    try {
      const user = await register(name, email, password, backendRole, isPartner ? academy.trim() : undefined);
      if (user.pending_verification || user.pending) {
        toast.success(
          user.message ||
            "Registration received. Check your email and click the confirmation link before signing in."
        );
        const q = new URLSearchParams();
        q.set("email", email.trim().toLowerCase());
        if (redirect) q.set("redirect", redirect);
        navigate(`/verify-email?${q.toString()}`);
        return;
      }
      toast.success(`Welcome, ${user.name}!`);
      if (role === "reseller") navigate("/reseller/dashboard");
      else if (role === "academy") navigate("/academy/dashboard");
      else navigate(redirect || "/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="card w-full max-w-md">
        <AuthTabs />
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-burnt-400 to-primary-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <UserPlus size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Register to access courses. We will email you a confirmation link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-300">I am registering as</label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                if (e.target.value === "customer") setAcademy("");
              }}
              className="input-field"
            >
              <option value="customer">Individual</option>
              <option value="reseller">Reseller</option>
              <option value="academy">Affiliated by the academy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-300">Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          </div>
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
              minLength={6}
            />
          </div>

          {isPartner && (
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-300">
                {role === "academy" ? "Academy you are affiliated with *" : "Academy name *"}
              </label>
              <input
                type="text"
                required
                value={academy}
                onChange={(e) => setAcademy(e.target.value)}
                className="input-field"
                placeholder="e.g. Village NetAcad Academy"
              />
              <p className="text-xs text-gray-500 mt-1">
                {role === "academy"
                  ? "Use the exact academy name as registered on the Training Academy map."
                  : "Enter the academy you sell under"}
              </p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Register"}
          </button>
          <p className="text-xs text-center text-gray-500">
            After registering, confirm your email, then{" "}
            <Link to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"} className="text-burnt-400 hover:underline">
              sign in
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
