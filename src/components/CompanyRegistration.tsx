import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { KYCUpload } from "@/components/KYCUpload";
import { EmployeeBulkUpload } from "@/components/EmployeeBulkUpload";
import { 
  Building, 
  Users, 
  FileSpreadsheet,
  Shield,
  CheckCircle,
  ArrowRight,
  DollarSign,
  Upload,
  X,
  FileImage
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();

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

  const [rifImage, setRifImage] = useState<File | null>(null);
  const [rifError, setRifError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

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

  // Basic validators
  const validateCompanyName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const validateEmail = (email: string): boolean => {
    // Simple email regex adequate for UI validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    return emailRegex.test(email.trim());
  };

  const validatePhone = (phone: string): boolean => {
    // Allow digits, spaces, plus, dashes, parentheses; require 7+ digits
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 7;
  };

  // RIF validation function
  const validateRIF = (rif: string): boolean => {
    const rifPattern = /^[VJG]\d{9}$/;
    return rifPattern.test(rif);
  };

  // RIF input handler with masking
  const handleRIFChange = (value: string) => {
    // Remove any non-alphanumeric characters
    let cleaned = value.replace(/[^VJG0-9]/gi, '');
    
    // Ensure it starts with V, J, or G
    if (cleaned.length > 0 && !['V', 'J', 'G'].includes(cleaned[0].toUpperCase())) {
      cleaned = cleaned.substring(1);
    }
    
    // Convert first character to uppercase
    if (cleaned.length > 0) {
      cleaned = cleaned[0].toUpperCase() + cleaned.substring(1);
    }
    
    // Limit to 10 characters (1 letter + 9 digits)
    cleaned = cleaned.substring(0, 10);
    
    // Only allow digits after the first character
    if (cleaned.length > 1) {
      cleaned = cleaned[0] + cleaned.substring(1).replace(/\D/g, '');
    }
    
    updateFormData('rif', cleaned);
    
    // Validate RIF
    if (cleaned.length === 10) {
      if (validateRIF(cleaned)) {
        setRifError('');
      } else {
        setRifError(t('registration.rifInvalid'));
      }
    } else if (cleaned.length > 0) {
      setRifError(t('registration.rifLength'));
    } else {
      setRifError('');
    }
  };

  // Handle RIF image upload
  const handleRIFImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: t('common.error'),
          description: t('registration.rifImageFormats'),
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('common.error'),
          description: t('registration.rifImageFormats'),
          variant: "destructive"
        });
        return;
      }
      
      setRifImage(file);
    }
  };

  // Remove RIF image
  const removeRIFImage = () => {
    setRifImage(null);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.companyName && 
               formData.rif && 
               formData.email && 
               formData.phone && 
               validateCompanyName(formData.companyName) &&
               validateEmail(formData.email) &&
               validatePhone(formData.phone) &&
               validateRIF(formData.rif) && 
               rifImage !== null &&
               !nameError && !emailError && !phoneError && !rifError;
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
                      onChange={(e) => {
                        const value = e.target.value;
                        updateFormData('companyName', value);
                        if (!value) {
                          setNameError(t('registration.companyNameRequired'));
                        } else if (!validateCompanyName(value)) {
                          setNameError(t('registration.companyNameTooShort'));
                        } else {
                          setNameError('');
                        }
                      }}
                      placeholder="Empresa Ejemplo C.A."
                      className={`h-12 ${nameError ? 'border-red-500' : ''}`}
                    />
                    {nameError && (
                      <p className="text-sm text-red-500">{nameError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rif">RIF Empresarial *</Label>
                    <Input
                      id="rif"
                      value={formData.rif}
                      onChange={(e) => handleRIFChange(e.target.value)}
                      placeholder="J123456789"
                      className={`h-12 ${rifError ? 'border-red-500' : ''}`}
                    />
                    {rifError && (
                      <p className="text-sm text-red-500">{rifError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t('registration.rifFormat')}
                    </p>
                  </div>
                </div>

                {/* RIF Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="rif-image">{t('registration.rifImage')} *</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    {rifImage ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <FileImage className="h-8 w-8 text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{rifImage.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(rifImage.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={removeRIFImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p>• {t('registration.rifImageRequirements')}</p>
                          <p>• {t('registration.rifImageValid')}</p>
                          <p>• {t('registration.rifImageFormats')}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-sm font-medium">{t('registration.rifImageUpload')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('registration.rifImageDragDrop')}
                          </p>
                        </div>
                        <input
                          id="rif-image"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleRIFImageUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('rif-image')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {t('registration.rifImageSelect')}
                        </Button>
                        <div className="text-xs text-muted-foreground">
                          <p>• {t('registration.rifImageRequirements')}</p>
                          <p>• {t('registration.rifImageValid')}</p>
                          <p>• {t('registration.rifImageFormats')}</p>
                        </div>
                      </div>
                    )}
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
                      onChange={(e) => {
                        const value = e.target.value;
                        updateFormData('email', value);
                        if (!value) {
                          setEmailError(t('registration.emailRequired'));
                        } else if (!validateEmail(value)) {
                          setEmailError(t('registration.emailInvalid'));
                        } else {
                          setEmailError('');
                        }
                      }}
                      placeholder="admin@empresa.com"
                      className={`h-12 ${emailError ? 'border-red-500' : ''}`}
                    />
                    {emailError && (
                      <p className="text-sm text-red-500">{emailError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono Corporativo *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateFormData('phone', value);
                        if (!value) {
                          setPhoneError(t('registration.phoneRequired'));
                        } else if (!validatePhone(value)) {
                          setPhoneError(t('registration.phoneInvalid'));
                        } else {
                          setPhoneError('');
                        }
                      }}
                      placeholder="+58 212 123-4567"
                      className={`h-13 ${phoneError ? 'border-red-500' : ''}`}
                    />
                    {phoneError && (
                      <p className="text-sm text-red-500">{phoneError}</p>
                    )}
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
                      <div className="font-medium text-primary">{t('company.employeeBulkUpload.title')}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('company.employeeBulkUpload.description')}
                      </div>
                    </div>
                  </div>
                </div>

                <EmployeeBulkUpload />

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h5 className="font-medium mb-2">{t('company.employeeBulkUpload.importantInfo')}:</h5>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• {t('company.employeeBulkUpload.activationCode')}</div>
                    <div>• {t('company.employeeBulkUpload.advanceRequirement')}</div>
                    <div>• {t('company.employeeBulkUpload.addMoreLater')}</div>
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

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-orange-800 mb-1">{t('registration.immediateBilling')}</div>
                      <div className="text-orange-700">
                        {t('registration.immediateBillingDesc')}
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