import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types/auth";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

/**
 * Wraps a set of nested routes. Redirects to /login if unauthenticated, and
 * to /unauthorized if authenticated but the role isn't permitted. Frontend
 * gating is a UX convenience only — the backend enforces the real boundary.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading LabelCheck…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
