import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Building, User, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ensureCompanyRecord } from "@/lib/profile";

const Register = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPassword, setCompanyPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyRif, setCompanyRif] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Employee signup state
  const [activationCode, setActivationCode] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeePhone, setEmployeePhone] = useState("");
  const [employeePassword, setEmployeePassword] = useState("");
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(false);

  const signUpCompany = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({

        email: companyEmail,
        password: companyPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            role: 'company',
            company_name: companyName,     // required (NOT NULL)
            company_rif: companyRif,       // required (UNIQUE, NOT NULL)
            company_address: companyAddress,
            company_phone: companyPhone,
          }
        }
        // options: {
        // },
      });
      if (error) throw error;
      if (data.user) {
        // attempt to create company row immediately if session present
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          // ensure the role is stored on the user metadata
          await supabase.auth.updateUser({ data: { role: 'company' } });
          await ensureCompanyRecord(data.user.id, {
            name: companyName,
            rif: companyRif,
            address: companyAddress,
            phone: companyPhone,
            email: companyEmail,
          });
        }
      }
      toast({ title: t('register.successTitle') });
      navigate('/login');
    } catch (err: any) {
      toast({
        title: t('register.errorTitle'),
        description: err?.message ?? t('register.tryAgain'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signUpEmployee = async () => {
    try {
      setIsLoadingEmployee(true);
      
      // Clean and normalize inputs
      const cleanActivationCode = activationCode.trim().replace(/[^0-9]/g, ''); // Remove all non-numeric characters
      const cleanEmail = employeeEmail.trim().toLowerCase();
      
      // Validate activation code format
      if (cleanActivationCode.length !== 6) {
        throw new Error(t('register.activationCode6Digits'));
      }
      
      // Validate email format (very permissive - just check for @ and .)
      console.log("🔍 Email validation check:", {
        originalEmail: employeeEmail,
        cleanedEmail: cleanEmail,
        hasAt: cleanEmail.includes('@'),
        hasDot: cleanEmail.includes('.')
      });
      
      if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        console.error("❌ Email validation failed:", {
          originalEmail: employeeEmail,
          cleanedEmail: cleanEmail
        });
        throw new Error(t('register.invalidEmailFormat').replace('{email}', employeeEmail));
      }
      
      // Additional check: make sure there's at least one character before @ and after .
      const emailParts = cleanEmail.split('@');
      console.log("🔍 Email parts analysis:", {
        emailParts: emailParts,
        partsLength: emailParts.length,
        beforeAtLength: emailParts[0]?.length || 0,
        afterAtHasDot: emailParts[1]?.includes('.') || false
      });
      
      if (emailParts.length !== 2 || emailParts[0].length === 0 || !emailParts[1].includes('.')) {
        console.error("❌ Email validation failed - invalid structure:", {
          originalEmail: employeeEmail,
          cleanedEmail: cleanEmail,
          emailParts: emailParts
        });
        throw new Error(t('register.invalidEmailFormat').replace('{email}', employeeEmail));
      }
      
      // Debug: Log the inputs
      console.log("Original Activation Code:", activationCode);
      console.log("Cleaned Activation Code:", cleanActivationCode);
      console.log("Original Employee Email:", employeeEmail);
      console.log("Cleaned Employee Email:", cleanEmail);
      
      // Check activation code and email directly
      console.log("🔍 Looking up employee with:", {
        activationCode: cleanActivationCode,
        employeeEmail: cleanEmail
      });
      
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("id, company_id, first_name, last_name, email, activation_code, is_active")
        .eq("activation_code", cleanActivationCode)
        .eq("email", cleanEmail)
        .single();
      
      console.log("📊 Employee lookup result:", employeeData);
      console.log("❌ Employee lookup error:", employeeError);
      
      // Additional debugging: check if employee exists with just email
      if (employeeError && employeeError.code === 'PGRST116') {
        console.log("🔍 No exact match found, checking if email exists...");
        const { data: emailCheck, error: emailError } = await supabase
          .from("employees")
          .select("email, activation_code")
          .eq("email", cleanEmail)
          .single();
        
        console.log("📧 Email check result:", emailCheck);
        console.log("📧 Email check error:", emailError);
        
        if (emailCheck) {
          console.log("⚠️ Email exists but activation code doesn't match");
          console.log("Expected code:", activationCode);
          console.log("Actual code:", emailCheck.activation_code);
        }
      }
      
      if (employeeError) {
        if (employeeError.code === 'PGRST116') {
          // No rows found
          throw new Error(t('register.invalidActivationOrEmail'));
        }
        console.error("Error checking employee:", employeeError);
        throw new Error(`Error checking data: ${employeeError.message}`);
      }
      
      if (!employeeData) {
        throw new Error(t('register.invalidActivationOrEmail'));
      }
      
      if (employeeData.is_active) {
        throw new Error(t('register.accountAlreadyActivated'));
      }
      
      // Create Supabase auth user
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: employeePassword,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            role: 'employee',
            employee_id: employeeData.id,
            company_id: employeeData.company_id
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Update employee record with auth_user_id and activate account
        console.log("Updating employee record:", {
          id: employeeData.id,
          auth_user_id: data.user.id,
          is_active: true,
          phone: employeePhone
        });
        
        // Try to update the employee record
        const { error: updateError } = await supabase
          .from("employees")
          .update({
            auth_user_id: data.user.id,
            is_active: true,
            phone: employeePhone,
            updated_at: new Date().toISOString()
          })
          .eq("id", employeeData.id)
          .select(); // Add select to get the updated record
        
        if (updateError) {
          console.error("Error updating employee record:", updateError);
          console.error("Update error details:", {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint
          });
          
          // Try alternative approach - call a function
          try {
            const { error: functionError } = await supabase.functions.invoke('activate-employee', {
              body: {
                employee_id: employeeData.id,
                auth_user_id: data.user.id,
                phone: employeePhone
              }
            });
            
            if (functionError) {
              console.error("Function error:", functionError);
              throw new Error('Could not activate employee account. Contact support.');
            } else {
              console.log("Employee activated via function");
            }
          } catch (funcErr) {
            console.error("Function call failed:", funcErr);
            throw new Error('Could not activate employee account. Contact support.');
          }
        } else {
          console.log("Employee record updated successfully - is_active set to true");
        }
      }
      
      toast({
        title: t('register.employeeActivatedTitle'),
        description: t('register.employeeActivatedDesc').replace('{name}', `${employeeData.first_name} ${employeeData.last_name}`),
      });
      
      navigate('/login');
    } catch (err: any) {
      toast({
        title: t('register.activateErrorTitle'),
        description: err?.message ?? t('register.tryAgain'),
        variant: "destructive"
      });
    } finally {
      setIsLoadingEmployee(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-2xl space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <Link to="/" className="flex items-center justify-center space-x-2">
            <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">AvancePay</span>
          </Link>
          <p className="text-muted-foreground">{t('register.subtitle')}</p>
        </div>

        <Card className="shadow-elegant border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{t('register.title')}</CardTitle>
            <CardDescription className="text-center">
              {t('register.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="company" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="company" className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>{t('register.companyTab')}</span>
                </TabsTrigger>
                <TabsTrigger value="employee" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{t('register.employeeTab')}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="company" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nombre de la empresa</Label>
                    <Input
                      id="company-name"
                      placeholder={t('register.companyNamePlaceholder')}
                      className="h-12"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-rif">RIF</Label>
                    <Input
                      id="company-rif"
                      placeholder="J-12345678-9"
                      className="h-12"
                      value={companyRif}
                      onChange={(e) => setCompanyRif(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-address">Dirección</Label>
                  <Textarea
                    id="company-address"
                    placeholder="Dirección completa de la empresa"
                    className="min-h-[80px]"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-email">{t('register.companyEmailLabel')}</Label>
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
                    <Label htmlFor="company-phone">Teléfono</Label>
                    <Input
                      id="company-phone"
                      placeholder="+58 212 123-4567"
                      className="h-12"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-password">{t('register.companyPasswordLabel')}</Label>
                  <Input
                    id="company-password"
                    type="password"
                    className="h-12"
                    value={companyPassword}
                    onChange={(e) => setCompanyPassword(e.target.value)}
                  />
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold text-sm">Beneficios incluidos:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>30 días gratis sin compromiso</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Dashboard empresarial completo</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Soporte técnico incluido</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full h-12"
                  variant="hero"
                  disabled={isLoading}
                  onClick={signUpCompany}
                >
                  {t('register.createCompanyButton')}
                </Button>
              </TabsContent>

              <TabsContent value="employee" className="space-y-4">
                <div className="bg-secondary/20 border border-secondary/30 p-4 rounded-lg text-center">
                  <User className="h-8 w-8 text-secondary mx-auto mb-2" />
                  <h4 className="font-semibold text-secondary-foreground">{t('register.inviteTitle')}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('register.inviteDescription')}
                    recibirás un enlace de activación por SMS o email.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="activation-code">Código de activación</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="activation-code"
                        placeholder="Ingresa tu código de activación"
                        className="h-12"
                        value={activationCode}
                        onChange={(e) => setActivationCode(e.target.value)}
                      />
                      
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee-email">{t('register.employeeEmailLabel')}</Label>
                      <Input
                        id="employee-email"
                        type="email"
                        placeholder="tu@email.com"
                        className="h-12"
                        value={employeeEmail}
                        onChange={(e) => setEmployeeEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee-phone">Teléfono</Label>
                      <Input
                        id="employee-phone"
                        placeholder="+58 412 123-4567"
                        className="h-12"
                        value={employeePhone}
                        onChange={(e) => setEmployeePhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employee-password">{t('register.employeePasswordLabel')}</Label>
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
                    disabled={isLoadingEmployee}
                    onClick={signUpEmployee}
                  >
                    {isLoadingEmployee ? t('register.activating') : t('register.activateEmployeeCTA')}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-muted-foreground">
            {t('register.haveAccount')} {" "}
            <Button variant="link" className="p-0" asChild>
              <Link to="/login">{t('register.loginLink')}</Link>
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;