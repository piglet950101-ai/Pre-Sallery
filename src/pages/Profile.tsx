import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, 
  Edit, 
  Save, 
  X,
  ArrowLeft,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  CreditCard,
  Building,
  Calendar,
  UserCheck,
  Send,
  Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { verificationService } from "@/services/verificationService";
import { changeRequestService } from "@/services/changeRequestService";
import { auditService } from "@/services/auditService";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  monthly_salary: number;
  weekly_hours: number;
  year_of_employment: number;
  bank_name: string;
  account_number: string;
  account_type: string;
  is_active: boolean;
  is_verified: boolean;
  cedula?: string;
  date_of_birth?: string;
  position?: string;
  department?: string;
  manager?: string;
  employee_id?: string;
  hire_date?: string;
  account_holder?: string;
  routing_number?: string;
  pago_movil_number?: string;
}

interface ChangeRequest {
  id?: string;
  field: string;
  current_value: string;
  requested_value: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

interface VerificationData {
  field: 'email' | 'phone';
  newValue: string;
  code: string;
  isVerified: boolean;
  attempts: number;
}

const Profile = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [changeRequestField, setChangeRequestField] = useState('');
  const [changeRequestReason, setChangeRequestReason] = useState('');
  const [changeRequestFirstName, setChangeRequestFirstName] = useState('');
  const [changeRequestLastName, setChangeRequestLastName] = useState('');
  
  // Editable contact data
  const [contactData, setContactData] = useState({
    email: '',
    phone: ''
  });
  
  // Verification data
  const [verificationData, setVerificationData] = useState<VerificationData>({
    field: 'email',
    newValue: '',
    code: '',
    isVerified: false,
    attempts: 0
  });
  
  // Change requests
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);

  // Initialize contact data
  const initializeContactData = () => {
    if (employee) {
      setContactData({
        email: employee.email || '',
        phone: employee.phone || ''
      });
    }
  };

  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error(t('employee.error.unauthenticated'));
        }

        // Get employee data
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select("*")
          .eq("auth_user_id", user.id)
          .single();

        if (employeeError) {
          throw new Error(`${t('employee.error.loadEmployeeData')}: ${employeeError.message}`);
        }

        setEmployee(employeeData);
      } catch (error) {
        console.error('Error fetching employee data:', error);
        toast({
          title: t('common.error'),
          description: error instanceof Error ? error.message : t('common.errorOccurred'),
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeeData();
  }, [toast, t]);

  // Initialize contact data when employee data is loaded
  useEffect(() => {
    if (employee) {
      initializeContactData();
    }
  }, [employee]);

  // Contact editing functions
  const handleEditContact = () => {
    setIsEditingContact(true);
  };

  const handleSaveContact = async () => {
    try {
      if (!employee) return;

      // Check if email or phone changed
      const emailChanged = contactData.email !== employee.email;
      const phoneChanged = contactData.phone !== employee.phone;

      if (emailChanged || phoneChanged) {
        const field = emailChanged ? 'email' : 'phone';
        const newValue = emailChanged ? contactData.email : contactData.phone;

        // Generate verification code
        const result = await verificationService.generateVerificationCode({
          userId: (await supabase.auth.getUser()).data.user?.id || '',
          employeeId: employee.id,
          type: field,
          contactInfo: newValue
        });

        if (result.success) {
          // Show verification modal
          setVerificationData({
            field: field as 'email' | 'phone',
            newValue: newValue,
            code: '',
            isVerified: false,
            attempts: 0
          });
          setShowVerificationModal(true);
        } else {
          toast({
            title: t('common.error'),
            description: result.error || 'Failed to send verification code',
            variant: "destructive"
          });
        }
        return;
      }

      // No changes, just close editing
      setIsEditingContact(false);
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: t('common.error'),
        description: t('employee.profileUpdateError'),
        variant: "destructive"
      });
    }
  };

  const handleCancelContactEdit = () => {
    initializeContactData();
    setIsEditingContact(false);
  };

  // Verification functions
  const handleVerifyCode = async () => {
    try {
      if (!employee) return;

      const result = await verificationService.verifyCode({
        userId: (await supabase.auth.getUser()).data.user?.id || '',
        code: verificationData.code,
        type: verificationData.field
      });

      if (result.success) {
        setVerificationData(prev => ({ ...prev, isVerified: true }));
        
        // Update the employee data
        const { error } = await supabase
          .from('employees')
          .update({
            [verificationData.field]: verificationData.newValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', employee.id);

        if (error) throw error;

        // Log the change
        await auditService.logProfileChange(
          employee.id,
          verificationData.field,
          employee[verificationData.field],
          verificationData.newValue,
          (await supabase.auth.getUser()).data.user?.id
        );

        // Update local state
        setEmployee(prev => prev ? {
          ...prev,
          [verificationData.field]: verificationData.newValue
        } : null);

        toast({
          title: t('employee.profile.verified'),
          description: t('employee.profile.verificationSent'),
        });

        setShowVerificationModal(false);
        setIsEditingContact(false);
      } else {
        setVerificationData(prev => ({ 
          ...prev, 
          attempts: prev.attempts + 1 
        }));
        toast({
          title: t('employee.profile.verificationFailed'),
          description: result.error || 'Invalid verification code',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to verify code',
        variant: "destructive"
      });
    }
  };

  // Change request functions
  const handleRequestChange = (field: string) => {
    setChangeRequestField(field);
    setChangeRequestReason('');
    setShowChangeRequestModal(true);
  };

  // Special handler for full name changes (requires both first and last name)
  const handleFullNameChange = () => {
    setChangeRequestField('full_name');
    setChangeRequestReason('');
    setChangeRequestFirstName(employee?.first_name || '');
    setChangeRequestLastName(employee?.last_name || '');
    setShowChangeRequestModal(true);
  };

  const handleSubmitChangeRequest = async () => {
    try {
      if (!employee) return;

      // Handle full name changes specially (create two separate requests)
      if (changeRequestField === 'full_name') {
        if (!changeRequestFirstName.trim() || !changeRequestLastName.trim()) {
          toast({
            title: t('common.error'),
            description: 'Both first name and last name are required',
            variant: "destructive"
          });
          return;
        }

        // Create change request for first name
        console.log('=== CREATING FIRST NAME CHANGE REQUEST ===');
        console.log('First name:', changeRequestFirstName.trim());
        console.log('Current first name:', employee.first_name);
        console.log('Reason:', changeRequestReason);
        
        const firstNameResult = await changeRequestService.createChangeRequest({
          employee_id: employee.id,
          field_name: 'first_name',
          current_value: employee.first_name,
          requested_value: changeRequestFirstName.trim(),
          reason: changeRequestReason,
          details: `Full Name Change - First Name: ${changeRequestFirstName.trim()}, Last Name: ${changeRequestLastName.trim()}`,
          category: 'personal',
          priority: 'normal'
        });

        console.log('First name result:', firstNameResult);

        // Create change request for last name
        console.log('=== CREATING LAST NAME CHANGE REQUEST ===');
        console.log('Last name:', changeRequestLastName.trim());
        console.log('Current last name:', employee.last_name);
        console.log('Reason:', changeRequestReason);
        
        const lastNameResult = await changeRequestService.createChangeRequest({
          employee_id: employee.id,
          field_name: 'last_name',
          current_value: employee.last_name,
          requested_value: changeRequestLastName.trim(),
          reason: changeRequestReason,
          details: `Full Name Change - First Name: ${changeRequestFirstName.trim()}, Last Name: ${changeRequestLastName.trim()}`,
          category: 'personal',
          priority: 'normal'
        });

        console.log('Last name result:', lastNameResult);

        if (firstNameResult.success && lastNameResult.success) {
          setChangeRequests(prev => [...prev, firstNameResult.data!, lastNameResult.data!]);
          
          // Log both change requests
          await auditService.logChangeRequestAction(
            firstNameResult.data!.id!,
            'create_change_request',
            employee.id,
            (await supabase.auth.getUser()).data.user?.id
          );
          
          await auditService.logChangeRequestAction(
            lastNameResult.data!.id!,
            'create_change_request',
            employee.id,
            (await supabase.auth.getUser()).data.user?.id
          );
          
          toast({
            title: t('employee.profile.requestSubmitted'),
            description: 'Full name change request submitted (both first and last name)',
          });

          setShowChangeRequestModal(false);
          setChangeRequestField('');
          setChangeRequestReason('');
          setChangeRequestFirstName('');
          setChangeRequestLastName('');
        } else {
          throw new Error('Failed to create full name change requests');
        }
      } else {
        // Handle regular field changes
        const result = await changeRequestService.createChangeRequest({
          employee_id: employee.id,
          field_name: changeRequestField,
          current_value: getCurrentFieldValue(changeRequestField),
          requested_value: '', // This would be filled by the user in a more complex UI
          reason: changeRequestReason,
          details: '', // No additional details field for regular changes
          category: getFieldCategory(changeRequestField),
          priority: 'normal'
        });

        if (result.success && result.data) {
          setChangeRequests(prev => [...prev, result.data!]);
          
          // Log the change request
          await auditService.logChangeRequestAction(
            result.data.id!,
            'create_change_request',
            employee.id,
            (await supabase.auth.getUser()).data.user?.id
          );
          
          toast({
            title: t('employee.profile.requestSubmitted'),
            description: t('employee.profile.requestSubmittedDesc'),
          });

          setShowChangeRequestModal(false);
          setChangeRequestField('');
          setChangeRequestReason('');
        } else {
          throw new Error(result.error || 'Failed to create change request');
        }
      }
    } catch (error) {
      console.error('Error submitting change request:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to submit change request',
        variant: "destructive"
      });
    }
  };

  const getFieldCategory = (field: string): 'profile' | 'financial' | 'personal' | 'work' | 'contact' => {
    const financialFields = ['bank_name', 'account_number', 'account_type', 'pago_movil'];
    const personalFields = ['first_name', 'last_name', 'cedula', 'date_of_birth'];
    const workFields = ['monthly_salary', 'weekly_hours', 'position', 'department', 'employee_id', 'hire_date'];
    const contactFields = ['email', 'phone'];

    if (financialFields.includes(field)) return 'financial';
    if (personalFields.includes(field)) return 'personal';
    if (workFields.includes(field)) return 'work';
    if (contactFields.includes(field)) return 'contact';
    return 'profile';
  };

  const getCurrentFieldValue = (field: string): string => {
    if (!employee) return '';
    
    switch (field) {
      case 'first_name':
        return employee.first_name;
      case 'last_name':
        return employee.last_name;
      case 'cedula':
        return employee.cedula || '';
      case 'bank_name':
        return employee.bank_name;
      case 'account_number':
        return employee.account_number;
      case 'account_type':
        return employee.account_type;
      case 'monthly_salary':
        return employee.monthly_salary.toString();
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">{t('employee.error.noEmployee')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Back Button */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link to="/employee" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>{t('common.back')}</span>
            </Link>
          </Button>
        </div>

        {/* Profile Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('employee.profile')}</h1>
            <p className="text-muted-foreground mt-2">{t('employee.profileDesc')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleEditContact}
              disabled={isEditingContact}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>{t('employee.profile.editableFields')}</span>
            </Button>
          </div>
        </div>

        {/* Security Notice */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800">{t('employee.profile.securityNotice')}</h3>
                <p className="text-sm text-amber-700 mt-1">{t('employee.profile.securityNoticeDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editable Fields - Contact Information */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-700">
                <Mail className="h-5 w-5" />
                <span>{t('employee.profile.contactInfo')}</span>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  {t('employee.profile.editableFields')}
                </Badge>
              </CardTitle>
              <CardDescription>
                {t('employee.profile.editableFieldsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">{t('employee.email')}</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="email"
                    type="email"
                    value={contactData.email}
                    onChange={(e) => setContactData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditingContact}
                    className="mt-1"
                  />
                  {isEditingContact && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequestChange('email')}
                      className="text-xs"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {t('employee.profile.requestChange')}
                    </Button>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="phone">{t('employee.phone')}</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="phone"
                    value={contactData.phone}
                    onChange={(e) => setContactData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditingContact}
                    className="mt-1"
                  />
                  {isEditingContact && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequestChange('phone')}
                      className="text-xs"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {t('employee.profile.requestChange')}
                    </Button>
                  )}
                </div>
              </div>

              {/* Action Buttons for Contact Editing */}
              {isEditingContact && (
                <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={handleCancelContactEdit} size="sm">
                    <X className="h-4 w-4 mr-1" />
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={handleSaveContact} size="sm">
                    <Save className="h-4 w-4 mr-1" />
                    {t('common.save')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Restricted Fields - Personal Information */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-700">
                <User className="h-5 w-5" />
                <span>{t('employee.profile.personalInfo')}</span>
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                  <Lock className="h-3 w-3 mr-1" />
                  {t('employee.profile.restrictedFields')}
                </Badge>
              </CardTitle>
              <CardDescription>
                {t('employee.profile.restrictedFieldsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('employee.profile.fullName')}</Label>
                  <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                    {employee?.first_name} {employee?.last_name}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleFullNameChange}
                    className="mt-2 text-xs"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {t('employee.profile.requestChange')}
                  </Button>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('employee.profile.cedula')}</Label>
                  <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                    {employee?.cedula || 'Not provided'}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequestChange('cedula')}
                    className="mt-2 text-xs"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {t('employee.profile.requestChange')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restricted Fields - Financial Information */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-700">
                <CreditCard className="h-5 w-5" />
                <span>{t('employee.profile.financialInfo')}</span>
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                  <Lock className="h-3 w-3 mr-1" />
                  {t('employee.profile.restrictedFields')}
                </Badge>
              </CardTitle>
              <CardDescription>
                {t('employee.profile.restrictedFieldsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('employee.bankName')}</Label>
                  <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                    {employee?.bank_name}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequestChange('bank_name')}
                    className="mt-2 text-xs"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {t('employee.profile.requestChange')}
                  </Button>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('employee.accountNumber')}</Label>
                  <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                    ****-****-{employee?.account_number?.slice(-4)}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequestChange('account_number')}
                    className="mt-2 text-xs"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {t('employee.profile.requestChange')}
                  </Button>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('employee.accountType')}</Label>
                  <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                    {employee?.account_type === 'savings' ? t('employeeForm.savings') : t('employeeForm.checking')}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequestChange('account_type')}
                    className="mt-2 text-xs"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {t('employee.profile.requestChange')}
                  </Button>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('employee.profile.pagoMovilNumber')}</Label>
                  <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                    {employee?.phone || 'Not provided'}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequestChange('account_type')}
                    className="mt-2 text-xs"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {t('employee.profile.requestChange')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restricted Fields - Work Information */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-700">
                <Building className="h-5 w-5" />
                <span>{t('employee.profile.workInfo')}</span>
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                  <Lock className="h-3 w-3 mr-1" />
                  {t('employee.profile.restrictedFields')}
                </Badge>
              </CardTitle>
              <CardDescription>
                {t('employee.profile.restrictedFieldsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('employee.monthlySalary')}</Label>
                  <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                    ${employee?.monthly_salary.toFixed(2)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('employee.weeklyHours')}</Label>
                  <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                    {employee?.weekly_hours}h
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('employee.profile.position')}</Label>
                  <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                    {employee?.position || 'Not specified'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('employee.profile.department')}</Label>
                  <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                    {employee?.department || 'Not specified'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('employee.profile.employeeId')}</Label>
                  <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                    {employee?.employee_id || 'Not assigned'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('employee.profile.hireDate')}</Label>
                  <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                    {employee?.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'Not specified'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Change Requests History */}
        {changeRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>{t('employee.profile.changeRequested')}</span>
                <Badge variant="secondary">{changeRequests.length}</Badge>
              </CardTitle>
              <CardDescription>
                {t('employee.profile.changeRequestDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {changeRequests.map((request, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{request.field_name.replace('_', ' ').toUpperCase()}</div>
                      <div className="text-sm text-muted-foreground">{request.reason}</div>
                    </div>
                    <Badge variant={request.status === 'pending' ? 'secondary' : request.status === 'approved' ? 'default' : 'destructive'}>
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Change Request Modal */}
      <Dialog open={showChangeRequestModal} onOpenChange={setShowChangeRequestModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              {t('employee.profile.changeRequestModal')}
            </DialogTitle>
            <DialogDescription>
              {t('employee.profile.changeRequestDetails')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Show name input fields for full name changes */}
            {changeRequestField === 'full_name' && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={changeRequestFirstName}
                    onChange={(e) => setChangeRequestFirstName(e.target.value)}
                    placeholder="Enter new first name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={changeRequestLastName}
                    onChange={(e) => setChangeRequestLastName(e.target.value)}
                    placeholder="Enter new last name"
                    className="mt-1"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Current: {employee?.first_name} {employee?.last_name}
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="reason">
                {changeRequestField === 'full_name' 
                  ? 'Reason for name change' 
                  : t('employee.profile.changeRequestReason')
                }
              </Label>
              <Textarea
                id="reason"
                value={changeRequestReason}
                onChange={(e) => setChangeRequestReason(e.target.value)}
                placeholder={
                  changeRequestField === 'full_name' 
                    ? 'Please explain why you need to change your name...' 
                    : 'Please explain why you need this change...'
                }
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeRequestModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleSubmitChangeRequest}
              disabled={
                !changeRequestReason.trim() || 
                (changeRequestField === 'full_name' && (!changeRequestFirstName.trim() || !changeRequestLastName.trim()))
              }
            >
              <Send className="h-4 w-4 mr-2" />
              {t('employee.profile.submitRequest')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Modal */}
      <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {t('employee.profile.verificationRequired')}
            </DialogTitle>
            <DialogDescription>
              {t('employee.profile.verificationSent')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="verificationCode">{t('employee.profile.enterVerificationCode')}</Label>
              <Input
                id="verificationCode"
                value={verificationData.code}
                onChange={(e) => setVerificationData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="Enter 6-digit code"
                className="mt-1"
                maxLength={6}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>For demo purposes, use code: <strong>123456</strong></p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerificationModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleVerifyCode}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('employee.profile.verifyAndSave')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
