import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Logo from "@/components/Logo";
import { Building, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState, useCallback, memo, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ensureCompanyRecord } from "@/lib/profile";
import { PhoneInput } from "@/components/PhoneInput";

const Register = memo(() => {
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
  const [companyPhoneCountry, setCompanyPhoneCountry] = useState(null);
  const [companyPhoneFocused, setCompanyPhoneFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Validation states and RIF image
  const [companyNameError, setCompanyNameError] = useState("");
  const [companyEmailError, setCompanyEmailError] = useState("");
  const [companyPhoneError, setCompanyPhoneError] = useState("");
  const [companyRifError, setCompanyRifError] = useState("");
  const [companyPasswordError, setCompanyPasswordError] = useState("");
  const [companyConfirmPasswordError, setCompanyConfirmPasswordError] = useState("");
  const [companyRifImage, setCompanyRifImage] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isValidatingRif, setIsValidatingRif] = useState(false);
  const isInitialMount = useRef(true);

  // Prevent unnecessary re-renders on window focus
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only re-render if there are actual state changes
    // This prevents re-renders when switching windows
  }, []);

  // Helpers
  const isValidCompanyName = (name: string) => name.trim().length >= 2;
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
  const isValidPhone = (phone: string) => {
    const digitsOnly = phone.replace(/\D/g, '');
    // South American phone numbers range from 5-11 digits
    // Most common range is 7-10 digits
    if (digitsOnly.length < 7) {
      return false; // Too short
    }
    if (digitsOnly.length > 11) {
      return false; // Too long
    }
    // Additional check: ensure it's not all zeros or repeated digits
    if (/^(\d)\1+$/.test(digitsOnly)) {
      return false; // All same digits (e.g., 1111111)
    }
    return true;
  };

  const getPhoneValidationError = (phone: string, country?: any, hasBeenFocused: boolean = false) => {
    // If field hasn't been focused and phone is empty, don't show error
    if (!hasBeenFocused && !phone) {
      return '';
    }
    
    // If field hasn't been focused but phone has data, validate it (for form submission)
    if (!hasBeenFocused && phone) {
      // Continue with validation below
    }
    
    // If field has been focused, always validate
    if (!phone) {
      return t('registration.phoneRequired');
    }
    
    // Extract only the local phone number (without country code)
    let localNumber = phone;
    if (country && phone.startsWith(country.dialCode)) {
      localNumber = phone.substring(country.dialCode.length).trim();
    }
    
    const digitsOnly = localNumber.replace(/\D/g, '');
    
    // Check for repeated digits first
    if (/^(\d)\1+$/.test(digitsOnly)) {
      return t('registration.phoneInvalid');
    }
    
    // If country is provided, validate against specific country requirements
    if (country) {
      // Hardcoded expected lengths as fallback
      const countryLengths: { [key: string]: number } = {
        'AR': 10, // Argentina
        'BO': 9,  // Bolivia
        'BR': 11, // Brazil
        'CL': 9,  // Chile
        'CO': 10, // Colombia
        'EC': 9,  // Ecuador
        'FK': 5,  // Falkland Islands
        'GF': 8,  // French Guiana
        'GY': 7,  // Guyana
        'PE': 9,  // Peru
        'PY': 9,  // Paraguay
        'SR': 7,  // Suriname
        'UY': 8,  // Uruguay
        'VE': 10  // Venezuela
      };
      
      const expectedLength = countryLengths[country.code] || 10; // Default to 10 if country not found
      
      
      // Always show error until exact length is reached
      if (digitsOnly.length < expectedLength) {
        return t('registration.phoneTooShort');
      }
      
      if (digitsOnly.length > expectedLength) {
        return t('registration.phoneTooLong');
      }
      
      // Additional country-specific validation only when length is correct
      if (country.code === 'UY' && digitsOnly.length === 8) {
        // Uruguay: must start with 9 (mobile) or 2 (landline)
        if (!digitsOnly.startsWith('9') && !digitsOnly.startsWith('2')) {
          return t('registration.phoneInvalid');
        }
      }
      
      if (digitsOnly.startsWith('0')) {
        return t('registration.phoneInvalid');
      }
      
      return ''; // Valid for this country - error disappears
    }
    
    // Fallback validation if no country is provided
    if (digitsOnly.length < 7) {
      return t('registration.phoneTooShort');
    }
    
    if (digitsOnly.length > 11) {
      return t('registration.phoneTooLong');
    }
    
    return t('registration.phoneInvalid');
  };

  // Separate validation function for form submission (always validates)
  const validatePhoneForSubmission = (phone: string, country?: any) => {
    if (!phone) {
      return t('registration.phoneRequired');
    }
    
    
    // Extract only the local phone number (without country code)
    let localNumber = phone;
    if (country && phone.startsWith(country.dialCode)) {
      localNumber = phone.substring(country.dialCode.length).trim();
    }
    
    const digitsOnly = localNumber.replace(/\D/g, '');
    
    
    // Check for repeated digits first
    if (/^(\d)\1+$/.test(digitsOnly)) {
      return t('registration.phoneInvalid');
    }
    
    // If country is provided, validate against specific country requirements
    if (country) {
      // Hardcoded expected lengths as fallback
      const countryLengths: { [key: string]: number } = {
        'AR': 10, // Argentina
        'BO': 9,  // Bolivia
        'BR': 11, // Brazil
        'CL': 9,  // Chile
        'CO': 10, // Colombia
        'EC': 9,  // Ecuador
        'FK': 5,  // Falkland Islands
        'GF': 8,  // French Guiana
        'GY': 7,  // Guyana
        'PE': 9,  // Peru
        'PY': 9,  // Paraguay
        'SR': 7,  // Suriname
        'UY': 8,  // Uruguay
        'VE': 10  // Venezuela
      };
      
      const expectedLength = countryLengths[country.code] || 10; // Default to 10 if country not found
      
      
      // Always show error until exact length is reached
      if (digitsOnly.length < expectedLength) {
        return t('registration.phoneTooShort');
      }
      
      if (digitsOnly.length > expectedLength) {
        return t('registration.phoneTooLong');
      }
      
      // Additional country-specific validation only when length is correct
      if (country.code === 'UY' && digitsOnly.length === 8) {
        // Uruguay: must start with 9 (mobile) or 2 (landline)
        if (!digitsOnly.startsWith('9') && !digitsOnly.startsWith('2')) {
          return t('registration.phoneInvalid');
        }
      }
      
      if (digitsOnly.startsWith('0')) {
        return t('registration.phoneInvalid');
      }
      
      return ''; // Valid for this country - error disappears
    }
    
    // Fallback validation if no country is provided
    if (digitsOnly.length < 7) {
      return t('registration.phoneTooShort');
    }
    
    if (digitsOnly.length > 11) {
      return t('registration.phoneTooLong');
    }
    
    return t('registration.phoneInvalid');
  };

  const isValidRif = (rif: string) => /^[VJG]\d{9}$/.test(rif);
  const isValidPassword = (password: string) => password.length >= 6;
  const passwordsMatch = (password: string, confirmPassword: string) => password === confirmPassword;

  // Handle Enter key press
  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
        signUpCompany();
    }
  }, []);

  const handleCompanyRifChange = useCallback((value: string) => {
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
  }, [t]);

  const handleCompanyRifImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    // Clear the input value to allow re-selecting the same file
    event.target.value = '';
    
    // Force file input to re-render by changing key
    setFileInputKey(prev => prev + 1);
    
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
    
    // Validate RIF expiration date
    try {
      setIsValidatingRif(true);
      toast({ title: t('common.loading'), description: t('registration.validatingRIF') });
      
      // Convert file to base64 for validation
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Content = reader.result as string;
          const base64Data = base64Content.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          
         
          const { data, error } = await supabase.functions.invoke('validate-rif-expiration', {
            body: {
              file_content: base64Data,
              file_type: file.type,
              document_text: null,
              document_url: null
            }
          });
          
          
          if (error) {
            console.error('RIF validation error:', error);
            throw error;
          }
          
          // Check if validation was successful
          if (!data.success) {
            toast({
              title: t('registration.rifExpirationError'),
              description: data.message || t('registration.rifExpirationErrorDesc'),
              variant: "destructive"
            });
            setIsValidatingRif(false);
            return;
          }
          
          // Log extracted data
          
          if (data.is_expired) {
            
            toast({
              title: t('registration.rifExpired'),
              description: t('registration.rifExpiredDesc'),
              variant: "destructive"
            });
            setIsValidatingRif(false);
            return;
          }
          
          
          toast({
            title: t('common.success'),
            description: data.message,
          });
          
          // Only set the file if validation passes
          setCompanyRifImage(file);
          setIsValidatingRif(false);
          
        } catch (error: any) {
          console.error('RIF validation error:', error);
          toast({
            title: t('registration.rifExpirationError'),
            description: t('registration.rifExpirationErrorDesc'),
            variant: "destructive"
          });
          setIsValidatingRif(false);
        }
      };
      
      reader.readAsDataURL(file);
      
    } catch (error: any) {
      console.error('RIF validation error:', error);
      toast({
        title: t('registration.rifExpirationError'),
        description: t('registration.rifExpirationErrorDesc'),
        variant: "destructive"
      });
      setIsValidatingRif(false);
    }
  }, [t, toast]);

  const isCompanyFormValid = useCallback(() => {
    const phoneValidationError = validatePhoneForSubmission(companyPhone, companyPhoneCountry);
    return isValidCompanyName(companyName)
      && isValidEmail(companyEmail)
      && !phoneValidationError
      && isValidRif(companyRif)
      && isValidPassword(companyPassword)
      && passwordsMatch(companyPassword, companyConfirmPassword)
      && !!companyRifImage
      && !companyNameError && !companyEmailError && !companyRifError 
      && !companyPasswordError && !companyConfirmPasswordError;
  }, [companyName, companyEmail, companyPhone, companyPhoneCountry, companyRif, companyPassword, companyConfirmPassword, companyRifImage, companyNameError, companyEmailError, companyRifError, companyPasswordError, companyConfirmPasswordError]);
  

  const signUpCompany = useCallback(async () => {
    try {
      setIsLoading(true);
      // Validate client-side before submit
      const nameOk = isValidCompanyName(companyName);
      const emailOk = isValidEmail(companyEmail);
      const phoneValidationError = validatePhoneForSubmission(companyPhone, companyPhoneCountry);
      const phoneOk = !phoneValidationError;
      const rifOk = isValidRif(companyRif);
      const passwordOk = isValidPassword(companyPassword);
      const passwordsMatchOk = passwordsMatch(companyPassword, companyConfirmPassword);
      const rifImgOk = !!companyRifImage;

      setCompanyNameError(nameOk ? "" : t('registration.companyNameRequired'));
      setCompanyEmailError(emailOk ? "" : t('registration.emailInvalid'));
      setCompanyPhoneError(phoneValidationError);
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
      
      // Normalize inputs
      const cleanEmail = companyEmail.trim().toLowerCase();
      const cleanPassword = companyPassword.trim();

      // Validate email domain has MX records before attempting signup
      try {
        const { data: domainResp, error: domainErr } = await supabase.functions.invoke('validate-email-domain', {
          body: { email: cleanEmail }
        });
        if (domainErr) {
          console.error('Domain validation error:', domainErr);
        }
        if (!domainResp?.hasMx) {
          toast({
            title: t('register.emailDomainInvalidTitle') ?? 'Invalid email domain',
            description: t('register.emailDomainInvalidDesc') ?? 'The email domain does not appear to receive mail. Please use a valid email provider.',
            variant: 'destructive'
          });
          return;
        }
      } catch (e) {
        console.warn('Failed to validate domain MX; proceeding with signup fallback.', e);
      }

      // Upload RIF image to storage (public bucket) first
        let rifImageUrl: string | null = null;
        if (companyRifImage) {
          const fileExt = companyRifImage.name.split('.').pop()?.toLowerCase() || 'jpg';
        const objectKey = `rif/temp/${Date.now()}.${fileExt}`;
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

      // Use edge function to create user and company record atomically
      const { data: registerResult, error: registerError } = await supabase.functions.invoke('register-user', {
        body: {
          email: cleanEmail,
          password: cleanPassword,
          userType: 'company',
          language: language,
          companyData: {
          name: companyName,
          rif: companyRif,
          address: companyAddress,
          phone: companyPhone,
            rif_image_url: rifImageUrl
          }
        }
      });


      if (registerError) {
        console.error('Registration error:', registerError);
        console.error('Error details:', registerError.details);
        console.error('Error message:', registerError.message);
        console.error('Error structure:', JSON.stringify(registerError, null, 2));
        
        // Extract error message from Supabase function error
        let errorMessage = 'Failed to create company account';
        
        // Check all possible error fields for our specific messages
        const errorText = JSON.stringify(registerError).toLowerCase();
        
        if (errorText.includes('email already registered')) {
          errorMessage = t('register.emailAlreadyRegistered');
        } else if (errorText.includes('rif already exists')) {
          errorMessage = t('register.rifAlreadyExists');
        } else if (registerError.details) {
          try {
            const errorDetails = JSON.parse(registerError.details);
            errorMessage = errorDetails.error || errorMessage;
          } catch (e) {
            // Check if details contains our error message
            if (registerError.details.includes('Email already registered')) {
              errorMessage = t('register.emailAlreadyRegistered');
            } else if (registerError.details.includes('RIF already exists')) {
              errorMessage = t('register.rifAlreadyExists');
            } else {
              errorMessage = registerError.message || errorMessage;
            }
          }
        } else if (registerError.message) {
          // Check if message contains our error message
          if (registerError.message.includes('Email already registered')) {
            errorMessage = t('register.emailAlreadyRegistered');
          } else if (registerError.message.includes('RIF already exists')) {
            errorMessage = t('register.rifAlreadyExists');
        } else {
            errorMessage = registerError.message;
          }
        }
        
      toast({
        title: t('register.errorTitle'),
          description: errorMessage,
              variant: 'destructive'
            });
        return;
      }

      if (!registerResult.success) {
        console.error('Registration failed:', registerResult);
          toast({
          title: t('register.errorTitle'),
          description: registerResult.error || 'Registration failed',
            variant: 'destructive'
          });
          return;
      }

      // Sign in the user after successful registration
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      });

      if (signInError) {
        console.error('Sign in error after registration:', signInError);
        toast({
          title: 'Account Created',
          description: 'Company account created successfully. Please sign in manually.',
          variant: 'default'
        });
        navigate('/login');
        return;
      }
      
      toast({ title: t('register.successTitle') });
      
      // Redirect based on the result from edge function
      navigate(registerResult.redirectPath, { replace: true });
    } catch (err: any) {
      toast({
        title: t('register.errorTitle'),
        description: err?.message ?? t('register.tryAgain'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [companyName, companyEmail, companyPhone, companyPhoneCountry, companyRif, companyPassword, companyConfirmPassword, companyRifImage, companyNameError, companyEmailError, companyPhoneError, companyRifError, companyPasswordError, companyConfirmPasswordError, t, language, navigate, toast]);



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
            <span className="text-2xl font-bold text-white">nominero.com</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">{t('register.title')}</h1>
          <p className="text-white/80">{t('register.subtitle')}</p>
        </div> */}
        

        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Link to="/">
              <Logo size="xl" variant="dark" />
          </Link>
          </div>
          <p className="text-gray-600 text-lg">{t('register.subtitle')}</p>
        </div>


        <Card className="shadow-elegant border-0">
          <CardHeader className="pb-6 items-center ">
            <CardTitle className="text-2xl">{t('register.createAccount')}</CardTitle>
            <CardDescription>{t('register.companyRegistrationDesc')}</CardDescription>
          </CardHeader>
          <CardContent onKeyDown={handleKeyPress}>
            <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">{t('register.companyNameLabel')}</Label>
                  <Input
                    id="company-name"
                    placeholder={t('register.companyNamePlaceholder')}
                    className={`h-12 ${companyNameError ? 'border-red-500' : ''}`}
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
                
                
                <div className="space-y-2">
                  <Label htmlFor="company-email">{t('register.companyEmailLabel')}</Label>
                    <Input
                      id="company-email"
                      type="email"
                      placeholder={t('register.companyEmailPlaceholder')}
                  className={`h-12 ${companyEmailError ? 'border-red-500' : ''}`}
                      value={companyEmail}
                    onChange={(e) => { const v = e.target.value; setCompanyEmail(v); setCompanyEmailError(!v ? t('registration.emailRequired') : (!isValidEmail(v) ? t('registration.emailInvalid') : '')); }}
                    />
                  {companyEmailError && (<p className="text-sm text-red-500">{companyEmailError}</p>)}
                  </div>

                <PhoneInput
                  label={t('register.companyPhoneLabel')}
                      placeholder={t('register.companyPhonePlaceholder')}
                      value={companyPhone}
                  onChange={(value, country) => {
                    setCompanyPhone(value);
                    setCompanyPhoneCountry(country);
                    // Use the country from the parameter, or fall back to stored country
                    const countryToUse = country || companyPhoneCountry;
                    setCompanyPhoneError(getPhoneValidationError(value, countryToUse, companyPhoneFocused));
                  }}
                  onFocus={() => setCompanyPhoneFocused(true)}
                  error={companyPhoneError}
                />

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company-password" >{t('register.companyPasswordLabel')}</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="company-confirm-password" >{t('register.confirmPasswordLabel')}</Label>
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

                
                <div className="space-y-2">
                  <Label htmlFor="company-rif" >{t('register.companyRifLabel')}</Label>
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
                    <Label htmlFor="company-rif-image" >{t('registration.rifImage')} *</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                      <input 
                        key={fileInputKey}
                        id="company-rif-image" 
                        type="file" 
                        accept="image/*,.pdf" 
                        className="hidden" 
                        onChange={handleCompanyRifImageUpload} 
                      />
                      {isValidatingRif && (
                        <div className="text-center py-6">
                          <h4 className="font-semibold">{t('common.loading')}</h4>
                          <p className="text-sm text-muted-foreground">{t('registration.validatingRIF')}</p>
                        </div>
                      )}
                      {!isValidatingRif && !companyRifImage && (
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
                      )}
                      {!isValidatingRif && companyRifImage && (
                        <div className="text-sm">
                          <p className="font-medium">{companyRifImage.name}</p>
                          <p className="text-xs text-muted-foreground">{(companyRifImage.size/1024/1024).toFixed(2)} MB</p>
                          <div className="mt-2">
                            <Button variant="outline" onClick={() => {
                              setCompanyRifImage(null);
                              setFileInputKey(prev => prev + 1); // Reset file input
                            }}>
                              {t('common.remove') || 'Remove'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company-address" >{t('register.companyAddressLabel')}</Label>
                  <Textarea
                    id="company-address"
                    placeholder={t('register.companyAddressPlaceholder')}
                    className="min-h-[80px] text-base"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </div>

               

                <Button
                  className="w-full h-14 mt-2"
                  variant="hero"
                  disabled={isLoading || !isCompanyFormValid()}
                  onClick={signUpCompany}
                >
                  {t('register.createCompanyButton')}
                  </Button>
                </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-muted-foreground">
            {t('register.haveAccount')} {" "}
            <Button variant="link" className="p-0 font-semibold" asChild>
              <Link to="/login">{t('register.loginLink')}</Link>
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
});

export default Register;