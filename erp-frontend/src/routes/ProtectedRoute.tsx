import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but doesn't have permission
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          fontFamily: "sans-serif",
        }}
      >
        <h1>🚫 Access Denied</h1>

        <p>You don't have permission to access this page.</p>

        <button onClick={() => (window.location.href = "/dashboard")}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  return <Outlet />;
}