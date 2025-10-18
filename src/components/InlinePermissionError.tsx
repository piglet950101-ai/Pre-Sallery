import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface InlinePermissionErrorProps {
  requiredRole: string;
  userRole: string | null;
}

const InlinePermissionError = ({ requiredRole, userRole }: InlinePermissionErrorProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getRoleDisplayName = (role: string | null) => {
    if (!role) return 'Unknown';
    switch (role) {
      case 'employee':
        return 'Employee';
      case 'company':
        return 'Company';
      case 'operator':
        return 'Platform Operator';
      default:
        return role;
    }
  };

  const getErrorMessage = () => {
    const userRoleDisplay = getRoleDisplayName(userRole);
    
    switch (requiredRole) {
      case 'employee':
        return `This page is only accessible to employees. You are currently logged in as a ${userRoleDisplay}.`;
      case 'company':
        return `This page is only accessible to company representatives. You are currently logged in as a ${userRoleDisplay}.`;
      case 'operator':
        return `This page is only accessible to platform operators. You are currently logged in as a ${userRoleDisplay}.`;
      default:
        return 'You do not have permission to access this page.';
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-base">
            {getErrorMessage()}
          </AlertDescription>
        </Alert>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Please contact your administrator if you believe this is an error.
          </p>
          
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="w-full max-w-xs"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout and Switch Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InlinePermissionError;
