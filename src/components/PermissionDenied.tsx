import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, LogOut } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface PermissionDeniedProps {
  requiredRole: string;
  userRole: string | null;
}

const PermissionDenied = ({ requiredRole, userRole }: PermissionDeniedProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const getRoleDisplayName = (role: string | null) => {
    if (!role) return t('common.unknown') ?? 'Unknown';
    switch (role) {
      case 'employee':
        return t('register.employee') ?? 'Employee';
      case 'company':
        return t('register.company') ?? 'Company ';
      case 'operator':
        return t('register.operator') ?? 'Platform Operator';
      default:
        return role;
    }
  };

  const getErrorMessage = () => {
    const userRoleDisplay = getRoleDisplayName(userRole);
    
    switch (requiredRole) {
      case 'employee':
        return t('permission.denied.employee')?.replace('{userRole}', userRoleDisplay) ?? 
          `This page is only accessible to employees. You are currently logged in as a ${userRoleDisplay}.`;
      case 'company':
        return t('permission.denied.company')?.replace('{userRole}', userRoleDisplay) ?? 
          `This page is only accessible to company representatives. You are currently logged in as a ${userRoleDisplay}.`;
      case 'operator':
        return t('permission.denied.operator')?.replace('{userRole}', userRoleDisplay) ?? 
          `This page is only accessible to platform operators. You are currently logged in as a ${userRoleDisplay}.`;
      default:
        return t('permission.denied.message') ?? 'You do not have permission to access this page.';
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant border-0">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">
            {t('permission.denied.title') ?? 'Access Denied'}
          </CardTitle>
          <CardDescription className="text-base">
            {getErrorMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            {t('permission.denied.contactAdmin') ?? 'Please contact your administrator if you believe this is an error.'}
          </div>
          <div className="flex flex-col space-y-2">
            <Button 
              variant="outline" 
              onClick={handleGoBack}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('permission.denied.goBack') ?? 'Go Back'}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('permission.denied.logout') ?? 'Logout'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionDenied;
