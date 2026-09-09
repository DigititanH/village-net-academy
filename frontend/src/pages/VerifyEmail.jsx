import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import api from "../lib/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState(token ? "loading" : "missing");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .get("/auth/verify-email", { params: { token } })
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
            <p className="text-sm text-gray-400 mb-6">{message}. You can now sign in and access courses.</p>
            <Link to="/login" className="btn-primary inline-flex">
              Sign in
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={40} className="mx-auto mb-4 text-red-400" />
            <h1 className="text-xl font-bold mb-2">Confirmation failed</h1>
            <p className="text-sm text-gray-400 mb-6">{message}</p>
            <Link to="/register" className="btn-primary inline-flex">
              Register again
            </Link>
          </>
        )}
        {status === "missing" && (
          <>
            <XCircle size={40} className="mx-auto mb-4 text-red-400" />
            <h1 className="text-xl font-bold mb-2">Missing confirmation link</h1>
            <p className="text-sm text-gray-400 mb-6">
              Open the confirmation email we sent you and click the link to activate your account.
            </p>
            <Link to="/register" className="btn-primary inline-flex">
              Go to Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
