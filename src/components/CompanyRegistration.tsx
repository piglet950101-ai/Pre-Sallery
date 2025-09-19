import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { KYCUpload } from "@/components/KYCUpload";
import { TimesheetUpload } from "@/components/TimesheetUpload";
import { 
  Building, 
  Users, 
  FileSpreadsheet,
  Shield,
  CheckCircle,
  ArrowRight,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RegistrationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

export const CompanyRegistration = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    companyName: '',
    rif: '',
    address: '',
    email: '',
    phone: '',
    contactPerson: '',
    website: '',
    employeeCount: '',
    industry: ''
  });

  const steps: RegistrationStep[] = [
    {
      id: 'company',
      title: 'Información Empresarial',
      description: 'Datos básicos de tu empresa',
      completed: currentStep > 0,
      active: currentStep === 0
    },
    {
      id: 'documents',
      title: 'Documentos Legales',
      description: 'Verificación y compliance',
      completed: currentStep > 1,
      active: currentStep === 1
    },
    {
      id: 'employees',
      title: 'Carga de Empleados',
      description: 'Lista inicial de nómina',
      completed: currentStep > 2,
      active: currentStep === 2
    },
    {
      id: 'billing',
      title: 'Configuración de Facturación',
      description: 'Método de pago y términos',
      completed: currentStep > 3,
      active: currentStep === 3
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      toast({
        title: "Paso completado",
        description: `Has avanzado al paso ${currentStep + 2}`,
      });
    } else {
      toast({
        title: "¡Registro completado!",
        description: "Tu cuenta empresarial será revisada en 24-48 horas",
      });
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.companyName && formData.rif && formData.email && formData.phone;
      case 1:
        return true; // Document upload validation handled in component
      case 2:
        return true; // Employee upload validation handled in component
      case 3:
        return true; // Billing setup
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="h-16 w-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
            <Building className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Registro Empresarial</h1>
            <p className="text-muted-foreground">Únete a la revolución de adelantos salariales en Venezuela</p>
          </div>
        </div>

        {/* Progress Steps */}
        <Card className="border-none shadow-elegant animate-slide-up">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`
                      h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${step.completed 
                        ? 'bg-primary text-primary-foreground' 
                        : step.active 
                          ? 'bg-primary/20 text-primary border-2 border-primary' 
                          : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${step.active ? 'text-primary' : 'text-muted-foreground'}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-muted-foreground max-w-24">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      h-px w-16 mx-4 transition-colors duration-300
                      ${step.completed ? 'bg-primary' : 'bg-muted'}
                    `} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="border-none shadow-elegant animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {currentStep === 0 && <Building className="h-5 w-5 text-primary" />}
              {currentStep === 1 && <Shield className="h-5 w-5 text-primary" />}
              {currentStep === 2 && <Users className="h-5 w-5 text-primary" />}
              {currentStep === 3 && <DollarSign className="h-5 w-5 text-primary" />}
              <span>{steps[currentStep].title}</span>
            </CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 0: Company Information */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nombre de la Empresa *</Label>
                    <Input
                      id="company-name"
                      value={formData.companyName}
                      onChange={(e) => updateFormData('companyName', e.target.value)}
                      placeholder="Empresa Ejemplo C.A."
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rif">RIF Empresarial *</Label>
                    <Input
                      id="rif"
                      value={formData.rif}
                      onChange={(e) => updateFormData('rif', e.target.value)}
                      placeholder="J-12345678-9"
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección Fiscal</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    placeholder="Dirección completa incluyendo estado y código postal"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Corporativo *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="admin@empresa.com"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono Corporativo *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      placeholder="+58 212 123-4567"
                      className="h-13"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact">Persona de Contacto</Label>
                    <Input
                      id="contact"
                      value={formData.contactPerson}
                      onChange={(e) => updateFormData('contactPerson', e.target.value)}
                      placeholder="María González - Gerente RRHH"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employees">Número de Empleados</Label>
                    <Input
                      id="employees"
                      type="number"
                      value={formData.employeeCount}
                      onChange={(e) => updateFormData('employeeCount', e.target.value)}
                      placeholder="150"
                      className="h-12"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Documents */}
            {currentStep === 1 && (
              <KYCUpload userType="company" />
            )}

            {/* Step 2: Employee Upload */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium text-primary">Carga masiva de empleados</div>
                      <div className="text-sm text-muted-foreground">
                        Sube la información inicial de tu nómina para comenzar
                      </div>
                    </div>
                  </div>
                </div>

                <TimesheetUpload userType="company" />

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h5 className="font-medium mb-2">Información importante:</h5>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• Los empleados recibirán un SMS/email con su código de activación</div>
                    <div>• Solo podrán solicitar adelantos después de activar su cuenta</div>
                    <div>• Puedes agregar más empleados después del registro inicial</div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Billing Setup */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Pricing Summary */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-center space-x-3">
                      <Building className="h-6 w-6 text-primary" />
                      <div>
                        <div className="font-semibold text-lg">Costo Empresarial</div>
                        <div className="text-sm text-muted-foreground">Facturación mensual</div>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-primary">$1 USD</div>
                    <div className="text-sm text-muted-foreground">por empleado activo / mes</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Dashboard empresarial completo</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Reportes automatizados</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Soporte técnico incluido</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-center space-x-3">
                      <Users className="h-6 w-6 text-secondary" />
                      <div>
                        <div className="font-semibold text-lg">Costo del Empleado</div>
                        <div className="text-sm text-muted-foreground">Por cada adelanto</div>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-secondary">5%</div>
                    <div className="text-sm text-muted-foreground">comisión por adelanto (mín $1 USD)</div>
                    <div className="bg-secondary/10 p-3 rounded-lg text-sm">
                      <strong>Ejemplo:</strong> Adelanto de $100 → Empleado recibe $95, paga $5 de comisión
                    </div>
                  </div>
                </div>

                {/* Billing Information */}
                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Información de Facturación</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billing-email">Email de Facturación</Label>
                      <Input
                        id="billing-email"
                        type="email"
                        placeholder="contabilidad@empresa.com"
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-contact">Contacto de Pagos</Label>
                      <Input
                        id="billing-contact"
                        placeholder="Juan Pérez - Contador"
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-hero p-6 rounded-lg">
                    <h5 className="font-medium mb-3">Términos de Facturación</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Frecuencia de facturación:</span>
                        <span className="font-medium">Semanal (adelantos) + Mensual (empleados)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Términos de pago:</span>
                        <span className="font-medium">7 días</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Método de pago:</span>
                        <span className="font-medium">Transferencia bancaria</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-primary mb-1">30 días gratis</div>
                      <div className="text-muted-foreground">
                        Comienza sin costo. La facturación inicia después del período de prueba.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Anterior
              </Button>

              <Button 
                onClick={handleNext}
                disabled={!isStepValid()}
                variant={currentStep === steps.length - 1 ? "hero" : "premium"}
                className="min-w-32"
              >
                {currentStep === steps.length - 1 ? (
                  <div className="flex items-center space-x-2">
                    <span>Crear Cuenta</span>
                    <CheckCircle className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Siguiente</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};