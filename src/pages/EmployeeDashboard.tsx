import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AdvanceRequestForm } from "@/components/AdvanceRequestForm";
import { 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Calendar,
  CreditCard,
  Download,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const EmployeeDashboard = () => {
  const { t } = useLanguage();
  // Mock data
  const employeeData = {
    name: "María González",
    monthlySalary: 800,
    workedDays: 12,
    totalDays: 22,
    earnedAmount: 436.36,
    availableAmount: 349.09, // 80% of earned
    usedAmount: 150,
    pendingAdvances: 1
  };

  const progressPercentage = (employeeData.workedDays / employeeData.totalDays) * 100;

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
                <h1 className="text-xl font-bold">{t('employee.welcome').replace('{name}', employeeData.name)}</h1>
                <p className="text-sm text-muted-foreground">{t('employee.panel')}</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/">{t('dashboard.logout')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('employee.availableAdvance')}</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">${employeeData.availableAmount}</div>
              <p className="text-xs text-muted-foreground">
                {t('employee.ofEarned').replace('${amount}', employeeData.earnedAmount.toString())}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('employee.monthlySalary')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${employeeData.monthlySalary}</div>
              <p className="text-xs text-muted-foreground">
                {t('employee.daysWorked').replace('{worked}', employeeData.workedDays.toString()).replace('{total}', employeeData.totalDays.toString())}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('employee.advancesUsed')}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${employeeData.usedAmount}</div>
              <p className="text-xs text-muted-foreground">
                {t('employee.thisPeriod')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('employee.pending')}</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeData.pendingAdvances}</div>
              <p className="text-xs text-muted-foreground">
                {t('employee.advanceInProcess')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Request Advance */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span>{t('employee.requestAdvance')}</span>
                </CardTitle>
                <CardDescription>
                  {t('employee.requestDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Indicators */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{t('employee.daysWorkedMonth')}</span>
                      <span>{employeeData.workedDays} / {employeeData.totalDays} {t('employee.days')}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{t('employee.availableAmount')}</span>
                      <span>${employeeData.availableAmount} USD</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                </div>

                {/* Request Form */}
                <div className="bg-gradient-hero p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold">{t('employee.newAdvance')}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('employee.requestedAmount')}</span>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">$50</Button>
                        <Button variant="outline" size="sm">$100</Button>
                        <Button variant="outline" size="sm">$200</Button>
                        <Button variant="premium" size="sm">{t('employee.maximum')}</Button>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-background">
                      <div className="text-3xl font-bold text-center text-primary">$200.00</div>
                      <div className="text-center text-sm text-muted-foreground">{t('employee.amountToRequest')}</div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>{t('employee.grossAmount')}</span>
                        <span>$200.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('employee.commission')}</span>
                        <span className="text-destructive">-$10.00</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>{t('employee.youWillReceive')}</span>
                        <span className="text-primary">$190.00</span>
                      </div>
                    </div>

                    <Button className="w-full" variant="hero" size="lg" asChild>
                      <Link to="/employee/request-advance">
                        {t('employee.requestButton')}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t('employee.advanceHistory')}</span>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    {t('employee.export')}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Clock className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium">$150.00</div>
                        <div className="text-sm text-muted-foreground">{t('employee.today')}, 10:30 AM</div>
                      </div>
                    </div>
                    <Badge variant="secondary">{t('employee.inProcess')}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">$200.00</div>
                        <div className="text-sm text-muted-foreground">{t('employee.ago')} 3 {t('employee.daysCount')}</div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{t('employee.completed')}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">$100.00</div>
                        <div className="text-sm text-muted-foreground">{t('employee.ago')} 1 {t('employee.week')}</div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{t('employee.completed')}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-none shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">{t('employee.paymentMethods')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">PagoMóvil</div>
                    <div className="text-sm text-muted-foreground">0412-123-4567</div>
                  </div>
                  <Badge>{t('employee.main')}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Banco Venezuela</div>
                    <div className="text-sm text-muted-foreground">****-****-**-1234</div>
                  </div>
                  <Badge variant="outline">{t('employee.backup')}</Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  {t('employee.paymentNote')}
                </p>
              </CardContent>
            </Card>

            {/* Next Payroll */}
            <Card className="border-none shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>{t('employee.nextPayroll')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">15 {t('employee.daysCount')}</div>
                  <div className="text-sm text-muted-foreground">31 de enero, 2024</div>
                  <div className="text-sm">
                    {t('employee.willDeduct')} <span className="font-semibold text-destructive">$150</span> {t('employee.advances')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card className="border-none shadow-card border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <span>{t('employee.needHelp')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('employee.supportDescription')}
                </p>
                <Button variant="outline" className="w-full">
                  {t('employee.contactSupport')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;