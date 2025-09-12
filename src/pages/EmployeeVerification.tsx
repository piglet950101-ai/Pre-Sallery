import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CheckCircle,
  AlertCircle,
  Edit,
  Save,
  X,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EmployeeProfile {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cedula: string;
  birthDate: Date | null;
  
  // Employment Information
  position: string;
  department: string;
  employmentStartDate: Date | null;
  employmentType: string;
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
  accountType: string;
  
  // Status
  isVerified: boolean;
  verificationDate: Date | null;
}

const EmployeeVerificationDashboard = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<EmployeeProfile>({
    firstName: "María",
    lastName: "González",
    email: "maria@ejemplo.com",
    phone: "+58 412 123-4567",
    cedula: "V-12345678",
    birthDate: new Date("1990-05-15"),
    position: "Desarrolladora",
    department: "Tecnología",
    employmentStartDate: new Date("2023-01-15"),
    employmentType: "full-time",
    weeklyHours: 40,
    monthlySalary: 800,
    livingExpenses: 500,
    dependents: 2,
    emergencyContact: "Juan Pérez",
    emergencyPhone: "+58 414 987-6543",
    address: "Av. Principal, Edificio ABC, Piso 5, Apt 501",
    city: "Caracas",
    state: "Distrito Capital",
    postalCode: "1010",
    bankName: "BDV",
    accountNumber: "0102-1234-5678-9012",
    accountType: "savings",
    isVerified: false,
    verificationDate: null,
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveEdit = async (field: string) => {
    try {
      setIsSaving(true);
      
      // TODO: Replace with actual API call
      // await supabase.from('employees').update({ [field]: editValue }).eq('id', employeeId);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfile(prev => ({ ...prev, [field]: editValue }));
      setEditingField(null);
      setEditValue("");
      
      toast({
        title: "Información actualizada",
        description: "Los cambios han sido guardados exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message ?? "No se pudo actualizar la información",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const verifyProfile = async () => {
    try {
      setIsSaving(true);
      
      // TODO: Replace with actual API call
      // await supabase.from('employees').update({ isVerified: true, verificationDate: new Date() }).eq('id', employeeId);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfile(prev => ({ 
        ...prev, 
        isVerified: true, 
        verificationDate: new Date() 
      }));
      
      toast({
        title: "Perfil verificado",
        description: "Tu información ha sido verificada exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message ?? "No se pudo verificar el perfil",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderEditableField = (
    label: string,
    field: string,
    value: string | number,
    type: "text" | "email" | "number" = "text",
    options?: { value: string; label: string }[]
  ) => {
    const isEditing = editingField === field;
    
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        {isEditing ? (
          <div className="flex items-center space-x-2">
            {type === "text" || type === "email" ? (
              <Input
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1"
              />
            ) : type === "number" ? (
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1"
              />
            ) : options ? (
              <Select value={editValue} onValueChange={setEditValue}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Button 
              size="sm" 
              onClick={() => saveEdit(field)}
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={cancelEdit}
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <span className="text-sm">{value}</span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => startEdit(field, String(value))}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
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
                <Link to="/employee" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Volver al Panel</span>
                </Link>
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Verificar Información</h1>
                  <p className="text-sm text-muted-foreground">Revisa y confirma tus datos</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {profile.isVerified ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verificado
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Pendiente
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Verification Status */}
          <Card className="border-none shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {profile.isVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
                <span>Estado de Verificación</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.isVerified ? (
                <div className="space-y-2">
                  <p className="text-green-600 font-medium">Tu información ha sido verificada</p>
                  <p className="text-sm text-muted-foreground">
                    Verificado el {profile.verificationDate ? format(profile.verificationDate, "PPP", { locale: es }) : "N/A"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-orange-600 font-medium">Revisa y verifica tu información</p>
                  <p className="text-sm text-muted-foreground">
                    Por favor revisa todos los campos y confirma que la información es correcta antes de verificar tu perfil.
                  </p>
                  <Button onClick={verifyProfile} disabled={isSaving}>
                    {isSaving ? "Verificando..." : "Verificar Perfil"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="employment">Laboral</TabsTrigger>
              <TabsTrigger value="financial">Financiera</TabsTrigger>
              <TabsTrigger value="banking">Bancaria</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <Card className="border-none shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Información Personal</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {renderEditableField("Nombre", "firstName", profile.firstName)}
                    {renderEditableField("Apellido", "lastName", profile.lastName)}
                  </div>
                  {renderEditableField("Email", "email", profile.email, "email")}
                  <div className="grid grid-cols-2 gap-4">
                    {renderEditableField("Teléfono", "phone", profile.phone)}
                    {renderEditableField("Cédula", "cedula", profile.cedula)}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Fecha de nacimiento</Label>
                    <div className="p-3 border rounded-lg bg-muted/50">
                      <span className="text-sm">
                        {profile.birthDate ? format(profile.birthDate, "PPP", { locale: es }) : "No especificada"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="employment" className="space-y-6">
              <Card className="border-none shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Información Laboral</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {renderEditableField("Cargo", "position", profile.position)}
                    {renderEditableField("Departamento", "department", profile.department)}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Fecha de inicio</Label>
                    <div className="p-3 border rounded-lg bg-muted/50">
                      <span className="text-sm">
                        {profile.employmentStartDate ? format(profile.employmentStartDate, "PPP", { locale: es }) : "No especificada"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {renderEditableField(
                      "Tipo de empleo", 
                      "employmentType", 
                      profile.employmentType,
                      "text",
                      [
                        { value: "full-time", label: "Tiempo completo" },
                        { value: "part-time", label: "Medio tiempo" },
                        { value: "contract", label: "Contrato" }
                      ]
                    )}
                    {renderEditableField("Horas semanales", "weeklyHours", profile.weeklyHours, "number")}
                  </div>
                  {renderEditableField("Salario mensual (USD)", "monthlySalary", profile.monthlySalary, "number")}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-6">
              <Card className="border-none shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Información Financiera</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {renderEditableField("Gastos de vida mensuales (USD)", "livingExpenses", profile.livingExpenses, "number")}
                    {renderEditableField("Número de dependientes", "dependents", profile.dependents, "number")}
                  </div>
                  {renderEditableField("Contacto de emergencia", "emergencyContact", profile.emergencyContact)}
                  {renderEditableField("Teléfono de emergencia", "emergencyPhone", profile.emergencyPhone)}
                </CardContent>
              </Card>

              <Card className="border-none shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Dirección</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderEditableField("Dirección", "address", profile.address)}
                  <div className="grid grid-cols-3 gap-4">
                    {renderEditableField("Ciudad", "city", profile.city)}
                    {renderEditableField("Estado", "state", profile.state)}
                    {renderEditableField("Código postal", "postalCode", profile.postalCode)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banking" className="space-y-6">
              <Card className="border-none shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Home className="h-5 w-5" />
                    <span>Información Bancaria</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderEditableField(
                    "Banco", 
                    "bankName", 
                    profile.bankName,
                    "text",
                    [
                      { value: "BDV", label: "Banco de Venezuela" },
                      { value: "Mercantil", label: "Banco Mercantil" },
                      { value: "Banesco", label: "Banesco" },
                      { value: "Venezuela", label: "Banco de Venezuela" },
                      { value: "Provincial", label: "Banco Provincial" },
                      { value: "BOD", label: "BOD" }
                    ]
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {renderEditableField("Número de cuenta", "accountNumber", profile.accountNumber)}
                    {renderEditableField(
                      "Tipo de cuenta", 
                      "accountType", 
                      profile.accountType,
                      "text",
                      [
                        { value: "savings", label: "Ahorros" },
                        { value: "checking", label: "Corriente" }
                      ]
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EmployeeVerificationDashboard;
