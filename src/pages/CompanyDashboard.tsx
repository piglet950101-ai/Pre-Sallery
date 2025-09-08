import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  FileText,
  Settings,
  Plus,
  Download,
  Search,
  Filter
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const CompanyDashboard = () => {
  const { t } = useLanguage();
  // Mock data
  const companyData = {
    name: "Empresa Ejemplo C.A.",
    rif: "J-12345678-9",
    activeEmployees: 156,
    totalAdvances: 45860,
    pendingAdvances: 8,
    monthlyFees: 156,
    weeklyBilling: 12430
  };

  const recentAdvances = [
    { id: 1, employee: "María González", amount: 200, status: "approved", date: "Hoy, 10:30 AM" },
    { id: 2, employee: "Carlos Rodríguez", amount: 150, status: "pending", date: "Hoy, 09:15 AM" },
    { id: 3, employee: "Ana Martínez", amount: 300, status: "completed", date: "Ayer, 14:20 PM" },
    { id: 4, employee: "Luis Pérez", amount: 180, status: "completed", date: "Ayer, 11:45 AM" },
  ];

  const employees = [
    { id: 1, name: "María González", cedula: "V-12345678", salary: 800, status: "active", lastAdvance: "Hace 2 días" },
    { id: 2, name: "Carlos Rodríguez", cedula: "V-23456789", salary: 750, status: "active", lastAdvance: "Hace 5 días" },
    { id: 3, name: "Ana Martínez", cedula: "V-34567890", salary: 900, status: "active", lastAdvance: "Hace 1 día" },
    { id: 4, name: "Luis Pérez", cedula: "V-45678901", salary: 700, status: "pending", lastAdvance: "Nunca" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{companyData.name}</h1>
                <p className="text-sm text-muted-foreground">{t('company.panel')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" asChild>
                <Link to="/company/configuration">
                  <Settings className="h-4 w-4 mr-2" />
                  {t('company.configuration')}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">{t('dashboard.logout')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('company.activeEmployees')}</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{companyData.activeEmployees}</div>
              <p className="text-xs text-muted-foreground">
                ${companyData.monthlyFees} {t('company.monthlyFees')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('company.advancesThisMonth')}</CardTitle>
              <DollarSign className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${companyData.totalAdvances}</div>
              <p className="text-xs text-muted-foreground">
                +12% {t('company.vsLastMonth')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('common.pending')}</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companyData.pendingAdvances}</div>
              <p className="text-xs text-muted-foreground">
                {t('company.pendingApproval')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('company.weeklyBilling')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${companyData.weeklyBilling}</div>
              <p className="text-xs text-muted-foreground">
                {t('company.nextBill')} 15 Jan
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="advances" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="advances">{t('company.advances')}</TabsTrigger>
            <TabsTrigger value="employees">{t('company.employees')}</TabsTrigger>
            <TabsTrigger value="reports">{t('company.reports')}</TabsTrigger>
            <TabsTrigger value="billing">{t('company.billing')}</TabsTrigger>
          </TabsList>

          <TabsContent value="advances" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('company.recentAdvances')}</CardTitle>
                    <CardDescription>
                      {t('company.manageAdvances')}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      {t('company.filter')}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {t('employee.export')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAdvances.map((advance) => (
                    <div key={advance.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {advance.employee.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{advance.employee}</div>
                          <div className="text-sm text-muted-foreground">{advance.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-semibold">${advance.amount}</div>
                          <div className="text-sm text-muted-foreground">{t('company.request')}</div>
                        </div>
                        <div className="flex space-x-2">
                          {advance.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline">{t('company.reject')}</Button>
                              <Button size="sm" variant="premium">{t('company.approve')}</Button>
                            </>
                          )}
                          {advance.status === 'approved' && (
                            <Badge className="bg-blue-100 text-blue-800">{t('company.approved')}</Badge>
                          )}
                          {advance.status === 'completed' && (
                            <Badge className="bg-green-100 text-green-800">{t('employee.completed')}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('company.employeeManagement')}</CardTitle>
                    <CardDescription>
                      {t('company.managePayroll')}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder={t('company.searchEmployee')} className="pl-10 w-64" />
                    </div>
                    <Button variant="hero">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('company.addEmployee')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">{employee.cedula}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="font-medium">${employee.salary}{t('company.month')}</div>
                          <div className="text-sm text-muted-foreground">{t('company.lastAdvance')} {employee.lastAdvance}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {employee.status === 'active' && (
                            <Badge className="bg-green-100 text-green-800">{t('company.active')}</Badge>
                          )}
                          {employee.status === 'pending' && (
                            <Badge variant="secondary">{t('common.pending')}</Badge>
                          )}
                          <Button variant="outline" size="sm">{t('common.edit')}</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>{t('company.advanceReport')}</span>
                  </CardTitle>
                  <CardDescription>
                    {t('company.downloadReport')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{t('company.period')} Enero 2024</div>
                    <div className="text-sm text-muted-foreground">
                      {t('company.includesAll')}
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    {t('company.downloadCSV')}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>{t('company.usageAnalysis')}</span>
                  </CardTitle>
                  <CardDescription>
                    {t('company.usageStats')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{t('company.monthlyAverage')} $294</div>
                    <div className="text-sm text-muted-foreground">
                      78% {t('company.employeesUse')}
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    {t('company.viewFullReport')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle>{t('company.billingPayments')}</CardTitle>
                <CardDescription>
                  {t('company.manageBills')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gradient-hero p-6 rounded-lg">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">{t('company.nextInvoice')}</div>
                      <div className="text-2xl font-bold">${companyData.weeklyBilling}</div>
                      <div className="text-sm">{t('company.due')} 15 Enero, 2024</div>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-6 rounded-lg">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">{t('company.monthlyCommissions')}</div>
                      <div className="text-2xl font-bold">${companyData.monthlyFees}</div>
                      <div className="text-sm">{companyData.activeEmployees} {t('company.activeEmployeesCount')}</div>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-6 rounded-lg">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">{t('company.totalYear')}</div>
                      <div className="text-2xl font-bold">$126,340</div>
                      <div className="text-sm">+15% {t('company.vsPreviousYear')}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">{t('company.recentInvoices')}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{t('company.invoice')} #2024-001</div>
                        <div className="text-sm text-muted-foreground">1-7 Enero, 2024</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-semibold">$11,890</div>
                          <Badge className="bg-green-100 text-green-800">{t('company.paid')}</Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{t('company.invoice')} #2024-002</div>
                        <div className="text-sm text-muted-foreground">8-14 Enero, 2024</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-semibold">$12,430</div>
                          <Badge variant="secondary">{t('common.pending')}</Badge>
                        </div>
                        <Button variant="premium" size="sm">
                          Pagar Ahora
                        </Button>
                      </div>
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

export default CompanyDashboard;