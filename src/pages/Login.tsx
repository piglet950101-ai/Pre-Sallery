import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
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
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (companyData) return true;
      
      // If no company found with email in companies table, check companies_with_auth view
      if (!companyData) {
        const { data: companyWithAuthData } = await supabase
          .from('companies_with_auth')
          .select('id')
          .eq('auth_email', email.toLowerCase())
          .maybeSingle();
        
        if (companyWithAuthData) return true;
      }
      
      // Check in employees table
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (employeeData) return true;
      
      // Check if user is an operator using metadata only
      // For now, we'll assume operators exist in auth.users with metadata
      return false; // Simplified - no database check needed
    } catch (error) {
      return false;
    }
  };

  const signIn = async () => {
    try {
      setIsLoading(true);
      
      // First, try normal login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      // If login fails with "Invalid login credentials", check if user exists in database
      if (error && error.message.includes('Invalid login credentials')) {
        // First check if this email exists in companies table
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id, auth_user_id, email')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (companyError) {
          throw error; // Throw original auth error
        }

        // If no company found with email in companies table, check companies_with_auth view
        let finalCompanyData = companyData;
        if (!companyData) {
          const { data: companyWithAuthData, error: companyWithAuthError } = await supabase
            .from('companies_with_auth')
            .select('id, auth_user_id, auth_email')
            .eq('auth_email', email.toLowerCase())
            .maybeSingle();
          
          if (companyWithAuthError) {
            throw error; // Throw original auth error
          }
          
          if (companyWithAuthData) {
            finalCompanyData = {
              id: companyWithAuthData.id,
              auth_user_id: companyWithAuthData.auth_user_id,
              email: companyWithAuthData.auth_email
            };
          }
        }

        // If company exists but has no auth_user_id, create auth account
        if (finalCompanyData && !finalCompanyData.auth_user_id) {
          try {
            // Create auth user for the company
            const { data: authData, error: authError } = await supabase.auth.signUp({
              email: email,
              password: password,
              options: {
                data: {
                  role: 'company',
                  company_id: companyData.id
                }
              }
            });

            if (authError) {
              throw error; // Throw original auth error
            }

            if (authData.user) {
              // Update company record with auth_user_id
              const { error: updateError } = await supabase
                .from('companies')
                .update({
                  auth_user_id: authData.user.id
                })
                .eq('id', companyData.id);

              if (updateError) {
                throw error; // Throw original auth error
              }

              // Now try to sign in with the newly created account
              const { data: newData, error: newError } = await supabase.auth.signInWithPassword({ email, password });
              if (newError) throw newError;
              
              // Use the new data for the rest of the login process
              const data = newData;
            } else {
              throw error; // Throw original auth error
            }
          } catch (createError) {
            throw error; // Throw original auth error
          }
        } else if (finalCompanyData && finalCompanyData.auth_user_id) {
          // Company exists with auth account, but password is wrong - show proper error
          throw error; // This will show "Invalid login credentials" which is correct
        } else {
          // No company found, check employees table
          const { data: employeeData, error: employeeError } = await supabase
            .from('employees')
            .select('id, first_name, last_name, company_id, auth_user_id')
            .eq('email', email.toLowerCase())
            .maybeSingle();

          if (employeeError) {
            throw error; // Throw original auth error
          }

          // If employee exists but has no auth_user_id, create auth account
          if (employeeData && !employeeData.auth_user_id) {
            try {
              // Get the full employee data including must_change_password flag
              const { data: fullEmployeeData, error: fullEmployeeError } = await supabase
                .from('employees')
                .select('must_change_password')
                .eq('id', employeeData.id)
                .single();

              if (fullEmployeeError) {
                throw error; // Throw original auth error
              }

              // Create auth user for the employee
              const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                  data: {
                    role: 'employee',
                    employee_id: employeeData.id,
                    company_id: employeeData.company_id,
                    must_change_password: fullEmployeeData.must_change_password || false
                  }
                }
              });

              if (authError) {
                throw error; // Throw original auth error
              }

              if (authData.user) {
                // Update employee record with auth_user_id (don't change must_change_password)
                const { error: updateError } = await supabase
                  .from('employees')
                  .update({
                    auth_user_id: authData.user.id,
                    is_active: true,
                    is_verified: true
                  })
                  .eq('id', employeeData.id);

                if (updateError) {
                  throw error; // Throw original auth error
                }

                // Now try to sign in with the newly created account
                const { data: newData, error: newError } = await supabase.auth.signInWithPassword({ email, password });
                if (newError) throw newError;
                
                // Use the new data for the rest of the login process
                const data = newData;
              } else {
                throw error; // Throw original auth error
              }
            } catch (createError) {
              throw error; // Throw original auth error
            }
          } else if (employeeData && employeeData.auth_user_id) {
            // Employee exists with auth account, but password is wrong - show proper error
            throw error; // This will show "Invalid login credentials" which is correct
          } else {
            // No employee found either - show "Email Not Found" error
            throw error; // This will show "Invalid login credentials" which is correct
          }
        }
      } else if (error) {
        throw error;
      }

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
      } else {
        // Check if user is an employee - with retry for newly created accounts
        let employeeData = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!employeeData && retryCount < maxRetries) {
          const { data: empData } = await supabase
          .from('employees')
          .select('id, is_active')
          .eq('auth_user_id', userId)
          .maybeSingle();
          
          if (empData) {
            employeeData = empData;
          } else {
            // If not found, wait a bit and retry (for newly created accounts)
            await new Promise(resolve => setTimeout(resolve, 500));
            retryCount++;
          }
        }
        
        if (employeeData) {
          actualRole = 'employee';
        } else {
          // Check if user is an operator using metadata only
          const metadataRole = (data.session.user.app_metadata as any)?.role ?? (data.session.user.user_metadata as any)?.role;
          if (metadataRole === 'operator') {
            actualRole = 'operator';
          }
        }
      }

      // If no role found in database, check user metadata as fallback
      if (!actualRole) {
        const metadataRole = (data.session.user.app_metadata as any)?.role ?? (data.session.user.user_metadata as any)?.role;
        
        if (metadataRole === 'operator') {
          actualRole = 'operator';
        } else {
          // Final fallback: check if employee exists by email (in case auth_user_id wasn't set)
          const { data: employeeByEmail } = await supabase
            .from('employees')
            .select('id, first_name, last_name, company_id')
            .eq('email', email)
            .maybeSingle();
          
          if (employeeByEmail) {
            // Employee exists but auth_user_id wasn't set - update it now
            const { error: updateError } = await supabase
              .from('employees')
              .update({ auth_user_id: userId })
              .eq('id', employeeByEmail.id);
            
            if (!updateError) {
              actualRole = 'employee';
            }
          }
          
          if (!actualRole) {
          await supabase.auth.signOut();
          toast({
            title: t('login.noRoleFound') ?? 'Account Not Found',
            description: t('login.noRoleFoundDesc') ?? 'No account found for this email. Please register first.',
            variant: 'destructive'
          });
          return;
          }
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
          .select('is_active, is_approved, rejection_reason, rejected_at, first_name, last_name, must_change_password')
          .eq('auth_user_id', data.session.user.id)
          .maybeSingle();
          
        if (employeeError) {
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
          
          // Only check the database flag - this ensures change password is shown only once
          const mustChangePassword = employeeData.must_change_password === true;
          
          
          if (mustChangePassword) {
            // Redirect to employee page where change password form will be displayed
            navigate('/employee');
            toast({
              title: t('login.firstTimeLogin') ?? 'Primera vez iniciando sesión',
              description: t('login.changePasswordRequired') ?? 'Debe cambiar su contraseña antes de continuar.',
            });
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
          <div className="flex justify-center">
            <Link to="/">
              <Logo size="xl" variant="dark" />
            </Link>
          </div>
          <p className="text-gray-600 text-lg">{t('login.subtitle')}</p>
        </div>

        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center text-gray-800 font-semibold">{t('login.title')}</CardTitle>
            <CardDescription className="text-center text-gray-600">
              {t('login.description')}
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