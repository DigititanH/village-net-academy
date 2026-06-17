import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, CheckCircle } from "lucide-react";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch { toast.error("Something went wrong"); }
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="card w-full max-w-md text-center">
        {sent ? (
          <>
            <CheckCircle size={48} className="text-burnt-600 mx-auto mb-4" />
            <h1 className="text-2xl font-black mb-2 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Check Your Email</h1>
            <p className="text-gray-400 mb-6">If an account exists for {email}, we've sent a password reset link.</p>
            <Link to="/login" className="btn-primary inline-block">Back to Login</Link>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-gradient-to-br from-burnt-400 to-burnt-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <KeyRound size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-black mb-1 bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">Forgot Password?</h1>
            <p className="text-sm text-gray-400 mb-6">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-300">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "Sending..." : "Send Reset Link"}</button>
            </form>
            <p className="text-sm text-gray-400 mt-4"><Link to="/login" className="text-burnt-600 hover:underline">Back to Login</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
