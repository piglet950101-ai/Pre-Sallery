import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ensureCompanyRecord, ensureEmployeeRecord } from "@/lib/profile";

const Login = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle Enter key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      signIn();
    }
  };

  // Helper function to check if email exists in any role table
  const checkEmailExists = async (email: string) => {
    try {
      // Check in companies table
      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (companyData) return true;
      
      // Check in employees table
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (employeeData) return true;
      
      // Check in operators table
      const { data: operatorData } = await supabase
        .from('operators')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      return !!operatorData;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    }
  };

  const signIn = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (!data.session) {
        toast({
          title: t('login.checkEmailTitle') ?? 'Revisa tu correo',
          description: t('login.checkEmailDesc') ?? 'Confirma tu email para completar el inicio de sesión.',
        });
        return;
      }

      // Automatically detect user role from database
      const userId = data.session.user.id;
      let actualRole = null;
      
      // Check if user is a company
      const { data: companyData } = await supabase
        .from('companies')
        .select('id, is_approved')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      if (companyData) {
        actualRole = 'company';
        console.log('User is a company, is_approved:', companyData.is_approved);
      } else {
        // Check if user is an employee
        const { data: employeeData } = await supabase
          .from('employees')
          .select('id, is_active')
          .eq('auth_user_id', userId)
          .maybeSingle();
        
        if (employeeData) {
          actualRole = 'employee';
          console.log('User is an employee, is_active:', employeeData.is_active);
        } else {
          // Check if user is an operator (admin)
          const { data: operatorData } = await supabase
            .from('operators')
            .select('id')
            .eq('auth_user_id', userId)
            .maybeSingle();
          
          if (operatorData) {
            actualRole = 'operator';
          }
        }
      }

      // If no role found in database, check user metadata as fallback
      if (!actualRole) {
        console.log('No role found in database, checking user metadata...');
        const metadataRole = (data.session.user.app_metadata as any)?.role ?? (data.session.user.user_metadata as any)?.role;
        console.log('Metadata role:', metadataRole);
        
        if (metadataRole === 'operator') {
          actualRole = 'operator';
          console.log('Found operator role in metadata');
        } else {
          await supabase.auth.signOut();
          toast({
            title: t('login.noRoleFound') ?? 'Account Not Found',
            description: t('login.noRoleFoundDesc') ?? 'No account found for this email. Please register first.',
            variant: 'destructive'
          });
          return;
        }
      }

      // Update metadata with actual role
      if (data.session) {
        const updateResult = await supabase.auth.updateUser({ data: { role: actualRole } });
        
        // best-effort company record ensure
        if (actualRole === "company") {
          await ensureCompanyRecord(userId, { email });
        }
        if (actualRole === "employee") {
          await ensureEmployeeRecord(userId, { email });
        }
      }

      // Handle company approval status
      if (actualRole === 'company') {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('is_approved, rejection_reason, rejected_at, name')
          .eq('auth_user_id', data.session.user.id)
          .single();
          
        if (companyError) {
          console.error("Error checking company status:", companyError);
          toast({
            title: t('login.warning') ?? 'Advertencia',
            description: t('login.couldNotVerifyCompany') ?? 'No se pudo verificar el estado de la empresa.',
            variant: "destructive"
          });
        } else if (companyData) {
          if (!companyData.is_approved) {
            // Company is not approved - check if it was rejected
            if (companyData.rejection_reason && companyData.rejection_reason.trim()) {
              // Company was rejected - show rejection reason
              toast({
                title: t('login.companyRejected') ?? 'Empresa Rechazada',
                description: `${t('login.rejectionReason') ?? 'Motivo del rechazo'}: ${companyData.rejection_reason}`,
                variant: "destructive"
              });
              await supabase.auth.signOut();
              return;
            }
            // Company pending approval: allow login but will be redirected to pending approval page
          }
        }
      }
      
      // Handle employee status
      if (actualRole === 'employee') {
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('is_active, is_approved, rejection_reason, rejected_at, first_name, last_name')
          .eq('auth_user_id', data.session.user.id)
          .maybeSingle();
          
        if (employeeError) {
          console.error("Error checking employee status:", employeeError);
          toast({
            title: t('login.warning') ?? 'Advertencia',
            description: t('login.couldNotVerifyEmployee') ?? 'No se pudo verificar el estado del empleado.',
            variant: "destructive"
          });
        } else if (employeeData) {
          // If rejected, block access
          if (employeeData && employeeData.rejection_reason && employeeData.rejection_reason.trim()) {
            toast({
              title: t('login.employeeRejected') ?? 'Solicitud Rechazada',
              description: `${t('login.rejectionReason') ?? 'Motivo del rechazo'}: ${employeeData.rejection_reason}`,
              variant: "destructive"
            });
            await supabase.auth.signOut();
            return;
          }
          // If pending or not approved, allow login but inform user to complete onboarding
          if (employeeData && (!employeeData.is_active || !employeeData.is_approved)) {
            toast({
              title: t('login.employeePending') ?? 'Solicitud Pendiente de Aprobación',
              description: t('login.employeePendingDesc') ?? 'Su solicitud está pendiente de aprobación por parte de su empresa. Continúe con el cambio de contraseña y la carga de la cédula.',
            });
          }
        }
      }
      
      // Redirect based on detected role
      const pathByRole = actualRole === 'company' ? '/company' : actualRole === 'employee' ? '/employee' : actualRole === 'operator' ? '/operator' : '/login';
      navigate(pathByRole);
      toast({ title: t('login.success') ?? 'Inicio de sesión exitoso' });
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Check for specific error types
      let errorTitle = t('login.errorTitle');
      let errorDescription = err?.message ?? t('login.errorDescription');
      
      // Handle specific error types
      if (err?.message?.includes('Invalid login credentials') || 
          err?.message?.includes('Invalid credentials') ||
          err?.message?.includes('Wrong password') ||
          err?.message?.includes('incorrect password') ||
          err?.message?.includes('Invalid password') ||
          err?.status === 400) {
        
        // Check if email exists to determine if it's wrong email or wrong password
        const emailExists = await checkEmailExists(email);
        
        if (emailExists) {
          errorTitle = t('login.invalidCredentials') ?? 'Wrong Password';
          errorDescription = t('login.invalidCredentialsDesc') ?? 'The password you entered is incorrect. Please try again.';
        } else {
          errorTitle = t('login.userNotFound') ?? 'Email Not Found';
          errorDescription = t('login.userNotFoundDesc') ?? 'No account found with this email address. Please check your email or create a new account.';
        }
      } else if (err?.message?.includes('User not found') ||
                 err?.message?.includes('No user found') ||
                 err?.message?.includes('Email not found') ||
                 err?.message?.includes('Invalid email') ||
                 err?.message?.includes('User does not exist')) {
        errorTitle = t('login.userNotFound') ?? 'Email Not Found';
        errorDescription = t('login.userNotFoundDesc') ?? 'No account found with this email address. Please check your email or create a new account.';
      } else if (err?.message?.includes('Too many requests') ||
                 err?.message?.includes('Rate limit') ||
                 err?.message?.includes('Too many attempts') ||
                 err?.message?.includes('Rate limit exceeded')) {
        errorTitle = t('login.tooManyRequests') ?? 'Too Many Attempts';
        errorDescription = t('login.tooManyRequestsDesc') ?? 'Too many login attempts. Please wait a few minutes before trying again.';
      } else if (err?.message?.includes('Email not confirmed') ||
                 err?.message?.includes('Please confirm your email')) {
        errorTitle = t('login.emailNotConfirmed') ?? 'Email Not Confirmed';
        errorDescription = t('login.emailNotConfirmedDesc') ?? 'Please check your email and click the confirmation link before signing in.';
      } else if (err?.message?.includes('Network error') ||
                 err?.message?.includes('Failed to fetch') ||
                 err?.message?.includes('Connection failed')) {
        errorTitle = t('login.networkError') ?? 'Network Error';
        errorDescription = t('login.networkErrorDesc') ?? 'Please check your internet connection and try again.';
      } else if (err?.message?.includes('Server error') ||
                 err?.message?.includes('Internal server error') ||
                 err?.status >= 500) {
        errorTitle = t('login.serverError') ?? 'Server Error';
        errorDescription = t('login.serverErrorDesc') ?? 'There was a server error. Please try again later.';
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <Link to="/" className="flex items-center justify-center space-x-3">
            <div className="h-16 w-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-800">AvancePay</span>
          </Link>
          <p className="text-gray-600 text-lg">{t('login.subtitle')}</p>
        </div>

        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center text-gray-800 font-semibold">{t('login.title')}</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4" onKeyDown={handleKeyPress}>
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('login.password')}</Label>
              <Input
                id="password"
                type="password"
                className="h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              className="w-full h-12"
              variant="default"
              disabled={isLoading}
              onClick={signIn}
            >
              {isLoading ? 'Signing in...' : t('login.submit')}
            </Button>

            <div className="text-center space-y-2">
              <Button variant="link" className="text-sm" asChild>
                <Link to="/forgot-password">{t('login.forgot')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-muted-foreground">
            {t('login.noAccount')}{" "}
            <Button variant="link" className="p-0" asChild>
              <Link to="/register">{t('login.signUp')}</Link>
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;