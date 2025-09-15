import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, getUserRole, getActualUserRole } from "@/contexts/AuthContext";
import PermissionDenied from "./PermissionDenied";

const ProtectedRoute = ({ children, role }: { children: ReactNode; role?: string }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [actualUserRole, setActualUserRole] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(false);

  // Debug logging
  console.log("ProtectedRoute debug:", {
    isLoading,
    user: user ? { id: user.id, email: user.email } : null,
    userRole: user ? getUserRole(user) : null,
    actualUserRole,
    requiredRole: role,
    location: location.pathname
  });

  // Get actual user role from database when user is available
  useEffect(() => {
    const fetchActualRole = async () => {
      if (user && role) {
        setIsCheckingRole(true);
        try {
          const roleFromDb = await getActualUserRole(user.id);
          setActualUserRole(roleFromDb);
          console.log("Actual user role from DB:", roleFromDb);
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
    console.log("ProtectedRoute: Still loading...");
    return null;
  }

  if (!user) {
    console.log("ProtectedRoute: No user, redirecting to login");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role) {
    console.log("ProtectedRoute: Role check", { 
      actualUserRole, 
      requiredRole: role, 
      match: actualUserRole === role 
    });
    
    if (actualUserRole !== role) {
      console.log("ProtectedRoute: Role mismatch, showing permission denied");
      return <PermissionDenied requiredRole={role} userRole={actualUserRole} />;
    }
  }

  console.log("ProtectedRoute: Access granted");
  return <>{children}</>;
};

export default ProtectedRoute;


