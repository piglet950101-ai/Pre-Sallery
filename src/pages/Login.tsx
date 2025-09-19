import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Building, User, Shield } from "lucide-react";
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
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeePassword, setEmployeePassword] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPassword, setCompanyPassword] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (email: string, password: string, fallbackRedirect: string, roleToSet?: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;


      // Only set metadata if a session exists (email may require confirmation)
      if (roleToSet && data.session) {
        const updateResult = await supabase.auth.updateUser({ data: { role: roleToSet } });
        
        // best-effort company record ensure
        const userId = data.session.user.id;
        if (roleToSet === "company") {
          await ensureCompanyRecord(userId, { email });
        }
        if (roleToSet === "employee") {
          await ensureEmployeeRecord(userId, { email });
        }
      }

      if (!data.session) {
        toast({
          title: t('login.checkEmailTitle') ?? 'Revisa tu correo',
          description: t('login.checkEmailDesc') ?? 'Confirma tu email para completar el inicio de sesión.',
        });
        return;
      }

      // Resolve redirect by role if available
      const role = (data.session.user.app_metadata as any)?.role ?? (data.session.user.user_metadata as any)?.role;
      
      // If the user is an employee, check if they're active
      if (role === 'employee') {
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('is_active')
          .eq('auth_user_id', data.session.user.id)
          .single();
          
        if (employeeError) {
          console.error("Error checking employee status:", employeeError);
        } else if (!employeeData.is_active) {
          // If employee is not active, redirect to pending approval page
          navigate('/pending-approval');
          toast({ title: t('login.success') ?? 'Inicio de sesión exitoso' });
          return;
        }
      }
     
      const pathByRole = role === 'company' ? '/company' : role === 'employee' ? '/employee' : role === 'operator' ? '/operator' : fallbackRedirect;
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
        errorTitle = t('login.incorrectPassword') ?? 'Incorrect Password';
        errorDescription = t('login.incorrectPasswordDesc') ?? 'The password you entered is incorrect. Please try again.';
      } else if (err?.message?.includes('User not found') ||
                 err?.message?.includes('No user found') ||
                 err?.message?.includes('Email not found')) {
        errorTitle = t('login.userNotFound') ?? 'User Not Found';
        errorDescription = t('login.userNotFoundDesc') ?? 'No account found with this email address. Please check your email or create a new account.';
      } else if (err?.message?.includes('Too many requests') ||
                 err?.message?.includes('Rate limit') ||
                 err?.message?.includes('Too many attempts')) {
        errorTitle = t('login.tooManyRequests') ?? 'Too Many Attempts';
        errorDescription = t('login.tooManyRequestsDesc') ?? 'Too many login attempts. Please wait a few minutes before trying again.';
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
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="employee" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="employee" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{t('register.employee')}</span>
                </TabsTrigger>
                <TabsTrigger value="company" className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>{t('register.company')}</span>
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="employee" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee-email">{t('login.email')}</Label>
                  <Input
                    id="employee-email"
                    type="email"
                    placeholder="empleado@ejemplo.com"
                    className="h-12"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-password">{t('login.password')}</Label>
                  <Input
                    id="employee-password"
                    type="password"
                    className="h-12"
                    value={employeePassword}
                    onChange={(e) => setEmployeePassword(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full h-12"
                  variant="premium"
                  disabled={isLoading}
                  onClick={() => signIn(employeeEmail, employeePassword, "/employee", "employee")}
                >
                  {t('login.submit')}
                </Button>
              </TabsContent>

              <TabsContent value="company" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-email">{t('login.email')}</Label>
                  <Input
                    id="company-email"
                    type="email"
                    placeholder="admin@empresa.com"
                    className="h-12"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-password">{t('login.password')}</Label>
                  <Input
                    id="company-password"
                    type="password"
                    className="h-12"
                    value={companyPassword}
                    onChange={(e) => setCompanyPassword(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full h-12"
                  variant="hero"
                  disabled={isLoading}
                  onClick={() => signIn(companyEmail, companyPassword, "/company", "company")}
                >
                  {t('login.submit')}
                </Button>
              </TabsContent>

              <TabsContent value="admin" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">{t('login.email')}</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@presallery.com"
                    className="h-12"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">{t('login.password')}</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    className="h-12"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full h-12"
                  variant="destructive"
                  disabled={isLoading}
                  onClick={() => signIn(adminEmail, adminPassword, "/operator", "operator")}
                >
                  {t('login.submit')}
                </Button>
              </TabsContent>
            </Tabs>

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