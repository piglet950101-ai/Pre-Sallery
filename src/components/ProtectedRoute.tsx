import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, getUserRole } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children, role }: { children: ReactNode; role?: string }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role) {
    const userRole = getUserRole(user);
    if (userRole !== role) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;


