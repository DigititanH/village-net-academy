import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthTabs from "../components/AuthTabs";
import { UserPlus } from "lucide-react";
import toast from "react-hot-toast";

const PROGRAMME_CENTRE = "Digititan Programme";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [affiliation, setAffiliation] = useState("independent"); // independent | affiliated
  const [academy, setAcademy] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const backendRole = role === "customer" ? "customer" : role;
  const needsCentre =
    role === "academy" || (role === "reseller" && affiliation === "affiliated");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (needsCentre && !academy.trim()) {
      return toast.error(
        role === "academy"
          ? "Please enter your centre name"
          : "Please enter the centre you are affiliated with"
      );
    }

    setLoading(true);
    try {
      const payloadAcademy =
        role === "academy"
          ? academy.trim()
          : role === "reseller"
            ? affiliation === "affiliated"
              ? academy.trim()
              : PROGRAMME_CENTRE
            : undefined;

      const user = await register(
        name,
        email,
        password,
        backendRole,
        payloadAcademy,
        role === "reseller" ? affiliation : undefined
      );
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
                const next = e.target.value;
                setRole(next);
                if (next === "customer") {
                  setAcademy("");
                  setAffiliation("independent");
                }
                if (next === "academy") setAffiliation("affiliated");
              }}
              className="input-field"
            >
              <option value="customer">Individual</option>
              <option value="reseller">Reseller (beneficiary)</option>
              <option value="academy">Centre</option>
            </select>
          </div>

          {role === "reseller" && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-300">Centre affiliation</label>
              <label className="flex items-start gap-3 rounded-xl border border-white/10 p-3 cursor-pointer hover:bg-white/5">
                <input
                  type="radio"
                  name="affiliation"
                  className="mt-1"
                  checked={affiliation === "independent"}
                  onChange={() => {
                    setAffiliation("independent");
                    setAcademy("");
                  }}
                />
                <span>
                  <span className="font-semibold block">Independent</span>
                  <span className="text-xs text-gray-500">
                    Not linked to a centre — you support the Digititan Programme automatically. You earn 53%; the Programme receives 26%.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-white/10 p-3 cursor-pointer hover:bg-white/5">
                <input
                  type="radio"
                  name="affiliation"
                  className="mt-1"
                  checked={affiliation === "affiliated"}
                  onChange={() => setAffiliation("affiliated")}
                />
                <span>
                  <span className="font-semibold block">Affiliated with a centre</span>
                  <span className="text-xs text-gray-500">
                    Enter your centre name. You earn 53%; the centre receives 26%.
                  </span>
                </span>
              </label>
            </div>
          )}

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

          {needsCentre && (
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-300">
                {role === "academy" ? "Centre name *" : "Centre name *"}
              </label>
              <input
                type="text"
                required
                value={academy}
                onChange={(e) => setAcademy(e.target.value)}
                className="input-field"
                placeholder="e.g. Aspire Foundation"
              />
              <p className="text-xs text-gray-500 mt-1">
                {role === "academy"
                  ? "Use the exact centre name as registered on the Training Academy map. Centres receive 26% of linked reseller sales."
                  : "Use the exact centre name as on the Training Academy map."}
              </p>
            </div>
          )}

          {role === "reseller" && affiliation === "independent" && (
            <p className="text-xs text-gray-500 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              Centre is set automatically to <span className="text-burnt-400 font-semibold">{PROGRAMME_CENTRE}</span>.
            </p>
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
