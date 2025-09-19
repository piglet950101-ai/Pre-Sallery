import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, getUserRole, getActualUserRole } from "@/contexts/AuthContext";
import PermissionDenied from "./PermissionDenied";
import { supabase } from "@/lib/supabase";

interface EmployeeStatus {
  is_active: boolean;
}

const ProtectedRoute = ({ children, role }: { children: ReactNode; role?: string }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [actualUserRole, setActualUserRole] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [isEmployeeActive, setIsEmployeeActive] = useState<boolean | null>(null);
  const [isCheckingEmployeeStatus, setIsCheckingEmployeeStatus] = useState(false);

  // Get actual user role from database when user is available
  useEffect(() => {
    const fetchActualRole = async () => {
      if (user && role) {
        setIsCheckingRole(true);
        try {
          const roleFromDb = await getActualUserRole(user.id);
          setActualUserRole(roleFromDb);
          
          // If user is an employee, check if they're active
          if (roleFromDb === 'employee') {
            setIsCheckingEmployeeStatus(true);
            const { data, error } = await supabase
              .from('employees')
              .select('is_active')
              .eq('auth_user_id', user.id)
              .single();
              
            if (error) {
              console.error("Error checking employee status:", error);
              setIsEmployeeActive(false);
            } else {
              setIsEmployeeActive((data as EmployeeStatus)?.is_active ?? false);
            }
            setIsCheckingEmployeeStatus(false);
          }
        } catch (error) {
          console.error("Error fetching actual user role:", error);
        } finally {
          setIsCheckingRole(false);
        }
      }
    };

    fetchActualRole();
  }, [user, role]);

  if (isLoading || isCheckingRole || isCheckingEmployeeStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role) {
    // Check if user has the required role
    if (actualUserRole !== role) {
      return <PermissionDenied requiredRole={role} userRole={actualUserRole} />;
    }
    
    // If user is an employee, check if they're active
    if (role === 'employee' && isEmployeeActive === false) {
      return <Navigate to="/pending-approval" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;


