import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

const CompanyConfiguration = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Mock company data
  const [companyInfo, setCompanyInfo] = useState({
    name: "Empresa Ejemplo C.A.",
    rif: "J-12345678-9",
    email: "admin@empresa.com",
    phone: "+58-212-555-0123",
    address: "Av. Principal, Torre Empresarial, Piso 12",
    city: "Caracas",
    state: "Miranda",
    postalCode: "1060"
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

  const handleSaveSettings = async () => {
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
            <Button onClick={handleSaveSettings} disabled={isLoading}>
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
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span>{t('config.company.title')}</span>
                </CardTitle>
                <CardDescription>
                  {t('config.company.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">{t('config.company.businessName')}</Label>
                    <Input
                      id="company-name"
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rif">{t('config.company.rif')}</Label>
                    <Input
                      id="rif"
                      value={companyInfo.rif}
                      onChange={(e) => setCompanyInfo({...companyInfo, rif: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('config.company.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('config.company.phone')}</Label>
                    <Input
                      id="phone"
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('config.company.addressTitle')}</h3>
                  <div className="grid md:grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">{t('config.company.address')}</Label>
                      <Input
                        id="address"
                        value={companyInfo.address}
                        onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">{t('config.company.city')}</Label>
                      <Input
                        id="city"
                        value={companyInfo.city}
                        onChange={(e) => setCompanyInfo({...companyInfo, city: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">{t('config.company.state')}</Label>
                      <Input
                        id="state"
                        value={companyInfo.state}
                        onChange={(e) => setCompanyInfo({...companyInfo, state: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal-code">{t('config.company.postalCode')}</Label>
                      <Input
                        id="postal-code"
                        value={companyInfo.postalCode}
                        onChange={(e) => setCompanyInfo({...companyInfo, postalCode: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods */}
          <TabsContent value="payment" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>{t('config.payment.title')}</span>
                </CardTitle>
                <CardDescription>
                  {t('config.payment.subtitle')}
                </CardDescription>
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
                      <Input id="fee-rate" type="number" defaultValue="5" min="0" max="10" step="0.1" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min-fee">{t('config.payment.minCommission')}</Label>
                      <Input id="min-fee" type="number" defaultValue="1" min="0.5" step="0.5" />
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
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <span>{t('config.notifications.title')}</span>
                </CardTitle>
                <CardDescription>
                  {t('config.notifications.subtitle')}
                </CardDescription>
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
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>{t('config.security.title')}</span>
                </CardTitle>
                <CardDescription>
                  {t('config.security.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{t('config.security.twoFactorAuth')}</div>
                      <div className="text-sm text-muted-foreground">{t('config.security.twoFactorAuthDesc')}</div>
                    </div>
                    <Switch
                      checked={security.twoFactorAuth}
                      onCheckedChange={(checked) => setSecurity({...security, twoFactorAuth: checked})}
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
                <CardTitle className="flex items-center space-x-2">
                  <Plug className="h-5 w-5 text-primary" />
                  <span>{t('config.integrations.title')}</span>
                </CardTitle>
                <CardDescription>
                  {t('config.integrations.subtitle')}
                </CardDescription>
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
                      <Button variant="outline" size="sm">{t('config.integrations.connect')}</Button>
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
                      <Button variant="outline" size="sm">{t('config.integrations.testConnection')}</Button>
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
                      <Button variant="outline" size="sm">{t('config.integrations.manage')}</Button>
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
                      <Button variant="outline" size="sm" className="mt-2">
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
    </div>
  );
};

export default CompanyConfiguration;