import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, CheckCircle, RefreshCw, XCircle } from "lucide-react";

function StatusBadge({ ok, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${
        ok ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
      }`}
    >
      {ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
      {label}
    </span>
  );
}

function CheckCard({ title, check }) {
  if (!check) return null;

  return (
    <section className="card">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h2 className="font-bold text-lg">{title}</h2>
        <StatusBadge ok={check.ok} label={check.ok ? "OK" : "Failed"} />
      </div>
      {check.errors?.length > 0 && (
        <ul className="space-y-2 text-sm text-red-300 mb-3">
          {check.errors.map((err) => (
            <li key={err}>✕ {err}</li>
          ))}
        </ul>
      )}
      {check.missing?.length > 0 && (
        <p className="text-sm text-amber-300 mb-3">Missing: {check.missing.join(", ")}</p>
      )}
      {check.uploads_dir && (
        <p className="text-xs text-gray-400 break-all">Uploads: {check.uploads_dir}</p>
      )}
      {check.name && (
        <p className="text-xs text-gray-400">
          Database: {check.name} @ {check.host}
        </p>
      )}
    </section>
  );
}

export default function Health() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/health", { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPayload(data);
      setCheckedAt(new Date());
    } catch (err) {
      setPayload(null);
      setError(err.message || "Could not reach the API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const overallOk = payload?.status === "ok";

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div>
        <Link to="/" className="text-burnt-600 text-sm hover:underline">
          ← Back to home
        </Link>
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <h1 className="text-3xl font-black bg-gradient-to-r from-burnt-400 to-burnt-600 bg-clip-text text-transparent">
            System health
          </h1>
          {payload && (
            <span
              className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full ${
                overallOk ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
              }`}
            >
              <Activity size={14} />
              {payload.status}
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm mt-2">
          Frontend → API health check. Backend must be running on port 5000.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={load} disabled={loading} className="btn-secondary inline-flex items-center gap-2">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
        {checkedAt && (
          <span className="text-xs text-gray-500">Last checked {checkedAt.toLocaleTimeString()}</span>
        )}
      </div>

      {loading && !payload && !error && <p className="text-gray-400">Loading…</p>}

      {error && (
        <section className="card border-red-500/30">
          <h2 className="font-bold text-lg text-red-300 mb-2">API unreachable</h2>
          <p className="text-sm text-gray-300">{error}</p>
          <p className="text-xs text-gray-500 mt-3">
            From the project root run: <code className="text-burnt-300">npm run dev:backend</code>
          </p>
        </section>
      )}

      {payload && (
        <>
          <section className="card">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Environment</dt>
                <dd className="font-medium">{payload.env}</dd>
              </div>
              <div>
                <dt className="text-gray-500">PHP</dt>
                <dd className="font-medium">{payload.php}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Hosting</dt>
                <dd className="font-medium">{payload.hosting}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Timestamp</dt>
                <dd className="font-medium">{payload.timestamp}</dd>
              </div>
            </dl>
          </section>

          <CheckCard title="PHP extensions" check={payload.checks?.extensions} />
          <CheckCard title="Writable paths" check={payload.checks?.writable} />
          <CheckCard title="Database" check={payload.checks?.database} />
          <CheckCard title="Configuration" check={payload.checks?.config} />

          <section className="card">
            <h2 className="font-bold text-lg mb-3">Raw JSON</h2>
            <pre className="text-xs overflow-auto glass p-4 rounded-xl text-burnt-100/90">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </section>
        </>
      )}
    </div>
  );
}
