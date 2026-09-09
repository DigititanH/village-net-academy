import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Landmark, Upload } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

const emptyBank = {
  account_name: "",
  bank_name: "",
  account_number: "",
  branch_code: "",
  account_type: "Cheque",
};

export default function ResellerBanking() {
  const [profile, setProfile] = useState(null);
  const [bank, setBank] = useState(emptyBank);
  const [idFile, setIdFile] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await api.get("/resellers/profile");
      setProfile(res.data);
      const b = res.data.bank || {};
      setBank({
        account_name: b.account_name || "",
        bank_name: b.bank_name || "",
        account_number: b.account_number || "",
        branch_code: b.branch_code || "",
        account_type: b.account_type || "Cheque",
      });
    } catch {
      toast.error("Could not load banking profile");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bank.account_name.trim() || !bank.bank_name.trim() || !bank.account_number.trim() || !bank.branch_code.trim()) {
      return toast.error("Please complete all banking details");
    }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(bank).forEach(([k, v]) => fd.append(k, v));
      if (idFile) fd.append("id_document", idFile);
      if (proofFile) fd.append("proof_of_account", proofFile);

      const res = await api.post("/resellers/profile/banking", fd);
      setProfile(res.data.profile);
      setIdFile(null);
      setProofFile(null);
      toast.success("Banking details saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save banking details");
    }
    setSaving(false);
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
      <div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
          Banking Details
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Save your bank account and upload ID / proof of account so admin can pay your commissions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-burnt-900/30 flex items-center justify-center">
            <Landmark size={18} className="text-burnt-500" />
          </div>
          <h2 className="font-semibold text-lg">Bank account</h2>
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

        <div className="border-t border-white/10 pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-burnt-500" />
            <h3 className="font-semibold">Documents</h3>
          </div>
          <p className="text-xs text-gray-500">Upload PDF or image (max 8MB). Existing files stay until you replace them.</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-300">ID document</label>
              {profile?.id_document_url && (
                <a href={profile.id_document_url} target="_blank" rel="noreferrer" className="text-xs text-burnt-500 hover:underline block mb-2">
                  View current ID document
                </a>
              )}
              <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-white/15 px-3 py-3 text-sm hover:bg-white/5">
                <Upload size={16} />
                <span className="truncate">{idFile ? idFile.name : "Choose ID file"}</span>
                <input
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-300">Proof of bank account</label>
              {profile?.proof_of_account_url && (
                <a href={profile.proof_of_account_url} target="_blank" rel="noreferrer" className="text-xs text-burnt-500 hover:underline block mb-2">
                  View current proof of account
                </a>
              )}
              <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-white/15 px-3 py-3 text-sm hover:bg-white/5">
                <Upload size={16} />
                <span className="truncate">{proofFile ? proofFile.name : "Choose bank proof"}</span>
                <input
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? "Saving..." : "Save banking details"}
          </button>
          <Link to="/reseller/withdraw" className="btn-secondary inline-flex items-center">
            Go to withdraw
          </Link>
        </div>
      </form>
    </div>
  );
}
