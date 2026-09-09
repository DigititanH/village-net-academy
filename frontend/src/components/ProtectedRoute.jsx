import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "./DashboardLayout";

function roleAllowed(userRole, requiredRole) {
  if (!requiredRole) return true;
  if (requiredRole === "admin") {
    return userRole === "admin" || userRole === "super_admin";
  }
  return userRole === requiredRole;
}

export default function ProtectedRoute({ children, role, requireAuth = true }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (requireAuth && !user) {
    const redirect = `${location.pathname}${location.search || ""}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }
  if (role && !roleAllowed(user.role, role)) return <Navigate to="/" replace />;

  if (role) {
    return (
      <DashboardLayout role={role}>
        <Outlet />
      </DashboardLayout>
    );
  }

  return children || <Outlet />;
}
