import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface PublicRouteProps {
  children: ReactNode;
}

// Renders children only when NOT authenticated. If authenticated, redirect to the right dashboard
const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, isLoading } = useAuth();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    const resolveRedirect = async () => {
      if (!user) {
        setRedirectPath(null);
        return;
      }

      // Check actual role from database instead of metadata
      const userId = user.id;
      let actualRole = null;
      
      // Check if user is a company
      const { data: companyData } = await supabase
        .from('companies')
        .select('id, is_approved')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      if (companyData) {
        actualRole = 'company';
        if (!companyData.is_approved) {
          setRedirectPath("/pending-approval");
        } else {
          setRedirectPath("/company");
        }
        return;
      }
      
      // Check if user is an employee
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id, is_active')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      if (employeeData) {
        actualRole = 'employee';
        setRedirectPath("/employee");
        return;
      }
      
      // Check if user is an operator using metadata only
      const metadataRole = (user.app_metadata as any)?.role ?? (user.user_metadata as any)?.role;
      if (metadataRole === 'operator') {
        actualRole = 'operator';
        setRedirectPath("/operator");
        return;
      }

      // If no role found in database, check user metadata as fallback
      const fallbackMetadataRole = (user.app_metadata as any)?.role ?? (user.user_metadata as any)?.role;
      
      if (fallbackMetadataRole === 'operator') {
        actualRole = 'operator';
        setRedirectPath("/operator");
      } else {
        // Default to employee (fallback)
        setRedirectPath("/employee");
      }
    };

    resolveRedirect();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user && redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;


