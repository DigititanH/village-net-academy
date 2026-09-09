import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { KeyRound, CheckCircle } from "lucide-react";
import api from "../lib/api";
import toast from "react-hot-toast";

function readToken(paramToken, searchParams) {
  const fromPath = (paramToken || "").trim();
  if (fromPath) return fromPath;
  const fromQuery = (searchParams.get("token") || "").trim();
  if (fromQuery) return fromQuery;
  // Fallback if the router missed the query string
  try {
    const q = new URLSearchParams(window.location.search);
    return (q.get("token") || "").trim();
  } catch {
    return "";
  }
}

export default function ResetPassword() {
  const { token: pathToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = readToken(pathToken, searchParams);
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("This reset link is invalid. Request a new one from Forgot password.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      toast.success("Password updated. You can sign in now.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed. The link may have expired.");
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="card w-full max-w-md text-center">
          <h1 className="text-2xl font-black mb-2 bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
            Invalid reset link
          </h1>
          <p className="text-gray-400 mb-6">
            This page needs a valid token from your email. Request a new reset link.
          </p>
          <Link to="/forgot-password" className="btn-primary inline-block">
            Forgot password
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="card w-full max-w-md text-center">
        {done ? (
          <>
            <CheckCircle size={48} className="text-burnt-600 mx-auto mb-4" />
            <h1 className="text-2xl font-black mb-2 bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
              Password reset
            </h1>
            <p className="text-gray-400 mb-6">Your password was updated. Redirecting to login…</p>
            <Link to="/login" className="btn-primary inline-block">
              Sign in
            </Link>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-gradient-to-br from-burnt-400 to-primary-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <KeyRound size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-black mb-1 bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
              Set a new password
            </h1>
            <p className="text-sm text-gray-400 mb-6">Choose a new password for your Village NetAcad account.</p>
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-300">New password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-300">Confirm password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Saving…" : "Reset password"}
              </button>
            </form>
            <p className="text-sm text-gray-400 mt-4">
              <Link to="/forgot-password" className="text-burnt-600 hover:underline">
                Request a new link
              </Link>
              {" · "}
              <Link to="/login" className="text-burnt-600 hover:underline">
                Back to Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
