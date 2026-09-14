import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, XCircle, Mail } from "lucide-react";
import api from "../lib/api";
import toast from "react-hot-toast";

function ResendForm({ initialEmail = "", onSent }) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail(initialEmail || "");
  }, [initialEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/resend-verification", { email: email.trim().toLowerCase() });
      toast.success(res.data?.message || "If needed, a new link was sent");
      if (res.data?.email_sent === false) {
        toast.error("Email could not be sent. Ask the admin to configure SMTP.");
      }
      onSent?.(email.trim().toLowerCase());
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not resend link");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left mt-4">
      <label className="block text-sm font-semibold text-gray-300">Email used to register</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input-field"
        autoComplete="email"
      />
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Sending…" : "Send another confirmation link"}
      </button>
    </form>
  );
}

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const emailFromQuery = searchParams.get("email") || "";
  const fromMobile = (searchParams.get("client") || "").toLowerCase() === "mobile";
  const [status, setStatus] = useState(token ? "loading" : emailFromQuery ? "pending" : "missing");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState(emailFromQuery);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .get("/auth/verify-email", {
        params: { token, ...(fromMobile ? { client: "mobile" } : {}) },
      })
      .then((res) => {
        if (cancelled) return;
        setStatus("success");
        setMessage(res.data?.message || "Email verified successfully");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err.response?.data?.message || "Invalid or expired confirmation link");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="card w-full max-w-md text-center">
        {status === "loading" && (
          <>
            <Loader2 size={40} className="mx-auto mb-4 text-burnt-400 animate-spin" />
            <h1 className="text-xl font-bold mb-2">Confirming your registration…</h1>
            <p className="text-sm text-gray-400">Please wait a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle size={40} className="mx-auto mb-4 text-burnt-400" />
            <h1 className="text-xl font-bold mb-2">Registration confirmed</h1>
            {fromMobile || (message || "").toLowerCase().includes("open the village netacad app") ? (
              <>
                <p className="text-sm text-gray-400 mb-6">
                  {message}. Return to the <strong>Village NetAcad</strong> mobile app and sign in there.
                </p>
                <p className="text-sm text-gray-500">You can close this tab — no website sign-in needed for the app.</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-6">{message}. You can now sign in and access courses.</p>
                <Link to="/login" className="btn-primary inline-flex">
                  Sign in
                </Link>
              </>
            )}
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={40} className="mx-auto mb-4 text-red-400" />
            <h1 className="text-xl font-bold mb-2">Confirmation failed</h1>
            <p className="text-sm text-gray-400 mb-2">{message}</p>
            <p className="text-sm text-gray-500 mb-2">Request a new confirmation email below.</p>
            <ResendForm initialEmail={resendEmail} onSent={setResendEmail} />
            <Link to="/login" className="text-sm text-burnt-600 hover:underline mt-4 inline-block">
              Back to Login
            </Link>
          </>
        )}
        {(status === "missing" || status === "pending") && (
          <>
            <Mail size={40} className="mx-auto mb-4 text-burnt-400" />
            <h1 className="text-xl font-bold mb-2">
              {status === "pending" ? "Confirm your email" : "Need a confirmation link?"}
            </h1>
            <p className="text-sm text-gray-400 mb-2">
              {status === "pending"
                ? `We sent a confirmation link${resendEmail ? ` to ${resendEmail}` : ""}. Open that email to activate your account.`
                : "Open the confirmation email we sent you, or request another link below."}
            </p>
            <p className="text-sm text-gray-500 mb-2">Didn’t get it? Check spam, then request another link.</p>
            <ResendForm initialEmail={resendEmail} onSent={setResendEmail} />
            <Link to="/login" className="text-sm text-burnt-600 hover:underline mt-4 inline-block">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
