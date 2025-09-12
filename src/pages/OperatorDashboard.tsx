import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Download,
  Filter,
  Search,
  Calendar,
  Banknote
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const OperatorDashboard = () => {
  const { toast } = useToast();
  const [selectedBatch, setSelectedBatch] = useState<string>("pending");
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock data for pending advances
  const pendingAdvances = [
    { id: 1, employee: "María González", company: "Empresa Ejemplo C.A.", amount: 200, fee: 10, netAmount: 190, requestTime: "10:30 AM", method: "PagoMóvil", phone: "0412-123-4567" },
    { id: 2, employee: "Carlos Rodríguez", company: "Empresa Ejemplo C.A.", amount: 150, fee: 7.5, netAmount: 142.5, requestTime: "10:45 AM", method: "Transferencia", account: "0102-1234-5678-9012" },
    { id: 3, employee: "Ana Martínez", company: "Empresa Ejemplo C.A.", amount: 300, fee: 15, netAmount: 285, requestTime: "11:00 AM", method: "PagoMóvil", phone: "0414-987-6543" },
    { id: 4, employee: "Luis Pérez", company: "Empresa Ejemplo C.A.", amount: 180, fee: 9, netAmount: 171, requestTime: "11:15 AM", method: "Transferencia", account: "0134-5678-9012-3456" },
  ];

  const processedBatches = [
    { id: "batch-001", date: "2024-01-15", time: "11:00 AM", count: 8, totalAmount: 1200, status: "completed" },
    { id: "batch-002", date: "2024-01-15", time: "3:00 PM", count: 5, totalAmount: 750, status: "completed" },
    { id: "batch-003", date: "2024-01-14", time: "11:00 AM", count: 12, totalAmount: 1800, status: "completed" },
  ];

  const totalPendingAmount = pendingAdvances.reduce((sum, advance) => sum + advance.amount, 0);
  const totalPendingFees = pendingAdvances.reduce((sum, advance) => sum + advance.fee, 0);

  const processBatch = async () => {
    setIsProcessing(true);
    
    // Simulate batch processing
    setTimeout(() => {
      toast({
        title: "Lote procesado",
        description: `${pendingAdvances.length} adelantos procesados exitosamente`,
      });
      setIsProcessing(false);
    }, 3000);
  };

  const uploadConfirmation = async () => {
    toast({
      title: "Confirmación subida",
      description: "Los comprobantes de transferencia han sido registrados",
    });
  };

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
                <h1 className="text-xl font-bold">Panel de Operaciones</h1>
                <p className="text-sm text-muted-foreground">Procesamiento manual de adelantos</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Próximo lote: 3:00 PM</span>
              </Badge>
              <Button variant="outline" asChild>
                <a href="/">Cerrar Sesión</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Adelantos Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{pendingAdvances.length}</div>
              <p className="text-xs text-muted-foreground">
                ${totalPendingAmount} USD total
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comisiones</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">${totalPendingFees}</div>
              <p className="text-xs text-muted-foreground">
                5% por transacción
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lotes Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">2</div>
              <p className="text-xs text-muted-foreground">
                11:00 AM y 3:00 PM
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Procesado</CardTitle>
              <Banknote className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">$3,750</div>
              <p className="text-xs text-muted-foreground">
                Últimos 3 lotes
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Adelantos Pendientes</TabsTrigger>
            <TabsTrigger value="batches">Lotes Procesados</TabsTrigger>
            <TabsTrigger value="confirmations">Confirmaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Adelantos Pendientes</CardTitle>
                    <CardDescription>
                      Procesar el próximo lote de adelantos
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtrar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                    <Button 
                      variant="hero" 
                      onClick={processBatch}
                      disabled={isProcessing || pendingAdvances.length === 0}
                    >
                      {isProcessing ? "Procesando..." : "Procesar Lote"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingAdvances.map((advance) => (
                    <div key={advance.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {advance.employee.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{advance.employee}</div>
                          <div className="text-sm text-muted-foreground">{advance.company}</div>
                          <div className="text-xs text-muted-foreground">
                            {advance.method}: {advance.method === "PagoMóvil" ? advance.phone : advance.account}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="font-semibold">${advance.amount}</div>
                          <div className="text-sm text-muted-foreground">
                            Comisión: ${advance.fee}
                          </div>
                          <div className="text-sm text-primary font-medium">
                            Neto: ${advance.netAmount}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">{advance.requestTime}</div>
                          <Badge variant="secondary">Pendiente</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batches" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle>Lotes Procesados</CardTitle>
                <CardDescription>
                  Historial de lotes procesados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {processedBatches.map((batch) => (
                    <div key={batch.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">Lote {batch.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {batch.date} - {batch.time}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="font-semibold">{batch.count} adelantos</div>
                          <div className="text-sm text-muted-foreground">
                            Total: ${batch.totalAmount}
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {batch.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="confirmations" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Confirmar Transferencias</CardTitle>
                    <CardDescription>
                      Subir comprobantes de transferencias realizadas
                    </CardDescription>
                  </div>
                  <Button variant="hero" onClick={uploadConfirmation}>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Comprobantes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Subir Comprobantes</h3>
                    <p className="text-muted-foreground mb-4">
                      Sube los comprobantes de las transferencias realizadas para confirmar los pagos
                    </p>
                    <Button variant="outline">
                      Seleccionar Archivos
                    </Button>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Instrucciones:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Sube comprobantes de PagoMóvil o transferencias bancarias</li>
                      <li>• Los archivos deben estar en formato PDF o imagen</li>
                      <li>• Cada comprobante debe corresponder a un adelanto específico</li>
                      <li>• El sistema marcará automáticamente los adelantos como completados</li>
                    </ul>
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