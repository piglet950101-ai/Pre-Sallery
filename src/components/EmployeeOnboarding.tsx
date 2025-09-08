import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { KYCUpload } from "@/components/KYCUpload";
import { 
  UserCheck, 
  Building, 
  CreditCard,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

export const EmployeeOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    cedula: '',
    fullName: '',
    email: '',
    phone: '',
    pagoMovilPhone: '',
    bankName: '',
    accountNumber: '',
    activationCode: ''
  });

  const steps: OnboardingStep[] = [
    {
      id: 'activation',
      title: 'Código de Activación',
      description: 'Ingresa el código enviado por tu empresa',
      completed: currentStep > 0,
      active: currentStep === 0
    },
    {
      id: 'personal',
      title: 'Información Personal',
      description: 'Completa tus datos básicos',
      completed: currentStep > 1,
      active: currentStep === 1
    },
    {
      id: 'payment',
      title: 'Métodos de Pago',
      description: 'Configura cómo recibirás tus adelantos',
      completed: currentStep > 2,
      active: currentStep === 2
    },
    {
      id: 'documents',
      title: 'Verificación KYC',
      description: 'Sube tus documentos de identidad',
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
        description: "Tu cuenta será revisada y activada en 24 horas",
      });
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.activationCode.length > 0;
      case 1:
        return formData.cedula && formData.fullName && formData.email && formData.phone;
      case 2:
        return formData.pagoMovilPhone || (formData.bankName && formData.accountNumber);
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="h-16 w-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
            <UserCheck className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Activación de Cuenta</h1>
            <p className="text-muted-foreground">Completa estos pasos para acceder a AvancePay</p>
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
              {currentStep === 0 && <Mail className="h-5 w-5 text-primary" />}
              {currentStep === 1 && <UserCheck className="h-5 w-5 text-primary" />}
              {currentStep === 2 && <CreditCard className="h-5 w-5 text-primary" />}
              {currentStep === 3 && <Building className="h-5 w-5 text-primary" />}
              <span>{steps[currentStep].title}</span>
            </CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 0: Activation Code */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium text-primary">Código de activación requerido</div>
                      <div className="text-sm text-muted-foreground">
                        Tu empresa te ha enviado un código por SMS o email
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activation-code">Código de activación</Label>
                  <Input
                    id="activation-code"
                    value={formData.activationCode}
                    onChange={(e) => updateFormData('activationCode', e.target.value)}
                    placeholder="Ej: AVC-2024-123456"
                    className="h-12 text-lg text-center font-mono"
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  ¿No tienes código? Contacta al departamento de RRHH de tu empresa.
                </div>
              </div>
            )}

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cedula">Cédula de Identidad</Label>
                    <Input
                      id="cedula"
                      value={formData.cedula}
                      onChange={(e) => updateFormData('cedula', e.target.value)}
                      placeholder="V-12345678"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => updateFormData('fullName', e.target.value)}
                      placeholder="María González"
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="maria@email.com"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      placeholder="+58 412 123-4567"
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm font-medium mb-1">Importante:</div>
                  <div className="text-sm text-muted-foreground">
                    Esta información debe coincidir exactamente con los datos registrados por tu empresa.
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Payment Methods */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-sm text-muted-foreground">
                  Configura al menos un método para recibir tus adelantos salariales
                </div>

                {/* PagoMóvil */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">PagoMóvil</div>
                      <div className="text-sm text-muted-foreground">Recibe transferencias instantáneas</div>
                    </div>
                    <Badge>Recomendado</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pagomovil">Teléfono PagoMóvil</Label>
                    <Input
                      id="pagomovil"
                      value={formData.pagoMovilPhone}
                      onChange={(e) => updateFormData('pagoMovilPhone', e.target.value)}
                      placeholder="+58 412 123-4567"
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="text-center text-muted-foreground">ó</div>

                {/* Bank Account */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-secondary" />
                    <div className="flex-1">
                      <div className="font-medium">Cuenta Bancaria</div>
                      <div className="text-sm text-muted-foreground">Transferencias bancarias tradicionales</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bank">Banco</Label>
                      <Input
                        id="bank"
                        value={formData.bankName}
                        onChange={(e) => updateFormData('bankName', e.target.value)}
                        placeholder="Banco de Venezuela"
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account">Número de Cuenta</Label>
                      <Input
                        id="account"
                        value={formData.accountNumber}
                        onChange={(e) => updateFormData('accountNumber', e.target.value)}
                        placeholder="0102-1234-56-1234567890"
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: KYC Documents */}
            {currentStep === 3 && (
              <KYCUpload userType="employee" />
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
                    <span>Finalizar</span>
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