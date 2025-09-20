import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  DollarSign,
  Building2,
  CreditCard,
  Bell,
  Users,
  Shield,
  Plug,
  Save,
  AlertCircle,
  CheckCircle,
  Settings,
  Edit,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const CompanyConfiguration = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  
  // Edit state for each section
  const [editingSections, setEditingSections] = useState<Set<string>>(new Set());

  // Company data
  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    rif: "",
    phone: "",
    address: ""
  });
  
  // Original company data for comparison
  const [originalCompanyInfo, setOriginalCompanyInfo] = useState({
    name: "",
    rif: "",
    phone: "",
    address: ""
  });

  const [notifications, setNotifications] = useState({
    emailAdvanceRequests: true,
    smsAdvanceRequests: false,
    emailWeeklyReports: true,
    emailBilling: true,
    pushNotifications: true
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    loginNotifications: true,
    sessionTimeout: 30,
    requireApprovalAmount: 500
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleSaveClick = () => {
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    setIsConfirmDialogOpen(false);
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast({
        title: t('config.settingsSaved'),
        description: t('config.settingsSavedDesc'),
      });
      setIsLoading(false);
    }, 1500);
  };

  const handleEditSection = (section: string) => {
    setEditingSections(prev => new Set(prev).add(section));
  };

  const handleSaveSection = async (section: string) => {
    if (section === 'company') {
      await saveCompanyData();
    } else {
      // For other sections, just simulate save
      setIsLoading(true);
      setTimeout(() => {
        setEditingSections(prev => {
          const newSet = new Set(prev);
          newSet.delete(section);
          return newSet;
        });
        toast({
          title: t('config.sectionSaved'),
          description: t('config.sectionSavedDesc').replace('{section}', t(`config.tabs.${section}`)),
        });
        setIsLoading(false);
      }, 1500);
    }
  };

  const saveCompanyData = async () => {
    if (!user) return;
    
    // Check if there are any changes compared to original data
    const hasChanges = companyInfo.name !== originalCompanyInfo.name ||
                      companyInfo.rif !== originalCompanyInfo.rif ||
                      companyInfo.phone !== originalCompanyInfo.phone ||
                      companyInfo.address !== originalCompanyInfo.address;
    
    if (!hasChanges) {
      toast({
        title: t('config.noChanges'),
        description: t('config.noChangesDesc'),
        variant: "default"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Update company data directly using auth_user_id
      const { data: updateData, error: updateError } = await supabase
        .from('companies')
        .update({
          name: companyInfo.name,
          rif: companyInfo.rif,
          phone: companyInfo.phone,
          address: companyInfo.address
        })
        .eq('auth_user_id', user.id)
        .select();

      if (updateError) {
        console.error('Error updating company data:', updateError);
        toast({
          title: t('common.error'),
          description: `Failed to update company data: ${updateError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Update original data to current data
      setOriginalCompanyInfo({
        name: companyInfo.name,
        rif: companyInfo.rif,
        phone: companyInfo.phone,
        address: companyInfo.address
      });

      // Remove from editing state and show success
      setEditingSections(prev => {
        const newSet = new Set(prev);
        newSet.delete('company');
        return newSet;
      });

      toast({
        title: t('config.sectionSaved'),
        description: t('config.sectionSavedDesc').replace('{section}', t('config.tabs.company')),
      });
    } catch (error) {
      console.error('Error saving company data:', error);
      toast({
        title: t('common.error'),
        description: 'An unexpected error occurred while saving company data',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = (section: string) => {
    setEditingSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(section);
      return newSet;
    });
  };

  const isEditing = (section: string) => editingSections.has(section);

  // Password change functions
  const handlePasswordChange = async () => {
    if (!user) return;

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('employee.profile.passwordRequired'),
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('employee.profile.passwordMismatch'),
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: t('common.error'),
        description: t('employee.profile.passwordTooShort'),
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // Store current session to restore after password verification
      const { data: { session } } = await supabase.auth.getSession();
      
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwordData.currentPassword
      });

      if (signInError) {
        toast({
          title: t('common.error'),
          description: t('employee.profile.passwordIncorrect'),
          variant: "destructive"
        });
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        console.error('Error updating password:', updateError);
        toast({
          title: t('common.error'),
          description: 'Failed to update password',
          variant: "destructive"
        });
        return;
      }

      // Restore original session to prevent re-rendering
      if (session) {
        await supabase.auth.setSession(session);
      }

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast({
        title: t('employee.profile.passwordUpdated'),
        description: 'Your password has been updated successfully',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: t('common.error'),
        description: 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  // Fetch company data
  const fetchCompanyData = async () => {
    if (!user) return;
    
    setIsLoadingCompany(true);
    try {
      // Direct lookup using auth_user_id in companies table
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (companyError) {
        console.error('Error fetching company data:', companyError);
        toast({
          title: t('common.error'),
          description: 'Failed to fetch company data. Please contact support.',
          variant: "destructive"
        });
        return;
      }

      if (!company) {
        console.error('No company found for user');
        toast({
          title: t('common.error'),
          description: 'No company associated with this user. Please contact support.',
          variant: "destructive"
        });
        return;
      }

      const companyData = {
        name: company.name || "",
        rif: company.rif || "",
        phone: company.phone || "",
        address: company.address || ""
      };
      setCompanyInfo(companyData);
      setOriginalCompanyInfo(companyData); // Store original data for comparison
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast({
        title: t('common.error'),
        description: 'An unexpected error occurred while loading company data',
        variant: "destructive"
      });
    } finally {
      setIsLoadingCompany(false);
    }
  };

  // Fetch company data on component mount
  useEffect(() => {
    fetchCompanyData();
  }, [user]);

  const renderSectionActions = (section: string) => {
    if (isEditing(section)) {
      return (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleCancelEdit(section)}
          >
            <X className="h-4 w-4 mr-2" />
            {t('config.cancel')}
          </Button>
          <Button 
            size="sm" 
            onClick={() => handleSaveSection(section)}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('config.saving')}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>{t('config.saveChanges')}</span>
              </div>
            )}
          </Button>
        </div>
      );
    }

    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleEditSection(section)}
        className="text-muted-foreground hover:text-primary"
        disabled={section === 'company' && isLoadingCompany}
      >
        {section === 'company' && isLoadingCompany ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
        ) : (
          <Edit className="h-4 w-4 mr-2" />
        )}
        {section === 'company' && isLoadingCompany ? t('common.loading') : t('config.edit')}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/company" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t('config.backToDashboard')}</span>
                </Link>
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{t('config.title')}</h1>
                  <p className="text-sm text-muted-foreground">{t('config.subtitle')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="company">{t('config.tabs.company')}</TabsTrigger>
            <TabsTrigger value="payment">{t('config.tabs.payment')}</TabsTrigger>
            <TabsTrigger value="notifications">{t('config.tabs.notifications')}</TabsTrigger>
            <TabsTrigger value="security">{t('config.tabs.security')}</TabsTrigger>
            <TabsTrigger value="integrations">{t('config.tabs.integrations')}</TabsTrigger>
          </TabsList>

          {/* Company Information */}
          <TabsContent value="company" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span>{t('config.company.title')}</span>
                    </CardTitle>
                    <CardDescription>
                      {t('config.company.subtitle')}
                    </CardDescription>
                  </div>
                  {renderSectionActions('company')}
                </div>
              </CardHeader>
                     <CardContent className="space-y-6">
                       <div className="space-y-3">
                         <Label htmlFor="company-name" className="text-base">{t('config.company.businessName')}</Label>
                         <Input
                           id="company-name"
                           value={companyInfo.name}
                           onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                           disabled={!isEditing('company') || isLoadingCompany}
                           placeholder={isLoadingCompany ? t('common.loading') : t('register.companyNamePlaceholder')}
                           className="h-12 text-base"
                         />
                       </div>
                       
                       <div className="space-y-3">
                         <Label htmlFor="rif" className="text-base">{t('config.company.rif')}</Label>
                         <Input
                           id="rif"
                           value={companyInfo.rif}
                           onChange={(e) => setCompanyInfo({...companyInfo, rif: e.target.value})}
                           disabled={!isEditing('company') || isLoadingCompany}
                           placeholder={isLoadingCompany ? t('common.loading') : 'J-12345678-9'}
                           className="h-12 text-base"
                         />
                       </div>
                       
                       <div className="space-y-3">
                         <Label htmlFor="address" className="text-base">{t('config.company.address')}</Label>
                         <Textarea
                           id="address"
                           value={companyInfo.address}
                           onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                           disabled={!isEditing('company') || isLoadingCompany}
                           placeholder={isLoadingCompany ? t('common.loading') : t('register.companyAddressPlaceholder')}
                           className="min-h-[80px] text-base"
                         />
                       </div>

                       <div className="space-y-3">
                         <Label htmlFor="email" className="text-base">{t('config.company.email')}</Label>
                         <Input
                           id="email"
                           type="email"
                           value={user?.email || ''}
                           disabled={true}
                           className="h-12 text-base bg-muted"
                         />
                         <p className="text-sm text-muted-foreground">
                           {t('config.company.emailNote') || 'Email is managed through your account settings'}
                         </p>
                       </div>

                       <div className="space-y-3">
                         <Label htmlFor="phone" className="text-base">{t('config.company.phone')}</Label>
                         <Input
                           id="phone"
                           value={companyInfo.phone}
                           onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                           disabled={!isEditing('company') || isLoadingCompany}
                           placeholder={isLoadingCompany ? t('common.loading') : t('register.companyPhonePlaceholder')}
                           className="h-12 text-base"
                         />
                       </div>

                     </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods */}
          <TabsContent value="payment" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <span>{t('config.payment.title')}</span>
                    </CardTitle>
                    <CardDescription>
                      {t('config.payment.subtitle')}
                    </CardDescription>
                  </div>
                  {renderSectionActions('payment')}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('config.payment.advanceMethodsTitle')}</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{t('config.payment.pagoMovil')}</div>
                          <div className="text-sm text-muted-foreground">{t('config.payment.instantPayments')}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-green-100 text-green-800">{t('config.payment.active')}</Badge>
                        <Button variant="outline" size="sm">{t('config.payment.configure')}</Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{t('config.payment.bankTransfer')}</div>
                          <div className="text-sm text-muted-foreground">{t('config.payment.bankVenezuela')}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-green-100 text-green-800">{t('config.payment.active')}</Badge>
                        <Button variant="outline" size="sm">{t('config.payment.configure')}</Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('config.payment.commissionsTitle')}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fee-rate">{t('config.payment.commissionRate')}</Label>
                      <Input 
                        id="fee-rate" 
                        type="number" 
                        defaultValue="5" 
                        min="0" 
                        max="10" 
                        step="0.1" 
                        disabled={!isEditing('payment')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min-fee">{t('config.payment.minCommission')}</Label>
                      <Input 
                        id="min-fee" 
                        type="number" 
                        defaultValue="1" 
                        min="0.5" 
                        step="0.5" 
                        disabled={!isEditing('payment')}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="h-5 w-5 text-primary" />
                      <span>{t('config.notifications.title')}</span>
                    </CardTitle>
                    <CardDescription>
                      {t('config.notifications.subtitle')}
                    </CardDescription>
                  </div>
                  {renderSectionActions('notifications')}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{t('config.notifications.advanceRequestsEmail')}</div>
                      <div className="text-sm text-muted-foreground">{t('config.notifications.advanceRequestsEmailDesc')}</div>
                    </div>
                    <Switch
                      checked={notifications.emailAdvanceRequests}
                      onCheckedChange={(checked) => setNotifications({...notifications, emailAdvanceRequests: checked})}
                      disabled={!isEditing('notifications')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{t('config.notifications.advanceRequestsSms')}</div>
                      <div className="text-sm text-muted-foreground">{t('config.notifications.advanceRequestsSmsDesc')}</div>
                    </div>
                    <Switch
                      checked={notifications.smsAdvanceRequests}
                      onCheckedChange={(checked) => setNotifications({...notifications, smsAdvanceRequests: checked})}
                      disabled={!isEditing('notifications')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{t('config.notifications.weeklyReports')}</div>
                      <div className="text-sm text-muted-foreground">{t('config.notifications.weeklyReportsDesc')}</div>
                    </div>
                    <Switch
                      checked={notifications.emailWeeklyReports}
                      onCheckedChange={(checked) => setNotifications({...notifications, emailWeeklyReports: checked})}
                      disabled={!isEditing('notifications')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{t('config.notifications.billingNotifications')}</div>
                      <div className="text-sm text-muted-foreground">{t('config.notifications.billingNotificationsDesc')}</div>
                    </div>
                    <Switch
                      checked={notifications.emailBilling}
                      onCheckedChange={(checked) => setNotifications({...notifications, emailBilling: checked})}
                      disabled={!isEditing('notifications')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{t('config.notifications.pushNotifications')}</div>
                      <div className="text-sm text-muted-foreground">{t('config.notifications.pushNotificationsDesc')}</div>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => setNotifications({...notifications, pushNotifications: checked})}
                      disabled={!isEditing('notifications')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

                 {/* Security */}
                 <TabsContent value="security" className="space-y-6">
                   <Card className="border-none shadow-elegant">
                     <CardHeader>
                       <div className="flex items-center justify-between">
                         <div>
                           <CardTitle className="flex items-center space-x-2">
                             <Shield className="h-5 w-5 text-primary" />
                             <span>{t('config.security.title')}</span>
                           </CardTitle>
                           <CardDescription>
                             {t('config.security.subtitle')}
                           </CardDescription>
                         </div>
                         {renderSectionActions('security')}
                       </div>
                     </CardHeader>
                     <CardContent className="space-y-6">
                       {/* Change Password Section */}
                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <div>
                             <h3 className="text-lg font-semibold">{t('config.security.changePassword')}</h3>
                             <p className="text-sm text-muted-foreground">{t('config.security.changePasswordDesc')}</p>
                           </div>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => setIsChangingPassword(!isChangingPassword)}
                           >
                             {isChangingPassword ? t('config.cancel') : t('config.security.changePassword')}
                           </Button>
                         </div>

                         {isChangingPassword && (
                           <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                             <div className="space-y-2">
                               <Label htmlFor="current-password">{t('config.security.currentPassword')}</Label>
                               <Input
                                 id="current-password"
                                 type="password"
                                 value={passwordData.currentPassword}
                                 onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                 placeholder={t('config.security.currentPasswordPlaceholder')}
                                 className="h-12"
                               />
                             </div>

                             <div className="space-y-2">
                               <Label htmlFor="new-password">{t('config.security.newPassword')}</Label>
                               <Input
                                 id="new-password"
                                 type="password"
                                 value={passwordData.newPassword}
                                 onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                 placeholder={t('config.security.newPasswordPlaceholder')}
                                 className="h-12"
                               />
                             </div>

                             <div className="space-y-2">
                               <Label htmlFor="confirm-password">{t('config.security.confirmPassword')}</Label>
                               <Input
                                 id="confirm-password"
                                 type="password"
                                 value={passwordData.confirmPassword}
                                 onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                 placeholder={t('config.security.confirmPasswordPlaceholder')}
                                 className="h-12"
                               />
                             </div>

                             <div className="flex space-x-2">
                               <Button
                                 onClick={handlePasswordChange}
                                 disabled={isUpdatingPassword}
                                 className="flex-1"
                               >
                                 {isUpdatingPassword ? (
                                   <div className="flex items-center space-x-2">
                                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                     <span>{t('config.security.updatingPassword')}</span>
                                   </div>
                                 ) : (
                                   t('config.security.updatePassword')
                                 )}
                               </Button>
                               <Button
                                 variant="outline"
                                 onClick={handleCancelPasswordChange}
                                 disabled={isUpdatingPassword}
                                 className="flex-1"
                               >
                                 {t('config.cancel')}
                               </Button>
                             </div>
                           </div>
                         )}
                       </div>

                       <Separator />

                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <div>
                             <div className="font-medium">{t('config.security.twoFactorAuth')}</div>
                             <div className="text-sm text-muted-foreground">{t('config.security.twoFactorAuthDesc')}</div>
                           </div>
                           <Switch
                             checked={security.twoFactorAuth}
                             onCheckedChange={(checked) => setSecurity({...security, twoFactorAuth: checked})}
                             disabled={!isEditing('security')}
                           />
                         </div>

                         <div className="flex items-center justify-between">
                           <div>
                             <div className="font-medium">{t('config.security.loginNotifications')}</div>
                             <div className="text-sm text-muted-foreground">{t('config.security.loginNotificationsDesc')}</div>
                           </div>
                           <Switch
                             checked={security.loginNotifications}
                             onCheckedChange={(checked) => setSecurity({...security, loginNotifications: checked})}
                             disabled={!isEditing('security')}
                           />
                         </div>

                         <div className="space-y-2">
                           <Label htmlFor="session-timeout">{t('config.security.sessionTimeout')}</Label>
                           <Input
                             id="session-timeout"
                             type="number"
                             value={security.sessionTimeout}
                             onChange={(e) => setSecurity({...security, sessionTimeout: parseInt(e.target.value)})}
                             min="5"
                             max="480"
                             disabled={!isEditing('security')}
                           />
                         </div>

                         <div className="space-y-2">
                           <Label htmlFor="approval-amount">{t('config.security.approvalAmount')}</Label>
                           <Input
                             id="approval-amount"
                             type="number"
                             value={security.requireApprovalAmount}
                             onChange={(e) => setSecurity({...security, requireApprovalAmount: parseInt(e.target.value)})}
                             min="100"
                             disabled={!isEditing('security')}
                           />
                           <p className="text-xs text-muted-foreground">
                             Adelantos mayores a este monto requerirán aprobación manual
                           </p>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Plug className="h-5 w-5 text-primary" />
                      <span>{t('config.integrations.title')}</span>
                    </CardTitle>
                    <CardDescription>
                      {t('config.integrations.subtitle')}
                    </CardDescription>
                  </div>
                  {renderSectionActions('integrations')}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{t('config.integrations.payrollSystem')}</div>
                        <div className="text-sm text-muted-foreground">{t('config.integrations.payrollSystemDesc')}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{t('config.integrations.notConnected')}</Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={!isEditing('integrations')}
                      >
                        {t('config.integrations.connect')}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{t('config.integrations.bankingApi')}</div>
                        <div className="text-sm text-muted-foreground">{t('config.integrations.bankingApiDesc')}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-green-100 text-green-800">{t('config.integrations.connected')}</Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={!isEditing('integrations')}
                      >
                        {t('config.integrations.testConnection')}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{t('config.integrations.hrSystem')}</div>
                        <div className="text-sm text-muted-foreground">{t('config.integrations.hrSystemDesc')}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{t('config.integrations.configure')}</Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={!isEditing('integrations')}
                      >
                        {t('config.integrations.manage')}
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-primary/5 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-medium text-primary">{t('config.integrations.customIntegrationTitle')}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('config.integrations.customIntegrationDesc')}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        disabled={!isEditing('integrations')}
                      >
                        {t('config.integrations.contactSupport')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Confirmation Modal */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Save className="h-5 w-5 text-primary" />
              <span>{t('config.confirmSaveTitle')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('config.confirmSaveDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)} 
              className="flex-1 sm:flex-none"
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleConfirmSave} 
              className="flex-1 sm:flex-none"
            >
              <Save className="h-4 w-4 mr-2" />
              {t('config.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CompanyConfiguration;