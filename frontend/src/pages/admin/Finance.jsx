import { useEffect, useMemo, useState } from "react";
import { Building2, Check, DollarSign, Wallet, X as XIcon, Download, FileText } from "lucide-react";
import api, { API_BASE } from "../../lib/api";
import toast from "react-hot-toast";
import {
  ACADEMY_RATE,
  RESELLER_RATE,
  affiliationBadgeClass,
  getResellerAffiliation,
} from "../../lib/resellerAffiliation";

function parseBank(raw) {
  try {
    return typeof raw === "string" ? JSON.parse(raw || "{}") : raw || {};
  } catch {
    return {};
  }
}

export default function AdminFinance() {
  const [resellers, setResellers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [r, w, a] = await Promise.all([
        api.get("/resellers/admin/all"),
        api.get("/resellers/admin/withdrawals"),
        api.get("/resellers/admin/academy-earnings"),
      ]);
      setResellers(r.data || []);
      setWithdrawals(w.data || []);
      setAcademies(a.data || []);
    } catch {
      toast.error("Could not load finance data");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const requestedByReseller = useMemo(() => {
    const map = {};
    for (const w of withdrawals) {
      if (w.status !== "pending" && w.status !== "approved") continue;
      const key = w.reseller_id;
      map[key] = (map[key] || 0) + Number(w.amount || 0);
    }
    return map;
  }, [withdrawals]);

  const totals = useMemo(() => {
    const earned = resellers.reduce((sum, r) => sum + Number(r.total_earned || 0), 0);
    const wallets = resellers.reduce((sum, r) => sum + Number(r.wallet_balance || 0), 0);
    const pending = withdrawals
      .filter((w) => w.status === "pending" || w.status === "approved")
      .reduce((sum, w) => sum + Number(w.amount || 0), 0);
    const academyDue = academies.reduce((sum, a) => sum + Number(a.academy_due || 0), 0);
    return { earned, wallets, pending, academyDue };
  }, [resellers, withdrawals, academies]);

  const updateWithdrawal = async (id, status) => {
    try {
      await api.put(`/resellers/admin/withdrawals/${id}`, { status });
      toast.success(`Withdrawal ${status}`);
      load();
    } catch {
      toast.error("Update failed");
    }
  };

  const downloadResellerReport = (format) => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/admin/reports/resellers/${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
            Finance
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Track reseller earnings ({RESELLER_RATE}%), centre payouts ({ACADEMY_RATE}% of linked sales), and withdrawal requests (minimum R100).
            Independent resellers are linked to Digititan Programme automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => downloadResellerReport("csv")} className="btn-secondary text-sm inline-flex items-center gap-2 !py-2 !px-4">
            <Download size={16} /> Resellers CSV
          </button>
          <button type="button" onClick={() => downloadResellerReport("pdf")} className="btn-primary text-sm inline-flex items-center gap-2 !py-2 !px-4">
            <FileText size={16} /> Resellers PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-900/30 rounded-xl flex items-center justify-center">
            <DollarSign size={22} className="text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Reseller Earnings</p>
            <p className="text-xl font-bold">R{totals.earned.toFixed(2)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-900/30 rounded-xl flex items-center justify-center">
            <Building2 size={22} className="text-sky-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Centre / Programme Payouts Due ({ACADEMY_RATE}%)</p>
            <p className="text-xl font-bold text-sky-400">R{totals.academyDue.toFixed(2)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-burnt-900/30 rounded-xl flex items-center justify-center">
            <Wallet size={22} className="text-burnt-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Open Wallet Balances</p>
            <p className="text-xl font-bold">R{totals.wallets.toFixed(2)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-900/30 rounded-xl flex items-center justify-center">
            <DollarSign size={22} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Requested Withdrawals</p>
            <p className="text-xl font-bold text-yellow-400">R{totals.pending.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-semibold text-lg mb-1">Centre / Programme earnings</h2>
        <p className="text-xs text-gray-500 mb-4">
          Each centre (or Digititan Programme for independent resellers) receives {ACADEMY_RATE}% of sales made by linked resellers. Resellers earn {RESELLER_RATE}%.
        </p>
        {!academies.length ? (
          <p className="text-sm text-gray-500">No centres linked to resellers yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-white/10">
                <th className="pb-3">Centre / Programme</th>
                <th className="pb-3">Resellers</th>
                <th className="pb-3">Sales Total</th>
                <th className="pb-3">Reseller Commission</th>
                <th className="pb-3">Centre Should Receive ({ACADEMY_RATE}%)</th>
              </tr>
            </thead>
            <tbody>
              {academies.map((a) => (
                <tr key={a.academy} className="border-b border-white/5">
                  <td className="py-3 font-medium">{a.academy}</td>
                  <td className="py-3 text-gray-400">{a.reseller_count}</td>
                  <td className="py-3">R{Number(a.sales_total || 0).toFixed(2)}</td>
                  <td className="py-3 text-green-500">R{Number(a.reseller_commission_total || 0).toFixed(2)}</td>
                  <td className="py-3 font-bold text-sky-400 text-base">
                    R{Number(a.academy_due || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-semibold text-lg mb-4">Reseller Earnings</h2>
        {!resellers.length ? (
          <p className="text-sm text-gray-500">No resellers yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-white/10">
                <th className="pb-3">Reseller</th>
                <th className="pb-3">Affiliation</th>
                <th className="pb-3">Centre / Programme</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Rate</th>
                <th className="pb-3">Total Earned</th>
                <th className="pb-3">Wallet</th>
                <th className="pb-3">Requested</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {resellers.map((r) => {
                const requested = requestedByReseller[r.id] || 0;
                const aff = r.affiliation
                  ? {
                      affiliation: r.affiliation,
                      label: r.affiliation_label,
                      centreDisplay: r.centre_display,
                      resellerRate: Number(r.commission_rate ?? r.reseller_rate ?? RESELLER_RATE),
                    }
                  : getResellerAffiliation(r.academy);
                return (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="py-3 font-medium">{r.name}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${affiliationBadgeClass(aff.affiliation)}`}>
                        {aff.label}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400 max-w-[160px]">{aff.centreDisplay || r.academy || "—"}</td>
                    <td className="py-3 text-gray-500">{r.email}</td>
                    <td className="py-3">{aff.resellerRate}%</td>
                    <td className="py-3 text-green-500 font-semibold">R{Number(r.total_earned || 0).toFixed(2)}</td>
                    <td className="py-3">R{Number(r.wallet_balance || 0).toFixed(2)}</td>
                    <td className={`py-3 font-semibold ${requested > 0 ? "text-yellow-400" : "text-gray-500"}`}>
                      R{requested.toFixed(2)}
                    </td>
                    <td className="py-3 capitalize text-gray-400">{r.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-semibold text-lg mb-4">Withdrawal Requests</h2>
        {!withdrawals.length ? (
          <p className="text-sm text-gray-500">No withdrawal requests yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-white/10">
                <th className="pb-3">Reseller</th>
                <th className="pb-3">Requested Amount</th>
                <th className="pb-3">Banking Details</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => {
                const bank = parseBank(w.bank_details);
                return (
                  <tr key={w.id} className="border-b border-white/5 align-top">
                    <td className="py-3">
                      <p className="font-medium">{w.name}</p>
                      <p className="text-xs text-gray-500">{w.email}</p>
                      <p className="text-xs text-gray-500 font-mono">{w.referral_code}</p>
                    </td>
                    <td className="py-3 font-bold text-yellow-400 text-base">R{Number(w.amount).toFixed(2)}</td>
                    <td className="py-3 text-gray-400 text-xs space-y-0.5">
                      <p>{bank.account_name || "—"}</p>
                      <p>{bank.bank_name || "—"} · {bank.account_type || "—"}</p>
                      <p>Acc: {bank.account_number || "—"}</p>
                      <p>Branch: {bank.branch_code || "—"}</p>
                    </td>
                    <td className="py-3 capitalize">{w.status}</td>
                    <td className="py-3 text-gray-500">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      {w.status === "pending" && (
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => updateWithdrawal(w.id, "approved")}
                            className="p-1.5 rounded bg-green-100 text-green-700 hover:bg-green-200"
                            title="Approve"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateWithdrawal(w.id, "completed")}
                            className="text-xs px-2 py-1 rounded bg-burnt-800/40 text-burnt-600 hover:bg-burnt-800/60"
                          >
                            Mark paid
                          </button>
                          <button
                            type="button"
                            onClick={() => updateWithdrawal(w.id, "rejected")}
                            className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200"
                            title="Reject (refund wallet)"
                          >
                            <XIcon size={14} />
                          </button>
                        </div>
                      )}
                      {w.status === "approved" && (
                        <button
                          type="button"
                          onClick={() => updateWithdrawal(w.id, "completed")}
                          className="text-xs px-2 py-1 rounded bg-burnt-800/40 text-burnt-600 hover:bg-burnt-800/60"
                        >
                          Mark paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
