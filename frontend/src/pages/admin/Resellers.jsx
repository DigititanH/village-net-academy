import { useState, useEffect, Fragment } from "react";
import { Check, X as XIcon, Download, FileText, ExternalLink } from "lucide-react";
import api, { API_BASE } from "../../lib/api";
import toast from "react-hot-toast";
import {
  ACADEMY_RATE,
  RESELLER_RATE,
  affiliationBadgeClass,
  getResellerAffiliation,
} from "../../lib/resellerAffiliation";

function docHref(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const origin = API_BASE.replace(/\/api\/?$/, "");
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

export default function AdminResellers() {
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const fetchResellers = async () => {
    const res = await api.get("/resellers/admin/all");
    setResellers(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchResellers(); }, []);

  const updateStatus = async (id, status) => {
    try { await api.put(`/resellers/admin/${id}/status`, { status }); toast.success(`Reseller ${status}`); fetchResellers(); } catch { toast.error("Failed"); }
  };

  const downloadReport = (format) => {
    const token = localStorage.getItem("token");
    const url = `${API_BASE}/admin/reports/resellers/${format}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error("fail");
        return r.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `resellers-banking-report.${format === "pdf" ? "txt" : "csv"}`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success(`Reseller banking report downloaded (${format.toUpperCase()})`);
      })
      .catch(() => toast.error("Download failed"));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  const statusColor = (s) => {
    if (s === "approved") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (s === "pending") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    if (s === "rejected") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    return "bg-gray-800 text-gray-300";
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">Resellers ({resellers.length})</h1>
          <p className="text-sm text-gray-400 mt-1">
            Resellers earn {RESELLER_RATE}% on product sales. Independent resellers are linked to Digititan Programme; affiliated resellers share {ACADEMY_RATE}% with their centre.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => downloadReport("csv")} className="btn-secondary text-sm inline-flex items-center gap-2 !py-2 !px-4"><Download size={16} /> CSV</button>
          <button type="button" onClick={() => downloadReport("pdf")} className="btn-primary text-sm inline-flex items-center gap-2 !py-2 !px-4"><FileText size={16} /> PDF</button>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[980px]">
          <thead>
            <tr className="text-left text-gray-500 border-b dark:border-gray-700">
              <th className="pb-3">Name</th>
              <th className="pb-3">Affiliation</th>
              <th className="pb-3">Centre / Programme</th>
              <th className="pb-3">Rate</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Bank</th>
              <th className="pb-3">Docs</th>
              <th className="pb-3">Earnings</th>
              <th className="pb-3">Wallet</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resellers.map((r) => {
              const bank = r.bank || {};
              const hasBank = !!(bank.bank_name || bank.account_number);
              const idHref = docHref(r.id_document_url);
              const proofHref = docHref(r.proof_of_account_url);
              const aff = r.affiliation
                ? {
                    affiliation: r.affiliation,
                    label: r.affiliation_label,
                    centreDisplay: r.centre_display,
                    resellerRate: Number(r.commission_rate ?? r.reseller_rate ?? RESELLER_RATE),
                    centreRate: Number(r.centre_rate ?? ACADEMY_RATE),
                  }
                : getResellerAffiliation(r.academy);
              return (
                <Fragment key={r.id}>
                  <tr className="border-b dark:border-gray-800">
                    <td className="py-3 font-medium">
                      <button type="button" className="text-left hover:text-burnt-500" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                        {r.name}
                      </button>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${affiliationBadgeClass(aff.affiliation)}`}>
                        {aff.label || r.affiliation_label}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400 max-w-[160px]">{aff.centreDisplay || r.centre_display || r.academy || "—"}</td>
                    <td className="py-3 text-xs text-gray-400">
                      {aff.resellerRate}% / {aff.centreRate}%
                    </td>
                    <td className="py-3 text-gray-500">{r.email}</td>
                    <td className="py-3 text-xs text-gray-400">
                      {hasBank ? `${bank.bank_name || "—"} · ****${String(bank.account_number || "").slice(-4)}` : "Not set"}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2 text-xs">
                        {idHref ? (
                          <a href={idHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-burnt-500 hover:underline">
                            ID <ExternalLink size={12} />
                          </a>
                        ) : <span className="text-gray-600">No ID</span>}
                        {proofHref ? (
                          <a href={proofHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-burnt-500 hover:underline">
                            Proof <ExternalLink size={12} />
                          </a>
                        ) : <span className="text-gray-600">No proof</span>}
                      </div>
                    </td>
                    <td className="py-3 text-green-600 font-semibold">R{Number(r.total_earned).toFixed(2)}</td>
                    <td className="py-3">R{Number(r.wallet_balance).toFixed(2)}</td>
                    <td className="py-3"><span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor(r.status)}`}>{r.status}</span></td>
                    <td className="py-3">
                      {r.status === "pending" && (
                        <div className="flex gap-1">
                          <button onClick={() => updateStatus(r.id, "approved")} className="p-1.5 rounded bg-green-100 text-green-600 hover:bg-green-200"><Check size={14} /></button>
                          <button onClick={() => updateStatus(r.id, "rejected")} className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200"><XIcon size={14} /></button>
                        </div>
                      )}
                      {r.status === "approved" && (
                        <button onClick={() => updateStatus(r.id, "suspended")} className="text-xs text-red-500 hover:underline">Suspend</button>
                      )}
                    </td>
                  </tr>
                  {expanded === r.id && (
                    <tr className="border-b dark:border-gray-800 bg-white/5">
                      <td colSpan={11} className="py-3 px-3 text-xs text-gray-300">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <p><span className="text-gray-500">Affiliation:</span> {aff.label}</p>
                          <p><span className="text-gray-500">Centre / Programme:</span> {aff.centreDisplay || r.academy || "—"}</p>
                          <p><span className="text-gray-500">Reseller rate:</span> {aff.resellerRate}%</p>
                          <p><span className="text-gray-500">Centre share:</span> {aff.centreRate}%</p>
                          <p><span className="text-gray-500">Referral:</span> {r.referral_code}</p>
                          <p><span className="text-gray-500">Account holder:</span> {bank.account_name || "—"}</p>
                          <p><span className="text-gray-500">Bank:</span> {bank.bank_name || "—"}</p>
                          <p><span className="text-gray-500">Account #:</span> {bank.account_number || "—"}</p>
                          <p><span className="text-gray-500">Branch:</span> {bank.branch_code || "—"}</p>
                          <p><span className="text-gray-500">Type:</span> {bank.account_type || "—"}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
