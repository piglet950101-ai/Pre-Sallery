import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";

interface SimpleEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  cedula?: string;
}

interface SimpleEmployeeFormProps {
  onSave: (employeeData: SimpleEmployeeData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const SimpleEmployeeForm = ({ onSave, onCancel, isLoading = false }: SimpleEmployeeFormProps) => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState<SimpleEmployeeData>({
    firstName: "",
    lastName: "",
    email: "",
    cedula: "",
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null);
  const [isValidatingCedula, setIsValidatingCedula] = useState(false);
  const [cedulaValidationError, setCedulaValidationError] = useState<string | null>(null);

  const updateField = (field: keyof SimpleEmployeeData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation errors when user types
    if (field === 'email') {
      setEmailValidationError(null);
    }
    if (field === 'cedula') {
      setCedulaValidationError(null);
    }
  };

  const validateForm = (): boolean => {
    return !!(formData.firstName.trim() && formData.lastName.trim() && formData.email.trim());
  };

  const validateEmail = async (email: string): Promise<boolean> => {
    try {
      setIsValidatingEmail(true);
      setEmailValidationError(null);

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailValidationError(language === 'en' ? 'Invalid email format' : 'Formato de email inválido');
        return false;
      }

      // Check for duplicate email in employees table (across all companies)
      const { data: existingEmployee, error: employeeError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, company_id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (employeeError) {
        console.error('Error checking employee email:', employeeError);
        setEmailValidationError(language === 'en' ? 'Error checking email availability' : 'Error verificando disponibilidad del email');
        return false;
      }

      if (existingEmployee) {
        setEmailValidationError(language === 'en' ? `Email already exists for ${existingEmployee.first_name} ${existingEmployee.last_name}` : `El email ya existe para ${existingEmployee.first_name} ${existingEmployee.last_name}`);
        return false;
      }

      // Check for duplicate email in auth.users using Supabase function
      try {
        const { data: authCheckResult, error: authError } = await supabase.functions.invoke('check-auth-email', {
          body: { email: email.toLowerCase() }
        });

        if (authError) {
          console.warn('Error checking auth users:', authError);
          // Continue with validation if we can't check auth users
        } else if (authCheckResult?.exists) {
          setEmailValidationError(language === 'en' ? 'Email already registered in the system' : 'El email ya está registrado en el sistema');
          return false;
        }
      } catch (authCheckError) {
        console.warn('Error checking auth users:', authCheckError);
        // Continue with validation if we can't check auth users
      }

      return true;
    } catch (error) {
      console.error('Email validation error:', error);
      setEmailValidationError(language === 'en' ? 'Error validating email' : 'Error validando email');
      return false;
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const validateCedula = async (cedula: string): Promise<boolean> => {
    if (!cedula.trim()) return true; // Cedula is optional

    try {
      setIsValidatingCedula(true);
      setCedulaValidationError(null);

      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('cedula', cedula.trim())
        .maybeSingle();

      if (error) {
        return true; // If error checking, allow cedula (fail-safe)
      }

      if (data) {
        setCedulaValidationError(language === 'en' ? 'Cedula already registered' : 'Cédula ya registrada');
        return false;
      }

      return true;
    } catch (error) {
      return true; // If error checking, allow cedula (fail-safe)
    } finally {
      setIsValidatingCedula(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: t('common.incompleteInfo') || 'Incomplete information',
        description: t('common.fillRequired') || 'Please complete all required fields',
        variant: "destructive"
      });
      return;
    }

    // Validate email and cedula before showing confirmation modal
    const isEmailValid = await validateEmail(formData.email);
    if (!isEmailValid) {
      return; // Error already set in state
    }

    const isCedulaValid = await validateCedula(formData.cedula || '');
    if (!isCedulaValid) {
      return; // Error already set in state
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmSave = () => {
    setShowConfirmModal(false);
    onSave(formData);
  };

  return (
    <Card className="border-none shadow-elegant">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <CardTitle>{t('company.simpleEmployeeForm.title')}</CardTitle>
        </div>
        <CardDescription>
          {t('company.simpleEmployeeForm.description')}
        </CardDescription>
        
        {/* Quick Add Notification */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              {t('company.simpleEmployeeForm.quickAddTitle')}
            </span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            {t('company.simpleEmployeeForm.quickAddDesc')}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('employeeForm.email')} *</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder={language === 'en' ? 'john.doe@company.com' : 'juan.perez@empresa.com'}
                  required
                  className={emailValidationError ? "border-red-500" : ""}
                />
                {isValidatingEmail && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              {emailValidationError && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{emailValidationError}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cedula">{language === 'en' ? 'Cedula (Optional)' : 'Cédula (Opcional)'}</Label>
              <div className="relative">
                <Input
                  id="cedula"
                  type="text"
                  value={formData.cedula}
                  onChange={(e) => updateField("cedula", e.target.value)}
                  placeholder={language === 'en' ? 'V-12345678' : 'V-12345678'}
                  className={cedulaValidationError ? "border-red-500" : ""}
                />
                {isValidatingCedula && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {cedulaValidationError && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                )}
              </div>
              {cedulaValidationError && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{cedulaValidationError}</span>
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('employeeForm.firstName')} *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  placeholder={language === 'en' ? 'John' : 'Juan'}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('employeeForm.lastName')} *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  placeholder={language === 'en' ? 'Doe' : 'Pérez'}
                  required
                />
              </div>
            </div>
          </div>

        </div>

        {/* Default Values Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            {t('company.simpleEmployeeForm.defaultValuesTitle')}
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• {t('company.simpleEmployeeForm.defaultPassword')}</li>
            <li>• {t('company.simpleEmployeeForm.defaultPosition')}</li>
            <li>• {t('company.simpleEmployeeForm.defaultSalary')}</li>
            <li>• {t('company.simpleEmployeeForm.defaultHours')}</li>
            <li>• {t('company.simpleEmployeeForm.defaultYear')}</li>
            <li>• {t('company.simpleEmployeeForm.defaultType')}</li>
          </ul>
          <p className="text-xs text-blue-600 mt-2">
            {t('company.simpleEmployeeForm.defaultValuesNote')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !validateForm() || isValidatingEmail || !!emailValidationError}
          >
            {isLoading ? t('common.saving') : isValidatingEmail ? (language === 'en' ? 'Validating...' : 'Validando...') : t('common.save')}
          </Button>
        </div>
      </CardContent>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>{language === 'en' ? 'Confirm Employee Addition' : 'Confirmar Adición de Empleado'}</span>
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Please review the employee information before adding them to your company.' 
                : 'Por favor revisa la información del empleado antes de agregarlo a tu empresa.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">{language === 'en' ? 'Name:' : 'Nombre:'}</span>
                <span>{formData.firstName} {formData.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{language === 'en' ? 'Email:' : 'Email:'}</span>
                <span className="text-blue-600">{formData.email}</span>
              </div>
              {formData.cedula && (
                <div className="flex justify-between">
                  <span className="font-medium">{language === 'en' ? 'Cedula:' : 'Cédula:'}</span>
                  <span className="text-blue-600">{formData.cedula}</span>
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">{language === 'en' ? 'What happens next:' : 'Lo que sucede después:'}</p>
                  <ul className="mt-1 space-y-1 text-blue-700">
                    <li>• {language === 'en' ? 'Must change password on first login' : 'Debe cambiar contraseña en el primer acceso'}</li>
                    <li>• {language === 'en' ? 'Must upload ID document (cédula)' : 'Debe subir documento de identidad (cédula)'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              {language === 'en' ? 'Cancel' : 'Cancelar'}
            </Button>
            <Button onClick={handleConfirmSave} disabled={isLoading}>
              {isLoading ? (language === 'en' ? 'Adding...' : 'Agregando...') : (language === 'en' ? 'Add Employee' : 'Agregar Empleado')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
