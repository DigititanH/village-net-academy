import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "./DashboardLayout";
import ResellerPending from "./ResellerPending";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  if (role === "reseller" && user.is_approved !== "approved") {
    return (
      <DashboardLayout role={role}>
        <ResellerPending status={user.is_approved} />
      </DashboardLayout>
    );
  }

  if (role) {
    return (
      <DashboardLayout role={role}>
        <Outlet />
      </DashboardLayout>
    );
  }

  return children || <Outlet />;
}
