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
      
      // If the user is a company, check if they're approved
      if (role === 'company') {
        console.log('Checking company status for user:', data.session.user.id);
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('is_approved, rejection_reason, rejected_at, name')
          .eq('auth_user_id', data.session.user.id)
          .single();
          
        if (companyError) {
          console.error("Error checking company status:", companyError);
          // If we can't check company status, allow login but show warning
          toast({
            title: t('login.warning') ?? 'Advertencia',
            description: t('login.couldNotVerifyCompany') ?? 'No se pudo verificar el estado de la empresa.',
            variant: "destructive"
          });
        } else if (companyData) {
          console.log('Company data:', companyData);
          console.log('Company name:', companyData.name);
          console.log('Is approved:', companyData.is_approved);
          console.log('Rejection reason:', companyData.rejection_reason);
          console.log('Rejected at:', companyData.rejected_at);
          
          if (!companyData.is_approved) {
            // Company is not approved - check if it was rejected
            if (companyData.rejection_reason && companyData.rejection_reason.trim()) {
              // Company was rejected - show rejection reason
              console.log('Company rejected, reason:', companyData.rejection_reason);
              toast({
                title: t('login.companyRejected') ?? 'Empresa Rechazada',
                description: `${t('login.rejectionReason') ?? 'Motivo del rechazo'}: ${companyData.rejection_reason}`,
                variant: "destructive"
              });
              // Sign out the user since they can't access the system
              await supabase.auth.signOut();
              return;
            } else {
              // Company is pending approval
              console.log('Company pending approval');
              toast({
                title: t('login.companyPending') ?? 'Empresa Pendiente de Aprobación',
                description: t('login.companyPendingDesc') ?? 'Su empresa está pendiente de aprobación por parte de un operador. Por favor, espere a ser contactado.',
                variant: "destructive"
              });
              // Sign out the user since they can't access the system
              await supabase.auth.signOut();
              return;
            }
          } else {
            console.log('Company approved, allowing login');
          }
        }
      }
      
      // If the user is an employee, check if they're active and approved
      if (role === 'employee') {
        console.log('Checking employee status for user:', data.session.user.id);
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('is_active, is_approved, rejection_reason, rejected_at, first_name, last_name')
          .eq('auth_user_id', data.session.user.id)
          .single();
          
        if (employeeError) {
          console.error("Error checking employee status:", employeeError);
          toast({
            title: t('login.warning') ?? 'Advertencia',
            description: t('login.couldNotVerifyEmployee') ?? 'No se pudo verificar el estado del empleado.',
            variant: "destructive"
          });
        } else if (employeeData) {
          console.log('Employee data:', employeeData);
          console.log('Employee name:', `${employeeData.first_name} ${employeeData.last_name}`);
          console.log('Is active:', employeeData.is_active);
          console.log('Is approved:', employeeData.is_approved);
          console.log('Rejection reason:', employeeData.rejection_reason);
          
          if (!employeeData.is_active) {
            // Employee is not active - check if they were rejected
            if (employeeData.rejection_reason && employeeData.rejection_reason.trim()) {
              // Employee was rejected - show rejection reason
              console.log('Employee rejected, reason:', employeeData.rejection_reason);
              toast({
                title: t('login.employeeRejected') ?? 'Solicitud Rechazada',
                description: `${t('login.rejectionReason') ?? 'Motivo del rechazo'}: ${employeeData.rejection_reason}`,
                variant: "destructive"
              });
              // Sign out the user since they can't access the system
              await supabase.auth.signOut();
              return;
            } else {
              // Employee is pending approval
              console.log('Employee pending approval');
              toast({
                title: t('login.employeePending') ?? 'Solicitud Pendiente de Aprobación',
                description: t('login.employeePendingDesc') ?? 'Su solicitud está pendiente de aprobación por parte de su empresa. Por favor, espere a ser contactado.',
                variant: "destructive"
              });
              // Sign out the user since they can't access the system
              await supabase.auth.signOut();
              return;
            }
          } else if (!employeeData.is_approved) {
            // Employee is active but not approved - check if they were rejected
            if (employeeData.rejection_reason && employeeData.rejection_reason.trim()) {
              // Employee was rejected - show rejection reason
              console.log('Employee rejected, reason:', employeeData.rejection_reason);
              toast({
                title: t('login.employeeRejected') ?? 'Solicitud Rechazada',
                description: `${t('login.rejectionReason') ?? 'Motivo del rechazo'}: ${employeeData.rejection_reason}`,
                variant: "destructive"
              });
              // Sign out the user since they can't access the system
              await supabase.auth.signOut();
              return;
            } else {
              // Employee is pending approval
              console.log('Employee pending approval');
              toast({
                title: t('login.employeePending') ?? 'Solicitud Pendiente de Aprobación',
                description: t('login.employeePendingDesc') ?? 'Su solicitud está pendiente de aprobación por parte de su empresa. Por favor, espere a ser contactado.',
                variant: "destructive"
              });
              // Sign out the user since they can't access the system
              await supabase.auth.signOut();
              return;
            }
          } else {
            console.log('Employee approved and active, allowing login');
          }
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