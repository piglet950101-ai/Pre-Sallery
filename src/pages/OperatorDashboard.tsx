import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  DollarSign, 
  Download, 
  Upload,
  AlertTriangle,
  CheckCircle,
  Users,
  Banknote,
  FileSpreadsheet,
  Activity
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const OperatorDashboard = () => {
  const { t } = useLanguage();
  // Mock data
  const operatorData = {
    nextBatchTime: "11:00 AM",
    pendingTransfers: 23,
    pendingAmount: 4580,
    todayProcessed: 156,
    todayAmount: 18940,
    failedTransfers: 3,
    reconciliationPending: 5
  };

  const currentBatch = [
    { id: 1, employee: "María González", company: "Empresa A", amount: 200, method: "PagoMóvil", phone: "0412-123-4567" },
    { id: 2, employee: "Carlos Rodríguez", company: "Empresa B", amount: 150, method: "Banco", account: "****1234" },
    { id: 3, employee: "Ana Martínez", company: "Empresa A", amount: 300, method: "PagoMóvil", phone: "0414-567-8901" },
    { id: 4, employee: "Luis Pérez", company: "Empresa C", amount: 180, method: "Banco", account: "****5678" },
  ];

  const exceptions = [
    { id: 1, employee: "Pedro Silva", amount: 250, error: "Teléfono no registrado en PagoMóvil", time: "10:30 AM" },
    { id: 2, employee: "Carmen López", amount: 120, error: "Cuenta bancaria inválida", time: "09:45 AM" },
    { id: 3, employee: "Roberto Chen", amount: 180, error: "Monto excede límite diario", time: "09:20 AM" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{t('operator.operationsCenter')}</h1>
                <p className="text-sm text-muted-foreground">{t('operator.operatorPanel')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-muted/50 px-3 py-2 rounded-lg">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t('operator.nextBatch')} {operatorData.nextBatchTime}</span>
              </div>
              <Button variant="outline" asChild>
                <Link to="/">{t('dashboard.logout')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('operator.pendingTransfers')}</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{operatorData.pendingTransfers}</div>
              <p className="text-xs text-muted-foreground">
                ${operatorData.pendingAmount} {t('operator.totalAmount')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('operator.processedToday')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{operatorData.todayProcessed}</div>
              <p className="text-xs text-muted-foreground">
                ${operatorData.todayAmount} {t('operator.totalAmount')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('operator.exceptions')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{operatorData.failedTransfers}</div>
              <p className="text-xs text-muted-foreground">
                {t('operator.manualAttention')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('operator.reconciliation')}</CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{operatorData.reconciliationPending}</div>
              <p className="text-xs text-muted-foreground">
                {t('operator.unconfirmedBatches')}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="batch" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="batch">{t('operator.currentBatch')}</TabsTrigger>
            <TabsTrigger value="reconciliation">{t('operator.reconciliation')}</TabsTrigger>
            <TabsTrigger value="exceptions">{t('operator.exceptions')}</TabsTrigger>
            <TabsTrigger value="history">{t('operator.history')}</TabsTrigger>
          </TabsList>

          <TabsContent value="batch" className="space-y-6">
            {/* Batch Progress */}
            <Card className="border-none shadow-elegant border-primary/20 bg-primary/5">
              <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>{t('operator.batchAt')} 11:00 AM</span>
              </CardTitle>
              <CardDescription>
                {t('operator.preparing')}
              </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('operator.progress')}</span>
                  <span className="text-sm font-medium">{operatorData.pendingTransfers} {t('operator.transfersCount')}</span>
                </div>
                <Progress value={75} className="h-2" />
                
                <div className="flex space-x-4 pt-4">
                  <Button variant="premium" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    {t('operator.generateCSV')}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Banknote className="h-4 w-4 mr-2" />
                    {t('operator.generatePagoMovil')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Batch Details */}
            <Card className="border-none shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('operator.queue')}</CardTitle>
                    <CardDescription>
                      {t('operator.queueDescription')}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{operatorData.pendingTransfers} {t('operator.pending')}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentBatch.map((transfer) => (
                    <div key={transfer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{transfer.employee}</div>
                          <div className="text-sm text-muted-foreground">{transfer.company}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-semibold">${transfer.amount}</div>
                          <div className="text-sm text-muted-foreground">
                            {transfer.method === 'PagoMóvil' ? transfer.phone : transfer.account}
                          </div>
                        </div>
                        <Badge variant={transfer.method === 'PagoMóvil' ? 'default' : 'secondary'}>
                          {transfer.method}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reconciliation" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  <span>{t('operator.reconciliationTitle')}</span>
                </CardTitle>
                <CardDescription>
                  {t('operator.reconciliationDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">{t('operator.uploadBankConfirmations')}</h4>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center space-y-4">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <div className="font-medium">{t('operator.dragCSV')}</div>
                        <div className="text-sm text-muted-foreground">{t('operator.orClick')}</div>
                      </div>
                      <Button variant="outline">
                        {t('operator.selectFileButton')}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">{t('operator.pendingBatches')}</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{t('operator.batchToday')}</div>
                          <div className="text-sm text-muted-foreground">45 {t('operator.transfersCount')}</div>
                        </div>
                        <Badge variant="secondary">{t('operator.waiting')}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{t('operator.batchYesterday')}</div>
                          <div className="text-sm text-muted-foreground">38 {t('operator.transfersCount')}</div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">{t('operator.confirmed')}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h5 className="font-medium mb-2">{t('operator.csvFormat')}</h5>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• {t('operator.csvColumns')}</div>
                    <div>• {t('operator.csvStates')}</div>
                    <div>• {t('operator.csvReference')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exceptions" className="space-y-6">
            <Card className="border-none shadow-elegant border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span>{t('operator.exceptionsHeader')}</span>
                </CardTitle>
                <CardDescription>
                  {t('operator.exceptionsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exceptions.map((exception) => (
                    <div key={exception.id} className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-background">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-destructive/10 rounded-full flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <div className="font-medium">{exception.employee}</div>
                          <div className="text-sm text-destructive">{exception.error}</div>
                          <div className="text-xs text-muted-foreground">{exception.time}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-semibold">${exception.amount}</div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            {t('operator.editButton')}
                          </Button>
                          <Button size="sm" variant="premium">
                            {t('operator.retryButton')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="border-none shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('operator.historyTitle')}</CardTitle>
                    <CardDescription>
                      {t('operator.historyDescription')}
                    </CardDescription>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    {t('operator.exportHistoryButton')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{t('operator.batchTime11')}</div>
                        <div className="text-sm text-muted-foreground">34 {t('operator.transfersProcessed')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">$6,890</div>
                      <Badge className="bg-green-100 text-green-800">{t('operator.completed')}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{t('operator.batchTime15')}</div>
                        <div className="text-sm text-muted-foreground">42 {t('operator.transfersProcessed')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">$8,540</div>
                      <Badge className="bg-green-100 text-green-800">{t('operator.completed')}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium">Lote 15:00 PM - Ayer</div>
                        <div className="text-sm text-muted-foreground">38 transferencias, 2 excepciones</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">$7,220</div>
                      <Badge variant="secondary">Procesando</Badge>
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

export default OperatorDashboard;