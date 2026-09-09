import { Link } from "react-router-dom";
import { Clock, XCircle } from "lucide-react";

export default function ResellerPending({ status = "pending" }) {
  const declined = status === "declined";

  return (
    <div className="text-center py-20 max-w-md mx-auto">
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
          declined ? "bg-red-100 dark:bg-red-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"
        }`}
      >
        {declined ? (
          <XCircle size={32} className="text-red-600" />
        ) : (
          <Clock size={32} className="text-yellow-600" />
        )}
      </div>
      <h2 className="text-xl font-bold mb-2">
        {declined ? "Application Not Approved" : "Account Pending Approval"}
      </h2>
      <p className="text-gray-500 mb-4">
        {declined
          ? "Your reseller application was not approved. Contact support if you have questions."
          : "An admin must approve your reseller account before you can use the dashboard. Refresh this page or sign in again after you are approved."}
      </p>
      {!declined && (
        <Link to="/" className="text-sm text-burnt-600 hover:underline">
          Back to site
        </Link>
      )}
    </div>
  );
}
