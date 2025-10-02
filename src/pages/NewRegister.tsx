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
import { CompanySelector } from "@/components/CompanySelector";

const Register = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Company signup state
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPassword, setCompanyPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyRif, setCompanyRif] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Employee signup state
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeePhone, setEmployeePhone] = useState("");
  const [employeePassword, setEmployeePassword] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
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
            company_name: companyName,
            company_rif: companyRif
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Create company record
        const { error: companyError } = await ensureCompanyRecord(data.user.id, {
          name: companyName,
          rif: companyRif,
          address: companyAddress,
          phone: companyPhone,
          email: companyEmail,
        });
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
      
      // Validate inputs
      if (!selectedCompanyId) {
        throw new Error(t('register.selectCompanyRequired'));
      }
      
      if (!employeeFirstName || !employeeLastName) {
        throw new Error(t('register.nameRequired'));
      }
      
      // Clean and normalize email
      const cleanEmail = employeeEmail.trim().toLowerCase();
      
      // Validate email format
      if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        throw new Error(t('register.invalidEmailFormat').replace('{email}', employeeEmail));
      }
      
      // Additional check: make sure there's at least one character before @ and after .
      const emailParts = cleanEmail.split('@');
      if (emailParts.length !== 2 || emailParts[0].length === 0 || !emailParts[1].includes('.')) {
        throw new Error(t('register.invalidEmailFormat').replace('{email}', employeeEmail));
      }
      
      // Skip checking employees table for email (column removed). Auth will enforce uniqueness.
      
      // Create Supabase auth user
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: employeePassword,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            role: 'employee',
            first_name: employeeFirstName,
            last_name: employeeLastName,
            company_id: selectedCompanyId,
            must_change_password: true
          }
        }
      });
      
      if (error) throw error;
      
      // Create a placeholder employee record with minimal information
      // The company will need to complete the rest of the information
      const { data: newEmployee, error: insertError } = await supabase
        .from("employees")
        .insert({
          company_id: selectedCompanyId,
          first_name: employeeFirstName,
          last_name: employeeLastName,
          phone: employeePhone || null,
          // Required fields with placeholder values
          year_of_employment: new Date().getFullYear(),
          position: 'Pending',
          employment_start_date: new Date().toISOString().split('T')[0],
          employment_type: 'full-time',
          weekly_hours: 40,
          monthly_salary: 0,
          living_expenses: 0,
          dependents: 0,
          emergency_contact: 'Pending',
          emergency_phone: 'Pending',
          address: 'Pending',
          city: 'Pending',
          state: 'Pending',
          bank_name: 'Pending',
          account_number: 'Pending',
          account_type: 'savings',
          // Set is_active to false until company approves
          is_active: false,
          // Generate a random activation code (not used in new flow but required by schema)
          activation_code: Math.floor(100000 + Math.random() * 900000).toString(),
          auth_user_id: data.user?.id
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Error creating employee record:", insertError);
        throw new Error(`Error creating employee record: ${insertError.message}`);
      }
      
      toast({ 
        title: t('register.employeeSuccess'),
        description: t('register.pendingApproval')
      });
      navigate('/login');
    } catch (err: any) {
      toast({
        title: t('register.errorTitle'),
        description: err?.message ?? t('register.tryAgain'),
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
      
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <Link to="/" className="flex items-center justify-center space-x-2">
            <DollarSign className="h-8 w-8 text-white" />
            <span className="text-2xl font-bold text-white">AvancePay</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">{t('register.title')}</h1>
          <p className="text-white/80">{t('register.subtitle')}</p>
        </div>
        
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle>{t('register.createAccount')}</CardTitle>
            <CardDescription>{t('register.chooseAccountType')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="company" className="space-y-6">
              <TabsList className="grid grid-cols-2">
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
                <div className="space-y-2">
                  <Label htmlFor="company-name">{t('register.companyNameLabel')}</Label>
                  <Input
                    id="company-name"
                    placeholder={t('register.companyNamePlaceholder')}
                    className="h-12"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company-rif">{t('register.companyRifLabel')}</Label>
                  <Input
                    id="company-rif"
                    placeholder="J123456789"
                    className="h-12"
                    value={companyRif}
                    onChange={(e) => setCompanyRif(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company-address">{t('register.companyAddressLabel')}</Label>
                  <Textarea
                    id="company-address"
                    placeholder={t('register.companyAddressPlaceholder')}
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
                      placeholder={t('register.companyEmailPlaceholder')}
                      className="h-12"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-phone">{t('register.companyPhoneLabel')}</Label>
                    <Input
                      id="company-phone"
                      placeholder={t('register.companyPhonePlaceholder')}
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
                  <h4 className="font-semibold text-sm">{t('register.benefitsTitle')}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>{t('register.benefit1')}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>{t('register.benefit2')}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>{t('register.benefit3')}</span>
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
                  <h4 className="font-semibold text-secondary-foreground">{t('register.employeeTitle')}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('register.employeeDescription')}
                  </p>
                </div>

                <div className="space-y-4">
                  <CompanySelector 
                    onCompanySelect={setSelectedCompanyId}
                    selectedCompanyId={selectedCompanyId}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee-first-name">{t('common.firstName')}</Label>
                      <Input
                        id="employee-first-name"
                        className="h-12"
                        value={employeeFirstName}
                        onChange={(e) => setEmployeeFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee-last-name">{t('common.lastName')}</Label>
                      <Input
                        id="employee-last-name"
                        className="h-12"
                        value={employeeLastName}
                        onChange={(e) => setEmployeeLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee-email">{t('register.employeeEmailLabel')}</Label>
                      <Input
                        id="employee-email"
                        type="email"
                        placeholder={t('register.employeeEmailPlaceholder')}
                        className="h-12"
                        value={employeeEmail}
                        onChange={(e) => setEmployeeEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee-phone">{t('register.employeePhoneLabel')}</Label>
                      <Input
                        id="employee-phone"
                        placeholder={t('register.employeePhonePlaceholder')}
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
                    {isLoadingEmployee ? t('common.saving') : t('register.createEmployeeButton')}
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