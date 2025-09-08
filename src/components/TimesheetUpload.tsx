import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Users,
  Calendar,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TimesheetData {
  id: string;
  employeeName: string;
  cedula: string;
  period: string;
  workingDays: number;
  monthlySalary: number;
  earnedAmount: number;
  availableAdvance: number;
  status: 'pending' | 'processed' | 'error';
}

interface TimesheetUploadProps {
  userType: 'company' | 'employee';
}

export const TimesheetUpload = ({ userType }: TimesheetUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [timesheetData, setTimesheetData] = useState<TimesheetData[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Mock data for demonstration
  const mockTimesheetData: TimesheetData[] = [
    {
      id: '1',
      employeeName: 'María González',
      cedula: 'V-12345678',
      period: 'Enero 2024',
      workingDays: 15,
      monthlySalary: 800,
      earnedAmount: 545.45,
      availableAdvance: 436.36,
      status: 'processed'
    },
    {
      id: '2',
      employeeName: 'Carlos Rodríguez',
      cedula: 'V-23456789',
      period: 'Enero 2024',
      workingDays: 12,
      monthlySalary: 750,
      earnedAmount: 409.09,
      availableAdvance: 327.27,
      status: 'processed'
    },
    {
      id: '3',
      employeeName: 'Ana Martínez',
      cedula: 'V-34567890',
      period: 'Enero 2024',
      workingDays: 18,
      monthlySalary: 900,
      earnedAmount: 780.00,
      availableAdvance: 624.00,
      status: 'pending'
    }
  ];

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    
    // Simulate processing
    setTimeout(() => {
      setTimesheetData(mockTimesheetData);
      setUploading(false);
      setSelectedFile(null);
      
      toast({
        title: "Planilla procesada exitosamente",
        description: `Se procesaron ${mockTimesheetData.length} empleados correctamente`,
      });
    }, 3000);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      toast({
        title: "Tipo de archivo inválido",
        description: "Solo se permiten archivos CSV o Excel",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
  };

  const downloadTemplate = () => {
    // In a real app, this would download a CSV template
    toast({
      title: "Descargando plantilla",
      description: "La plantilla CSV ha sido descargada",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge className="bg-green-100 text-green-800">Procesado</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
  };

  const totalEmployees = timesheetData.length;
  const totalEarned = timesheetData.reduce((sum, emp) => sum + emp.earnedAmount, 0);
  const totalAvailable = timesheetData.reduce((sum, emp) => sum + emp.availableAdvance, 0);

  if (userType === 'employee') {
    return (
      <Card className="border-none shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Mi Planilla de Tiempo</span>
          </CardTitle>
          <CardDescription>
            Visualiza tu información de asistencia y salario devengado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-hero p-6 rounded-lg">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Días trabajados</div>
                <div className="text-2xl font-bold">15 / 22</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Salario devengado</div>
                <div className="text-2xl font-bold text-primary">$545.45</div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            * Solo tu empresa puede actualizar la información de la planilla
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <span>Subir Planilla de Tiempo</span>
        </CardTitle>
        <CardDescription>
          Sube la planilla de asistencia para calcular los adelantos disponibles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Download */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium text-primary">Plantilla CSV</div>
                <div className="text-sm text-muted-foreground">
                  Descarga la plantilla para formatear correctamente tus datos
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>
        </div>

        {/* File Upload */}
        {!uploading && timesheetData.length === 0 && (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
            <div className="text-center space-y-4">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <div className="font-medium">Arrastra tu archivo CSV aquí</div>
                <div className="text-sm text-muted-foreground">o haz clic para seleccionar</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timesheet-file">
                  <Button variant="outline" className="cursor-pointer">
                    Seleccionar Archivo
                  </Button>
                  <Input
                    id="timesheet-file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </Label>
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    Archivo seleccionado: {selectedFile.name}
                  </div>
                )}
              </div>
              {selectedFile && (
                <Button 
                  onClick={() => handleFileUpload(selectedFile)}
                  variant="premium"
                  className="mt-4"
                >
                  Procesar Planilla
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {uploading && (
          <div className="text-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div className="font-medium">Procesando planilla...</div>
            <div className="text-sm text-muted-foreground">
              Calculando salarios devengados y adelantos disponibles
            </div>
          </div>
        )}

        {/* Results */}
        {timesheetData.length > 0 && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-hero p-4 rounded-lg text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Empleados</span>
                </div>
                <div className="text-2xl font-bold">{totalEmployees}</div>
              </div>
              <div className="bg-gradient-hero p-4 rounded-lg text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Devengado</span>
                </div>
                <div className="text-2xl font-bold">${totalEarned.toFixed(2)}</div>
              </div>
              <div className="bg-gradient-hero p-4 rounded-lg text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <DollarSign className="h-4 w-4 text-secondary" />
                  <span className="text-sm text-muted-foreground">Disponible (80%)</span>
                </div>
                <div className="text-2xl font-bold text-secondary">${totalAvailable.toFixed(2)}</div>
              </div>
            </div>

            <Separator />

            {/* Employee Details */}
            <div className="space-y-3">
              <h4 className="font-semibold">Detalle por Empleado</h4>
              {timesheetData.map((employee) => (
                <div key={employee.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {employee.employeeName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{employee.employeeName}</div>
                        <div className="text-sm text-muted-foreground">{employee.cedula}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(employee.status)}
                      {getStatusBadge(employee.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Días trabajados</div>
                      <div className="font-medium">{employee.workingDays} días</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Salario mensual</div>
                      <div className="font-medium">${employee.monthlySalary}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Devengado</div>
                      <div className="font-medium">${employee.earnedAmount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Disponible (80%)</div>
                      <div className="font-medium text-primary">${employee.availableAdvance.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setTimesheetData([])}>
                Subir Nueva Planilla
              </Button>
              <Button variant="premium">
                Aplicar Cambios
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h5 className="font-medium mb-2">Formato requerido del archivo CSV:</h5>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>• <strong>cedula:</strong> Número de cédula del empleado</div>
            <div>• <strong>nombre:</strong> Nombre completo</div>
            <div>• <strong>salario_mensual:</strong> Salario mensual en USD</div>
            <div>• <strong>dias_trabajados:</strong> Días trabajados en el período</div>
            <div>• <strong>periodo:</strong> Período correspondiente (ej: "Enero 2024")</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};