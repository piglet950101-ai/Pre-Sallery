import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface SimpleEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
}

interface SimpleEmployeeFormProps {
  onSave: (employeeData: SimpleEmployeeData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  checkEmailDuplicate?: (email: string) => Promise<boolean>;
}

export const SimpleEmployeeForm = ({ onSave, onCancel, isLoading = false, checkEmailDuplicate }: SimpleEmployeeFormProps) => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState<SimpleEmployeeData>({
    firstName: "",
    lastName: "",
    email: "",
  });

  const updateField = (field: keyof SimpleEmployeeData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    return !!(formData.firstName.trim() && formData.lastName.trim() && formData.email.trim());
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

    // Check for duplicate email
    if (checkEmailDuplicate) {
      const email = formData.email.trim().toLowerCase();
      try {
        const isDuplicate = await checkEmailDuplicate(email);
        if (isDuplicate) {
          toast({
            title: t('company.billing.duplicateEmail'),
            description: t('company.billing.duplicateEmailDesc'),
            variant: "destructive"
          });
          return;
        }
      } catch (err: any) {
        toast({
          title: t('company.billing.error'),
          description: err?.message ?? (t('common.tryAgain') || 'Please try again'),
          variant: "destructive"
        });
        return;
      }
    }

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

          <div className="space-y-2">
            <Label htmlFor="email">{t('employeeForm.email')} *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder={language === 'en' ? 'john.doe@company.com' : 'juan.perez@empresa.com'}
                className="pl-10"
                required
              />
            </div>
          </div>
        </div>

        {/* Default Values Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            {t('company.simpleEmployeeForm.defaultValuesTitle')}
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
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
          <Button onClick={handleSubmit} disabled={isLoading || !validateForm()}>
            {isLoading ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
