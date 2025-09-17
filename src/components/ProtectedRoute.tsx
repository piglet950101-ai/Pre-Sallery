import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, getUserRole, getActualUserRole } from "@/contexts/AuthContext";
import PermissionDenied from "./PermissionDenied";

const ProtectedRoute = ({ children, role }: { children: ReactNode; role?: string }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [actualUserRole, setActualUserRole] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(false);

  // Get actual user role from database when user is available
  useEffect(() => {
    const fetchActualRole = async () => {
      if (user && role) {
        setIsCheckingRole(true);
        try {
          const roleFromDb = await getActualUserRole(user.id);
          setActualUserRole(roleFromDb);
        } catch (error) {
          console.error("Error fetching actual user role:", error);
        } finally {
          setIsCheckingRole(false);
        }
      }
    };

    fetchActualRole();
  }, [user, role]);

  if (isLoading || isCheckingRole) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role) {
    
    if (actualUserRole !== role) {
      return <PermissionDenied requiredRole={role} userRole={actualUserRole} />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;


