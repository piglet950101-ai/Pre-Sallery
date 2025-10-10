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

      const role = (user.app_metadata as any)?.role ?? (user.user_metadata as any)?.role;
      if (role === "company") {
        try {
          const { data: row } = await supabase
            .from("companies")
            .select("is_approved")
            .eq("auth_user_id", user.id)
            .maybeSingle();
          if (!row || row.is_approved !== true) {
            setRedirectPath("/pending-approval");
          } else {
            setRedirectPath("/company");
          }
        } catch {
          setRedirectPath("/company");
        }
        return;
      }

      if (role === "operator") {
        setRedirectPath("/operator");
        return;
      }

      // Default to employee
      setRedirectPath("/employee");
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


