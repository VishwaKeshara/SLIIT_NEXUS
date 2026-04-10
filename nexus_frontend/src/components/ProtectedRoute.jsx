import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-slate-50 pt-28 text-center text-slate-600">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const userRoles = Array.isArray(user.roles)
    ? user.roles.map((role) => String(role ?? "").trim().toUpperCase().replace(/^ROLE_/, ""))
    : [];
  const requiredRoles = roles?.map((role) => String(role ?? "").trim().toUpperCase().replace(/^ROLE_/, ""));

  if (requiredRoles?.length && !requiredRoles.some((role) => userRoles.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
