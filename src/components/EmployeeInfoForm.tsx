import { useState, useEffect } from "react";
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
import { es, enUS } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface EmployeeInfo {
  // Personal Information
  firstName: string;
  lastName: string;
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
  const { t, language } = useLanguage();


  const [formData, setFormData] = useState<EmployeeInfo>(() => {
    return {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      phone: initialData?.phone || "",
      cedula: initialData?.cedula || "",
      birthDate: initialData?.birthDate || null,
      yearOfEmployment: initialData?.yearOfEmployment || 0,
      position: initialData?.position || "",
      department: initialData?.department || "",
      employmentStartDate: initialData?.employmentStartDate || null,
      employmentType: initialData?.employmentType || "",
      weeklyHours: initialData?.weeklyHours || 0,
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
    };
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData && (initialData.firstName || initialData.lastName)) {
      const newFormData = {
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        phone: initialData.phone || "",
        cedula: initialData.cedula || "",
        birthDate: initialData.birthDate || null,
        yearOfEmployment: initialData.yearOfEmployment || 0,
        position: initialData.position || "",
        department: initialData.department || "",
        employmentStartDate: initialData.employmentStartDate || null,
        employmentType: initialData.employmentType || "",
        weeklyHours: initialData.weeklyHours || 0,
        monthlySalary: initialData.monthlySalary || 0,
        livingExpenses: initialData.livingExpenses || 0,
        dependents: initialData.dependents || 0,
        emergencyContact: initialData.emergencyContact || "",
        emergencyPhone: initialData.emergencyPhone || "",
        address: initialData.address || "",
        city: initialData.city || "",
        state: initialData.state || "",
        postalCode: initialData.postalCode || "",
        bankName: initialData.bankName || "",
        accountNumber: initialData.accountNumber || "",
        accountType: initialData.accountType || "",
        notes: initialData.notes || "",
      };
      setFormData(newFormData);
    } else {
    }
  }, [initialData]);

  const updateField = (field: keyof EmployeeInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Cedula validation function
  const validateCedula = (cedula: string): boolean => {
    const cedulaPattern = /^[EV]\d{6,8}$/;
    return cedulaPattern.test(cedula);
  };

  // Handle cedula input with validation
  const handleCedulaChange = (value: string) => {
    // Clean the input - only allow E, V, and digits
    let cleaned = value.replace(/[^EV0-9]/gi, '');
    
    // Ensure first character is E or V
    if (cleaned.length > 0 && !['E', 'V'].includes(cleaned[0].toUpperCase())) {
      cleaned = cleaned.substring(1);
    }
    
    // Convert to uppercase
    if (cleaned.length > 0) {
      cleaned = cleaned[0].toUpperCase() + cleaned.substring(1);
    }
    
    // Limit to 9 characters (E/V + 8 digits max)
    cleaned = cleaned.substring(0, 9);
    
    // Ensure only digits after the first character
    if (cleaned.length > 1) {
      cleaned = cleaned[0] + cleaned.substring(1).replace(/\D/g, '');
    }
    
    updateField("cedula", cleaned);
  };


  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal Information
        return !!(formData.firstName && formData.lastName && formData.cedula && validateCedula(formData.cedula) && formData.yearOfEmployment > 0 && formData.weeklyHours > 0 && formData.livingExpenses >= 0);
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

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      toast({
        title: t('common.incompleteInfo') || 'Incomplete information',
        description: t('common.fillRequired') || 'Please complete all required fields',
        variant: "destructive"
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      onSave(formData);
    } else {
      toast({
        title: t('common.incompleteInfo') || 'Incomplete information',
        description: t('common.fillRequired') || 'Please complete all required fields',
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
                <Label htmlFor="firstName">{t('employeeForm.firstName')} *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  placeholder={language === 'en' ? 'Mary' : 'María'}
                />

                <div className="text-xs text-gray-500">Debug: {formData.firstName}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('employeeForm.lastName')} *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  placeholder={language === 'en' ? 'Smith' : 'González'}
                />
                <div className="text-xs text-gray-500">Debug: {formData.lastName}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('employeeForm.phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder={language === 'en' ? '+1 415 555-0123' : '+58 414 987-6543'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cedula">{t('employeeForm.cedula')} *</Label>
                <Input
                  id="cedula"
                  value={formData.cedula}
                  onChange={(e) => handleCedulaChange(e.target.value)}
                  placeholder={language === 'en' ? 'V12345678' : 'V12345678'}
                  maxLength={9}
                />
                {formData.cedula && !validateCedula(formData.cedula) && (
                  <p className="text-xs text-red-500">
                    {language === 'en' 
                      ? 'Must be E or V followed by 6-8 digits (e.g., V12345678 or E1234567)'
                      : 'Debe ser E o V seguido de 6-8 dígitos (ej., V12345678 o E1234567)'
                    }
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearOfEmployment">{t('employeeForm.yearOfEmployment')} *</Label>
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
                <Label htmlFor="weeklyHours">{t('employeeForm.weeklyHours')} *</Label>
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
              <Label htmlFor="livingExpenses">{t('employeeForm.livingExpenses')} *</Label>
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
              <Label>{t('employeeForm.birthDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.birthDate ? format(formData.birthDate, "PPP", { locale: language === 'en' ? enUS : es }) : t('employeeForm.selectDate')}
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
                <Label htmlFor="position">{t('employeeForm.position')} *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => updateField("position", e.target.value)}
                  placeholder={language === 'en' ? 'Sales Associate' : 'Asociado de Ventas'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">{t('employeeForm.department')}</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => updateField("department", e.target.value)}
                  placeholder={language === 'en' ? 'Sales' : 'Ventas'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('employeeForm.startDate')} *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.employmentStartDate ? format(formData.employmentStartDate, "PPP", { locale: language === 'en' ? enUS : es }) : t('employeeForm.selectDate')}
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
                <Label htmlFor="employmentType">{t('employeeForm.employmentType')} *</Label>
                <Select value={formData.employmentType} onValueChange={(value) => updateField("employmentType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('employeeForm.selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">{t('employeeForm.fullTime')}</SelectItem>
                    <SelectItem value="part-time">{t('employeeForm.partTime')}</SelectItem>
                    <SelectItem value="contract">{t('employeeForm.contract')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weeklyHours">{t('employeeForm.weeklyHoursShort')}</Label>
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
              <Label htmlFor="monthlySalary">{t('employeeForm.monthlySalary')} *</Label>
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
                <Label htmlFor="livingExpenses">{t('employeeForm.livingExpenses')}</Label>
                <Input
                  id="livingExpenses"
                  type="number"
                  value={formData.livingExpenses}
                  onChange={(e) => updateField("livingExpenses", parseFloat(e.target.value) || 0)}
                  placeholder="500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dependents">{t('employeeForm.dependents')}</Label>
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
              <Label htmlFor="emergencyContact">{t('employeeForm.emergencyContact')} *</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => updateField("emergencyContact", e.target.value)}
                placeholder={language === 'en' ? 'John Smith' : 'Juan Pérez'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">{t('employeeForm.emergencyPhone')} *</Label>
              <Input
                id="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={(e) => updateField("emergencyPhone", e.target.value)}
                placeholder={language === 'en' ? '+1 415 555-0123' : '+58 414 987-6543'}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">{t('employeeForm.address')} *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder={language === 'en' ? '123 Main St, Suite 500' : 'Av. Principal, Edificio ABC, Piso 5, Apt 501'}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t('employeeForm.city')} *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder={language === 'en' ? 'City' : 'Caracas'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">{t('employeeForm.state')} *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  placeholder={language === 'en' ? 'State' : 'Distrito Capital'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">{t('employeeForm.postalCode')}</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                  placeholder={language === 'en' ? '1010' : '1010'}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">{t('employeeForm.bank')} *</Label>
              <Select value={formData.bankName} onValueChange={(value) => updateField("bankName", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('employeeForm.selectBank')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BDV">{language === 'en' ? 'Bank of Venezuela' : 'Banco de Venezuela'}</SelectItem>
                  <SelectItem value="Mercantil">{language === 'en' ? 'Banco Mercantil' : 'Banco Mercantil'}</SelectItem>
                  <SelectItem value="Banesco">Banesco</SelectItem>
                  <SelectItem value="Venezuela">{language === 'en' ? 'Bank of Venezuela' : 'Banco de Venezuela'}</SelectItem>
                  <SelectItem value="Provincial">{language === 'en' ? 'Banco Provincial' : 'Banco Provincial'}</SelectItem>
                  <SelectItem value="BOD">BOD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">{t('employeeForm.accountNumber')} *</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => updateField("accountNumber", e.target.value)}
                  placeholder="0102-1234-5678-9012"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountType">{t('employeeForm.accountType')} *</Label>
                <Select value={formData.accountType} onValueChange={(value) => updateField("accountType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('employeeForm.selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">{t('employeeForm.savings')}</SelectItem>
                    <SelectItem value="checking">{t('employeeForm.checking')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('employeeForm.additionalNotes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder={language === 'en' ? 'Additional information about the employee...' : 'Información adicional sobre el empleado...'}
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
      t('employeeForm.step.personal'),
      t('employeeForm.step.employment'),
      t('employeeForm.step.financial'),
      t('employeeForm.step.address'),
      t('employeeForm.step.banking')
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
            {t('employeeForm.stepOf').replace('{current}', String(currentStep)).replace('{total}', String(totalSteps))}
          </Badge>
        </div>
        <CardDescription>
          {t('employeeForm.detailSubtitle')}
        </CardDescription>
        


        {/* Fee Notification */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              {t('employeeForm.registrationFeeTitle')}
            </span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            {t('employeeForm.registrationFeeDesc')}
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
            {t('common.previous')}
          </Button>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            {currentStep < totalSteps ? (
              <Button onClick={handleNext}>
                {t('common.next')}
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? t('common.saving') : t('common.save')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
