import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DollarSign, Landmark } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

const MIN_WITHDRAWAL = 100;

const emptyBank = {
  account_name: "",
  bank_name: "",
  account_number: "",
  branch_code: "",
  account_type: "Cheque",
};

export default function ResellerWithdraw() {
  const [profile, setProfile] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState(emptyBank);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [p, w] = await Promise.all([
        api.get("/resellers/profile"),
        api.get("/resellers/withdrawals"),
      ]);
      setProfile(p.data);
      setWithdrawals(w.data || []);
    } catch {
      toast.error("Could not load wallet details");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value < MIN_WITHDRAWAL) {
      return toast.error(`Minimum withdrawal is R${MIN_WITHDRAWAL}`);
    }
    if (value > Number(profile?.wallet_balance || 0)) {
      return toast.error("Insufficient wallet balance");
    }
    if (!bank.account_name.trim() || !bank.bank_name.trim() || !bank.account_number.trim() || !bank.branch_code.trim()) {
      return toast.error("Please complete all banking details");
    }

    setSubmitting(true);
    try {
      await api.post("/resellers/withdraw", {
        amount: value,
        bank_details: {
          account_name: bank.account_name.trim(),
          bank_name: bank.bank_name.trim(),
          account_number: bank.account_number.trim(),
          branch_code: bank.branch_code.trim(),
          account_type: bank.account_type,
        },
      });
      toast.success("Withdrawal request submitted");
      setAmount("");
      setBank(emptyBank);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Withdrawal failed");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile || profile.status !== "approved") {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400">Your reseller account must be approved before you can withdraw.</p>
        <Link to="/reseller/dashboard" className="text-burnt-600 font-semibold hover:underline mt-4 inline-block">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const balance = Number(profile.wallet_balance || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
          Withdraw Earnings
        </h1>
        <p className="text-sm text-gray-400 mt-1">Minimum withdrawal is R{MIN_WITHDRAWAL}. Enter your banking details to request payment.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-900/30 rounded-xl flex items-center justify-center">
            <DollarSign size={22} className="text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Available Wallet</p>
            <p className="text-xl font-bold">R{balance.toFixed(2)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-burnt-900/30 rounded-xl flex items-center justify-center">
            <Landmark size={22} className="text-burnt-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Earned</p>
            <p className="text-xl font-bold">R{Number(profile.total_earned || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <h2 className="font-semibold text-lg">Request Withdrawal</h2>

        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-300">Amount (ZAR) *</label>
          <input
            type="number"
            min={MIN_WITHDRAWAL}
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field"
            placeholder={`Minimum R${MIN_WITHDRAWAL}`}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-300">Account holder name *</label>
            <input
              type="text"
              required
              value={bank.account_name}
              onChange={(e) => setBank({ ...bank, account_name: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-300">Bank name *</label>
            <input
              type="text"
              required
              value={bank.bank_name}
              onChange={(e) => setBank({ ...bank, bank_name: e.target.value })}
              className="input-field"
              placeholder="e.g. FNB, Capitec, Standard Bank"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-300">Account number *</label>
            <input
              type="text"
              required
              value={bank.account_number}
              onChange={(e) => setBank({ ...bank, account_number: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-300">Branch code *</label>
            <input
              type="text"
              required
              value={bank.branch_code}
              onChange={(e) => setBank({ ...bank, branch_code: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-300">Account type</label>
            <select
              value={bank.account_type}
              onChange={(e) => setBank({ ...bank, account_type: e.target.value })}
              className="input-field"
            >
              <option value="Cheque">Cheque</option>
              <option value="Savings">Savings</option>
              <option value="Transmission">Transmission</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={submitting || balance < MIN_WITHDRAWAL} className="btn-primary">
          {submitting ? "Submitting..." : "Submit Withdrawal Request"}
        </button>
        {balance < MIN_WITHDRAWAL && (
          <p className="text-xs text-yellow-400">You need at least R{MIN_WITHDRAWAL} in your wallet to withdraw.</p>
        )}
      </form>

      <div className="card overflow-x-auto">
        <h2 className="font-semibold text-lg mb-4">Withdrawal History</h2>
        {!withdrawals.length ? (
          <p className="text-sm text-gray-500">No withdrawal requests yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-white/10">
                <th className="pb-3">Amount</th>
                <th className="pb-3">Bank</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => {
                let bankInfo = {};
                try {
                  bankInfo = typeof w.bank_details === "string" ? JSON.parse(w.bank_details || "{}") : w.bank_details || {};
                } catch {
                  bankInfo = {};
                }
                return (
                  <tr key={w.id} className="border-b border-white/5">
                    <td className="py-3 font-semibold">R{Number(w.amount).toFixed(2)}</td>
                    <td className="py-3 text-gray-400">
                      {bankInfo.bank_name || "—"}
                      {bankInfo.account_number ? ` · ****${String(bankInfo.account_number).slice(-4)}` : ""}
                    </td>
                    <td className="py-3">
                      <span className="text-xs px-2 py-1 rounded-full capitalize bg-white/5">{w.status}</span>
                    </td>
                    <td className="py-3 text-gray-500">{new Date(w.created_at).toLocaleDateString()}</td>
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
