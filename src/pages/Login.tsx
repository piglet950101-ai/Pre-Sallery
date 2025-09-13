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
      console.log("Login attempt:", { email, roleToSet, fallbackRedirect });
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      console.log("Login successful, session:", data.session);

      // Only set metadata if a session exists (email may require confirmation)
      if (roleToSet && data.session) {
        console.log("Setting role:", roleToSet);
        const updateResult = await supabase.auth.updateUser({ data: { role: roleToSet } });
        console.log("Role update result:", updateResult);
        
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
      console.log("Final role check:", { 
        app_metadata_role: (data.session.user.app_metadata as any)?.role,
        user_metadata_role: (data.session.user.user_metadata as any)?.role,
        final_role: role 
      });
      
      const pathByRole = role === 'company' ? '/company' : role === 'employee' ? '/employee' : role === 'operator' ? '/operator' : fallbackRedirect;
      console.log("Redirecting to:", pathByRole);
      navigate(pathByRole);
      toast({ title: t('login.successTitle') ?? 'Inicio de sesión exitoso' });
    } catch (err: any) {
      console.error("Login error:", err);
      toast({
        title: t('login.errorTitle') ?? 'Error al iniciar sesión',
        description: err?.message ?? 'Revisa tus credenciales',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <Link to="/" className="flex items-center justify-center space-x-2">
            <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">AvancePay</span>
          </Link>
          <p className="text-muted-foreground">{t('login.subtitle')}</p>
        </div>

        <Card className="shadow-elegant border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{t('login.title')}</CardTitle>
            <CardDescription className="text-center">
              {t('login.subtitle')}
            </CardDescription>
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
                <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
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