import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Calendar as CalendarIcon, 
  Clock, 
  DollarSign, 
  Home, 
  Phone,
  MapPin,
  Building,
  Upload,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface EmployeeInfo {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cedula: string;
  birthDate: Date | null;
  yearOfEmployment: number;
  
  // Employment Information
  position: string;
  department: string;
  employmentStartDate: Date | null;
  employmentType: string; // "full-time" | "part-time" | "contract"
  weeklyHours: number;
  monthlySalary: number;
  
  // Financial Information
  livingExpenses: number;
  dependents: number;
  emergencyContact: string;
  emergencyPhone: string;
  
  // Address Information
  address: string;
  city: string;
  state: string;
  postalCode: string;
  
  // Banking Information
  bankName: string;
  accountNumber: string;
  accountType: string; // "savings" | "checking"
  
  // Additional Information
  notes: string;
}

interface EmployeeInfoFormProps {
  onSave: (employeeInfo: EmployeeInfo) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<EmployeeInfo>;
}

export const EmployeeInfoForm = ({ onSave, onCancel, isLoading = false, initialData }: EmployeeInfoFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<EmployeeInfo>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    cedula: initialData?.cedula || "",
    birthDate: initialData?.birthDate || null,
    yearOfEmployment: initialData?.yearOfEmployment || 0,
    position: initialData?.position || "",
    department: initialData?.department || "",
    employmentStartDate: initialData?.employmentStartDate || null,
    employmentType: initialData?.employmentType || "",
    weeklyHours: initialData?.weeklyHours || 40,
    monthlySalary: initialData?.monthlySalary || 0,
    livingExpenses: initialData?.livingExpenses || 0,
    dependents: initialData?.dependents || 0,
    emergencyContact: initialData?.emergencyContact || "",
    emergencyPhone: initialData?.emergencyPhone || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    postalCode: initialData?.postalCode || "",
    bankName: initialData?.bankName || "",
    accountNumber: initialData?.accountNumber || "",
    accountType: initialData?.accountType || "",
    notes: initialData?.notes || "",
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const updateField = (field: keyof EmployeeInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal Information
        return !!(formData.firstName && formData.lastName && formData.email && formData.yearOfEmployment > 0 && formData.weeklyHours > 0 && formData.livingExpenses >= 0);
      case 2: // Employment Information
        return !!(formData.position && formData.employmentStartDate && formData.employmentType && formData.monthlySalary > 0);
      case 3: // Financial Information
        return !!(formData.livingExpenses >= 0 && formData.emergencyContact && formData.emergencyPhone);
      case 4: // Address Information
        return !!(formData.address && formData.city && formData.state);
      case 5: // Banking Information
        return !!(formData.bankName && formData.accountNumber && formData.accountType);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast({
        title: "Información incompleta",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      onSave(formData);
    } else {
      toast({
        title: "Información incompleta",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  placeholder="María"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  placeholder="González"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="maria@ejemplo.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearOfEmployment">Año de empleo *</Label>
                <Input
                  id="yearOfEmployment"
                  type="number"
                  value={formData.yearOfEmployment || ""}
                  onChange={(e) => updateField("yearOfEmployment", parseInt(e.target.value) || 0)}
                  placeholder="2023"
                  min="2000"
                  max="2030"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weeklyHours">Horas de trabajo semanales *</Label>
                <Input
                  id="weeklyHours"
                  type="number"
                  value={formData.weeklyHours}
                  onChange={(e) => updateField("weeklyHours", parseInt(e.target.value) || 0)}
                  placeholder="40"
                  min="1"
                  max="80"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="livingExpenses">Gastos de vida mensuales (USD) *</Label>
              <Input
                id="livingExpenses"
                type="number"
                value={formData.livingExpenses}
                onChange={(e) => updateField("livingExpenses", parseFloat(e.target.value) || 0)}
                placeholder="500"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de nacimiento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.birthDate ? format(formData.birthDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.birthDate || undefined}
                    onSelect={(date) => updateField("birthDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Cargo *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => updateField("position", e.target.value)}
                  placeholder="Desarrollador"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => updateField("department", e.target.value)}
                  placeholder="Tecnología"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fecha de inicio de empleo *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.employmentStartDate ? format(formData.employmentStartDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.employmentStartDate || undefined}
                    onSelect={(date) => updateField("employmentStartDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Tipo de empleo *</Label>
                <Select value={formData.employmentType} onValueChange={(value) => updateField("employmentType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Tiempo completo</SelectItem>
                    <SelectItem value="part-time">Medio tiempo</SelectItem>
                    <SelectItem value="contract">Contrato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weeklyHours">Horas semanales</Label>
                <Input
                  id="weeklyHours"
                  type="number"
                  value={formData.weeklyHours}
                  onChange={(e) => updateField("weeklyHours", parseInt(e.target.value) || 0)}
                  placeholder="40"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlySalary">Salario mensual (USD) *</Label>
              <Input
                id="monthlySalary"
                type="number"
                value={formData.monthlySalary}
                onChange={(e) => updateField("monthlySalary", parseFloat(e.target.value) || 0)}
                placeholder="800"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="livingExpenses">Gastos de vida mensuales (USD)</Label>
                <Input
                  id="livingExpenses"
                  type="number"
                  value={formData.livingExpenses}
                  onChange={(e) => updateField("livingExpenses", parseFloat(e.target.value) || 0)}
                  placeholder="500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dependents">Número de dependientes</Label>
                <Input
                  id="dependents"
                  type="number"
                  value={formData.dependents}
                  onChange={(e) => updateField("dependents", parseInt(e.target.value) || 0)}
                  placeholder="2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Contacto de emergencia *</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => updateField("emergencyContact", e.target.value)}
                placeholder="Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Teléfono de emergencia *</Label>
              <Input
                id="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={(e) => updateField("emergencyPhone", e.target.value)}
                placeholder="+58 414 987-6543"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Av. Principal, Edificio ABC, Piso 5, Apt 501"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Caracas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  placeholder="Distrito Capital"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Código postal</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                  placeholder="1010"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Banco *</Label>
              <Select value={formData.bankName} onValueChange={(value) => updateField("bankName", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar banco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BDV">Banco de Venezuela</SelectItem>
                  <SelectItem value="Mercantil">Banco Mercantil</SelectItem>
                  <SelectItem value="Banesco">Banesco</SelectItem>
                  <SelectItem value="Venezuela">Banco de Venezuela</SelectItem>
                  <SelectItem value="Provincial">Banco Provincial</SelectItem>
                  <SelectItem value="BOD">BOD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Número de cuenta *</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => updateField("accountNumber", e.target.value)}
                  placeholder="0102-1234-5678-9012"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountType">Tipo de cuenta *</Label>
                <Select value={formData.accountType} onValueChange={(value) => updateField("accountType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Ahorros</SelectItem>
                    <SelectItem value="checking">Corriente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Información adicional sobre el empleado..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    const titles = [
      "Información Personal",
      "Información Laboral",
      "Información Financiera",
      "Dirección",
      "Información Bancaria"
    ];
    return titles[currentStep - 1];
  };

  const getStepIcon = () => {
    const icons = [User, Building, DollarSign, MapPin, Home];
    const Icon = icons[currentStep - 1];
    return <Icon className="h-5 w-5" />;
  };

  return (
    <Card className="border-none shadow-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStepIcon()}
            <CardTitle>{getStepTitle()}</CardTitle>
          </div>
          <Badge variant="outline">
            Paso {currentStep} de {totalSteps}
          </Badge>
        </div>
        <CardDescription>
          Información detallada del empleado
        </CardDescription>
        
        {/* Fee Notification */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Tarifa de Registro por Empleado
            </span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Se aplicará una tarifa única de <strong>$1 USD</strong> por cada empleado registrado. 
            Esta tarifa se cobra una sola vez al momento del registro y se factura junto con las comisiones de adelantos.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Anterior
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            {currentStep < totalSteps ? (
              <Button onClick={handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar Empleado"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
