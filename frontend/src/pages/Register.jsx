import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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

  const isReseller = role === "reseller";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (isReseller && !academy.trim()) return toast.error("Please enter the name of your academy");

    setLoading(true);
    try {
      const user = await register(name, email, password, role, isReseller ? academy.trim() : undefined);
      if (user.pending) {
        toast.success("Registration received! Sign in after an admin approves your reseller account.");
        navigate("/login");
        return;
      }
      toast.success(`Welcome, ${user.name}!`);
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="card w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-burnt-400 to-burnt-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <UserPlus size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Create Account</h1>
          <p className="text-sm text-gray-400 mt-1">Join Village Netacad today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-300">Account Type</label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                if (e.target.value !== "reseller") setAcademy("");
              }}
              className="input-field"
            >
              <option value="customer">Customer</option>
              <option value="reseller">Reseller (requires admin approval)</option>
            </select>
          </div>

          {isReseller && (
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-300">Academy name *</label>
              <input
                type="text"
                required
                value={academy}
                onChange={(e) => setAcademy(e.target.value)}
                className="input-field"
                placeholder="e.g. Village NetAcad Academy"
              />
              <p className="text-xs text-gray-500 mt-1">Enter the name of the academy you are registering from</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "Creating account..." : "Register"}</button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account? <Link to="/login" className="text-burnt-600 font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
