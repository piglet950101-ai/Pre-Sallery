import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, getUserRole } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children, role }: { children: ReactNode; role?: string }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Debug logging
  console.log("ProtectedRoute debug:", {
    isLoading,
    user: user ? { id: user.id, email: user.email } : null,
    userRole: user ? getUserRole(user) : null,
    requiredRole: role,
    location: location.pathname
  });

  if (isLoading) {
    console.log("ProtectedRoute: Still loading...");
    return null;
  }

  if (!user) {
    console.log("ProtectedRoute: No user, redirecting to login");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role) {
    const userRole = getUserRole(user);
    console.log("ProtectedRoute: Role check", { userRole, requiredRole: role, match: userRole === role });
    if (userRole !== role) {
      console.log("ProtectedRoute: Role mismatch, redirecting to home");
      return <Navigate to="/" replace />;
    }
  }

  console.log("ProtectedRoute: Access granted");
  return <>{children}</>;
};

export default ProtectedRoute;


