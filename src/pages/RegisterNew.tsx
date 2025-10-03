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
  const [companyConfirmPassword, setCompanyConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyRif, setCompanyRif] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Validation states and RIF image
  const [companyNameError, setCompanyNameError] = useState("");
  const [companyEmailError, setCompanyEmailError] = useState("");
  const [companyPhoneError, setCompanyPhoneError] = useState("");
  const [companyRifError, setCompanyRifError] = useState("");
  const [companyPasswordError, setCompanyPasswordError] = useState("");
  const [companyConfirmPasswordError, setCompanyConfirmPasswordError] = useState("");
  const [companyRifImage, setCompanyRifImage] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("company");

  // Helpers
  const isValidCompanyName = (name: string) => name.trim().length >= 2;
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
  const isValidPhone = (phone: string) => phone.replace(/\D/g, '').length >= 7;
  const isValidRif = (rif: string) => /^[VJG]\d{9}$/.test(rif);
  const isValidPassword = (password: string) => password.length >= 6;
  const passwordsMatch = (password: string, confirmPassword: string) => password === confirmPassword;

  // Handle Enter key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      console.log("Active tab:", activeTab);
      
      if (activeTab === 'company') {
        signUpCompany();
      } else if (activeTab === 'employee') {
        signUpEmployee();
      }
    }
  };

  const handleCompanyRifChange = (value: string) => {
    let cleaned = value.replace(/[^VJG0-9]/gi, '');
    if (cleaned.length > 0 && !['V','J','G'].includes(cleaned[0].toUpperCase())) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.length > 0) {
      cleaned = cleaned[0].toUpperCase() + cleaned.substring(1);
    }
    cleaned = cleaned.substring(0, 10);
    if (cleaned.length > 1) {
      cleaned = cleaned[0] + cleaned.substring(1).replace(/\D/g, '');
    }
    setCompanyRif(cleaned);
    if (cleaned.length === 10) {
      setCompanyRifError(isValidRif(cleaned) ? "" : t('registration.rifInvalid'));
    } else if (cleaned.length > 0) {
      setCompanyRifError(t('registration.rifLength'));
    } else {
      setCompanyRifError("");
    }
  };

  const handleCompanyRifImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setCompanyRifImage(null);
      toast({ title: t('common.error'), description: t('registration.rifImageFormats'), variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCompanyRifImage(null);
      toast({ title: t('common.error'), description: t('registration.rifImageFormats'), variant: 'destructive' });
      return;
    }
    setCompanyRifImage(file);
  };

  const isCompanyFormValid = () => {
    return isValidCompanyName(companyName)
      && isValidEmail(companyEmail)
      && isValidPhone(companyPhone)
      && isValidRif(companyRif)
      && isValidPassword(companyPassword)
      && passwordsMatch(companyPassword, companyConfirmPassword)
      && !!companyRifImage
      && !companyNameError && !companyEmailError && !companyPhoneError && !companyRifError 
      && !companyPasswordError && !companyConfirmPasswordError;
  };
  
  // Employee signup state
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeePhone, setEmployeePhone] = useState("");
  const [employeePassword, setEmployeePassword] = useState("");
  const [employeeConfirmPassword, setEmployeeConfirmPassword] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(false);
  const [employeePasswordError, setEmployeePasswordError] = useState("");
  const [employeeConfirmPasswordError, setEmployeeConfirmPasswordError] = useState("");

  const signUpCompany = async () => {
    try {
      setIsLoading(true);
      // Validate client-side before submit
      const nameOk = isValidCompanyName(companyName);
      const emailOk = isValidEmail(companyEmail);
      const phoneOk = isValidPhone(companyPhone);
      const rifOk = isValidRif(companyRif);
      const passwordOk = isValidPassword(companyPassword);
      const passwordsMatchOk = passwordsMatch(companyPassword, companyConfirmPassword);
      const rifImgOk = !!companyRifImage;

      setCompanyNameError(nameOk ? "" : t('registration.companyNameRequired'));
      setCompanyEmailError(emailOk ? "" : t('registration.emailInvalid'));
      setCompanyPhoneError(phoneOk ? "" : t('registration.phoneInvalid'));
      setCompanyRifError(rifOk ? "" : t('registration.rifInvalid'));
      setCompanyPasswordError(passwordOk ? "" : t('registration.passwordTooShort'));
      setCompanyConfirmPasswordError(passwordsMatchOk ? "" : t('registration.passwordsDoNotMatch'));

      if (!nameOk || !emailOk || !phoneOk || !rifOk || !passwordOk || !passwordsMatchOk || !rifImgOk) {
        throw new Error(t('common.error'));
      }
      
      // Check if RIF already exists BEFORE creating auth user
      const { data: existingCompany, error: checkError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('rif', companyRif)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking RIF:', checkError);
        throw new Error('Error checking RIF number. Please try again.');
      } else if (existingCompany) {
        console.error('RIF already exists:', existingCompany);
        toast({
          title: 'RIF Already Exists',
          description: `A company with RIF ${companyRif} already exists (${existingCompany.name}). Please check your RIF number or contact support.`,
          variant: 'destructive'
        });
        return; // Exit early - don't create auth user
      }
      
      // Create auth user first
      // Normalize inputs
      const cleanEmail = companyEmail.trim().toLowerCase();
      const cleanPassword = companyPassword.trim();

      // Create auth user first without metadata to avoid trigger issues
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Set metadata after account creation
        await supabase.auth.updateUser({
          data: {
            role: 'company',
            company_name: companyName,
            company_rif: companyRif,
            company_address: companyAddress,
            company_phone: companyPhone
          }
        });
        // Upload RIF image to storage (public bucket)
        let rifImageUrl: string | null = null;
        if (companyRifImage) {
          const fileExt = companyRifImage.name.split('.').pop()?.toLowerCase() || 'jpg';
          const objectKey = `rif/${data.user.id}/${Date.now()}.${fileExt}`;
          const { error: uploadErr } = await supabase.storage
            .from('company-docs')
            .upload(objectKey, companyRifImage, { upsert: true, contentType: companyRifImage.type });
          if (uploadErr) {
            console.error('RIF upload error:', uploadErr);
          } else {
            const { data: pubUrl } = supabase.storage.from('company-docs').getPublicUrl(objectKey);
            rifImageUrl = pubUrl.publicUrl;
          }
        }

        // Create company record with rif_image_url
        console.log('Creating company record with data:', {
          authUserId: data.user.id,
          name: companyName,
          rif: companyRif,
          address: companyAddress,
          phone: companyPhone,
          email: companyEmail,
          rif_image_url: rifImageUrl
        });
        
        const { data: companyData, error: companyError } = await ensureCompanyRecord(data.user.id, {
          name: companyName,
          rif: companyRif,
          address: companyAddress,
          phone: companyPhone,
          email: companyEmail,
          rif_image_url: rifImageUrl || undefined,
        });
        
        if (companyError) {
          console.error('Company record creation error:', companyError);
          
          // Handle specific error types
          if (companyError.code === '23505' && companyError.message.includes('companies_rif_key')) {
            // This shouldn't happen anymore since we check for existing RIF first
            console.error('Unexpected duplicate RIF error:', companyError);
            toast({
              title: 'Unexpected Error',
              description: 'A company with this RIF number already exists. The system will update the existing record.',
              variant: 'destructive'
            });
          } else {
            toast({
              title: 'Warning',
              description: 'Company account created but company profile setup failed. Please contact support.',
              variant: 'destructive'
            });
          }
        } else {
          console.log('Company record created successfully:', companyData);
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
      
      // Validate inputs
      if (!selectedCompanyId) {
        throw new Error(t('register.selectCompanyRequired'));
      }
      
      if (!employeeFirstName || !employeeLastName) {
        throw new Error(t('register.nameRequired'));
      }

      // Validate password
      const passwordOk = isValidPassword(employeePassword);
      const passwordsMatchOk = passwordsMatch(employeePassword, employeeConfirmPassword);
      
      setEmployeePasswordError(passwordOk ? "" : t('registration.passwordTooShort'));
      setEmployeeConfirmPasswordError(passwordsMatchOk ? "" : t('registration.passwordsDoNotMatch'));

      if (!passwordOk || !passwordsMatchOk) {
        throw new Error(t('common.error'));
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
            company_id: selectedCompanyId
            // Self-registered employees do NOT need to change password on first login
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
          // Required fields with placeholder values that satisfy check constraints
          year_of_employment: new Date().getFullYear(),
          position: 'Pending',
          employment_start_date: new Date().toISOString().split('T')[0],
          employment_type: 'full-time', // Must be one of: 'full-time', 'part-time', 'contract'
          weekly_hours: 40, // Must be > 0 and <= 80
          monthly_salary: 1, // Must be > 0
          living_expenses: 0, // Must be >= 0
          dependents: 0, // Must be >= 0
          emergency_contact: 'Pending',
          emergency_phone: 'Pending',
          address: 'Pending',
          city: 'Pending',
          state: 'Pending',
          bank_name: 'Pending',
          account_number: 'Pending',
          account_type: 'savings', // Must be one of: 'savings', 'checking'
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
        
        // Check for specific constraint violations
        if (insertError.message.includes('check constraint')) {
          if (insertError.message.includes('monthly_salary')) {
            throw new Error(t('register.monthlySalaryError'));
          } else if (insertError.message.includes('weekly_hours')) {
            throw new Error(t('register.weeklyHoursError'));
          } else if (insertError.message.includes('employment_type')) {
            throw new Error(t('register.employmentTypeError'));
          } else if (insertError.message.includes('account_type')) {
            throw new Error(t('register.accountTypeError'));
          }
        }
        
        // Generic error if no specific constraint is identified
        throw new Error(`${t('register.employeeCreationError')}: ${insertError.message}`);
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
      
      <div className="w-full max-w-xl space-y-6">
        {/* Logo */}
        {/* <div className="text-center space-y-2">
          <Link to="/" className="flex items-center justify-center space-x-2">
            <DollarSign className="h-8 w-8 text-white" />
            <span className="text-2xl font-bold text-white">AvancePay</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">{t('register.title')}</h1>
          <p className="text-white/80">{t('register.subtitle')}</p>
        </div> */}
        

        <div className="text-center space-y-2">
          <Link to="/" className="flex items-center justify-center space-x-2">
            <div className="h-16 w-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-800">AvancePay</span>
          </Link>
          <p className="text-gray-600 text-lg">{t('register.subtitle')}</p>
        </div>


        <Card className="shadow-elegant border-0">
          <CardHeader className="pb-6 items-center ">
            <CardTitle className="text-2xl ">{t('register.createAccount')}</CardTitle>
            <CardDescription className="text-base">{t('register.chooseAccountType')}</CardDescription>
          </CardHeader>
          <CardContent onKeyDown={handleKeyPress}>
            <Tabs defaultValue="company" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="grid grid-cols-2 h-14">
                <TabsTrigger value="company" className="flex items-center space-x-3 text-base">
                  <Building className="h-5 w-5" />
                  <span>{t('register.companyTab')}</span>
                </TabsTrigger>
                <TabsTrigger value="employee" className="flex items-center space-x-3 text-base">
                  <User className="h-5 w-5" />
                  <span>{t('register.employeeTab')}</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="company" className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="company-name" className="text-base">{t('register.companyNameLabel')}</Label>
                  <Input
                    id="company-name"
                    placeholder={t('register.companyNamePlaceholder')}
                    className={`h-12 text-base ${companyNameError ? 'border-red-500' : ''}`}
                    value={companyName}
                    onChange={(e) => {
                      const v = e.target.value; setCompanyName(v);
                      if (!v) setCompanyNameError(t('registration.companyNameRequired'));
                      else if (!isValidCompanyName(v)) setCompanyNameError(t('registration.companyNameTooShort'));
                      else setCompanyNameError('');
                    }}
                  />
                  {companyNameError && (<p className="text-sm text-red-500">{companyNameError}</p>)}
                </div>
                
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="company-email" className="text-base">{t('register.companyEmailLabel')}</Label>
                    <Input
                      id="company-email"
                      type="email"
                      placeholder={t('register.companyEmailPlaceholder')}
                    className={`h-12 text-base ${companyEmailError ? 'border-red-500' : ''}`}
                      value={companyEmail}
                    onChange={(e) => { const v = e.target.value; setCompanyEmail(v); setCompanyEmailError(!v ? t('registration.emailRequired') : (!isValidEmail(v) ? t('registration.emailInvalid') : '')); }}
                    />
                  {companyEmailError && (<p className="text-sm text-red-500">{companyEmailError}</p>)}
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="company-phone" className="text-base">{t('register.companyPhoneLabel')}</Label>
                    <Input
                      id="company-phone"
                      placeholder={t('register.companyPhonePlaceholder')}
                    className={`h-12 text-base ${companyPhoneError ? 'border-red-500' : ''}`}
                      value={companyPhone}
                    onChange={(e) => { const v = e.target.value; setCompanyPhone(v); setCompanyPhoneError(!v ? t('registration.phoneRequired') : (!isValidPhone(v) ? t('registration.phoneInvalid') : '')); }}
                    />
                  {companyPhoneError && (<p className="text-sm text-red-500">{companyPhoneError}</p>)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="company-password" className="text-base">{t('register.companyPasswordLabel')}</Label>
                    <Input
                      id="company-password"
                      type="password"
                      className={`h-12 text-base ${companyPasswordError ? 'border-red-500' : ''}`}
                      value={companyPassword}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCompanyPassword(v);
                        setCompanyPasswordError(!v ? t('registration.passwordRequired') : (!isValidPassword(v) ? t('registration.passwordTooShort') : ''));
                        // Also check confirm password when main password changes
                        if (companyConfirmPassword) {
                          setCompanyConfirmPasswordError(!passwordsMatch(v, companyConfirmPassword) ? t('registration.passwordsDoNotMatch') : '');
                        }
                      }}
                    />
                    {companyPasswordError && (<p className="text-sm text-red-500">{companyPasswordError}</p>)}
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="company-confirm-password" className="text-base">{t('register.confirmPasswordLabel')}</Label>
                    <Input
                      id="company-confirm-password"
                      type="password"
                      className={`h-12 text-base ${companyConfirmPasswordError ? 'border-red-500' : ''}`}
                      value={companyConfirmPassword}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCompanyConfirmPassword(v);
                        setCompanyConfirmPasswordError(!v ? t('registration.confirmPasswordRequired') : (!passwordsMatch(companyPassword, v) ? t('registration.passwordsDoNotMatch') : ''));
                      }}
                    />
                    {companyConfirmPasswordError && (<p className="text-sm text-red-500">{companyConfirmPasswordError}</p>)}
                  </div>
                </div>

                
                <div className="space-y-3">
                  <Label htmlFor="company-rif" className="text-base">{t('register.companyRifLabel')}</Label>
                  <Input
                    id="company-rif"
                    placeholder="J123456789"
                    className={`h-12 text-base ${companyRifError ? 'border-red-500' : ''}`}
                    value={companyRif}
                    onChange={(e) => handleCompanyRifChange(e.target.value)}
                  />
                  {companyRifError && (<p className="text-sm text-red-500">{companyRifError}</p>)}
                  <p className="text-xs text-muted-foreground">{t('registration.rifFormat')}</p>

                  {/* RIF Image Upload */}
                  <div className="mt-3">
                    <Label htmlFor="company-rif-image" className="text-base">{t('registration.rifImage')} *</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                      <input id="company-rif-image" type="file" accept="image/*,.pdf" className="hidden" onChange={handleCompanyRifImageUpload} />
                      {!companyRifImage ? (
                        <div className="text-center space-y-2">
                          <Button variant="outline" onClick={() => document.getElementById('company-rif-image')?.click()}>
                            {t('registration.rifImageSelect')}
                          </Button>
                          <div className="text-xs text-muted-foreground">
                            <p>• {t('registration.rifImageRequirements')}</p>
                            <p>• {t('registration.rifImageValid')}</p>
                            <p>• {t('registration.rifImageFormats')}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm">
                          <p className="font-medium">{companyRifImage.name}</p>
                          <p className="text-xs text-muted-foreground">{(companyRifImage.size/1024/1024).toFixed(2)} MB</p>
                          <div className="mt-2">
                            <Button variant="outline" onClick={() => setCompanyRifImage(null)}>
                              {t('common.remove') || 'Remove'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="company-address" className="text-base">{t('register.companyAddressLabel')}</Label>
                  <Textarea
                    id="company-address"
                    placeholder={t('register.companyAddressPlaceholder')}
                    className="min-h-[80px] text-base"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </div>

               

                <Button
                  className="w-full h-14 text-base mt-2"
                  variant="hero"
                  disabled={isLoading || !isCompanyFormValid()}
                  onClick={signUpCompany}
                >
                  {t('register.createCompanyButton')}
                </Button>
              </TabsContent>

              <TabsContent value="employee" className="space-y-6">
                <div className="bg-secondary/20 border border-secondary/30 p-5 rounded-lg text-center">
                  <User className="h-10 w-10 text-secondary mx-auto mb-3" />
                  <h4 className="font-semibold text-lg text-secondary-foreground">{t('register.employeeTitle')}</h4>
                  <p className="text-muted-foreground mt-2">
                    {t('register.employeeDescription')}
                  </p>
                </div>

                <div className="space-y-6">
                  <CompanySelector 
                    onCompanySelect={setSelectedCompanyId}
                    selectedCompanyId={selectedCompanyId}
                  />
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="employee-first-name" className="text-base">{t('common.firstName')}</Label>
                      <Input
                        id="employee-first-name"
                        className="h-12 text-base"
                        value={employeeFirstName}
                        onChange={(e) => setEmployeeFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="employee-last-name" className="text-base">{t('common.lastName')}</Label>
                      <Input
                        id="employee-last-name"
                        className="h-12 text-base"
                        value={employeeLastName}
                        onChange={(e) => setEmployeeLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="employee-email" className="text-base">{t('register.employeeEmailLabel')}</Label>
                      <Input
                        id="employee-email"
                        type="email"
                        placeholder={t('register.employeeEmailPlaceholder')}
                        className="h-12 text-base"
                        value={employeeEmail}
                        onChange={(e) => setEmployeeEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="employee-phone" className="text-base">{t('register.employeePhoneLabel')}</Label>
                      <Input
                        id="employee-phone"
                        placeholder={t('register.employeePhonePlaceholder')}
                        className="h-12 text-base"
                        value={employeePhone}
                        onChange={(e) => setEmployeePhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="employee-password" className="text-base">{t('register.employeePasswordLabel')}</Label>
                    <Input
                      id="employee-password"
                      type="password"
                        className={`h-12 text-base ${employeePasswordError ? 'border-red-500' : ''}`}
                      value={employeePassword}
                        onChange={(e) => {
                          const v = e.target.value;
                          setEmployeePassword(v);
                          setEmployeePasswordError(!v ? t('registration.passwordRequired') : (!isValidPassword(v) ? t('registration.passwordTooShort') : ''));
                          // Also check confirm password when main password changes
                          if (employeeConfirmPassword) {
                            setEmployeeConfirmPasswordError(!passwordsMatch(v, employeeConfirmPassword) ? t('registration.passwordsDoNotMatch') : '');
                          }
                        }}
                      />
                      {employeePasswordError && (<p className="text-sm text-red-500">{employeePasswordError}</p>)}
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="employee-confirm-password" className="text-base">{t('register.confirmPasswordLabel')}</Label>
                      <Input
                        id="employee-confirm-password"
                        type="password"
                        className={`h-12 text-base ${employeeConfirmPasswordError ? 'border-red-500' : ''}`}
                        value={employeeConfirmPassword}
                        onChange={(e) => {
                          const v = e.target.value;
                          setEmployeeConfirmPassword(v);
                          setEmployeeConfirmPasswordError(!v ? t('registration.confirmPasswordRequired') : (!passwordsMatch(employeePassword, v) ? t('registration.passwordsDoNotMatch') : ''));
                        }}
                      />
                      {employeeConfirmPasswordError && (<p className="text-sm text-red-500">{employeeConfirmPasswordError}</p>)}
                    </div>
                  </div>

                  <Button 
                    className="w-full h-14 text-base mt-2" 
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
            <Button variant="link" className="p-0 text-base font-semibold" asChild>
              <Link to="/login">{t('register.loginLink')}</Link>
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;