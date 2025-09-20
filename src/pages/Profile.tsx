import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import ChangeRequestsList from "@/components/ChangeRequestsList";
import ScrollToTopButton from "@/components/ScrollToTopButton";
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
  employment_start_date?: string;
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
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingFullName, setIsEditingFullName] = useState(false);
  const [isEditingBankName, setIsEditingBankName] = useState(false);
  const [isEditingAccountNumber, setIsEditingAccountNumber] = useState(false);
  const [isEditingAccountType, setIsEditingAccountType] = useState(false);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [changeRequestField, setChangeRequestField] = useState('');
  const [changeRequestReason, setChangeRequestReason] = useState('');
  const [changeRequestFirstName, setChangeRequestFirstName] = useState('');
  const [changeRequestLastName, setChangeRequestLastName] = useState('');
  
  // Password change form data
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Editable contact data
  const [contactData, setContactData] = useState({
    phone: ''
  });

  // Email editing data
  const [emailData, setEmailData] = useState({
    email: '',
    reason: ''
  });

  // Full name editing data
  const [fullNameData, setFullNameData] = useState({
    firstName: '',
    lastName: '',
    reason: ''
  });

  // Bank name editing data
  const [bankNameData, setBankNameData] = useState({
    bankName: '',
    reason: ''
  });

  // Account number editing data
  const [accountNumberData, setAccountNumberData] = useState({
    accountNumber: '',
    reason: ''
  });

  // Account type editing data
  const [accountTypeData, setAccountTypeData] = useState({
    accountType: '',
    reason: ''
  });
  
  // Verification data
  const [verificationData, setVerificationData] = useState<VerificationData>({
    field: 'email',
    newValue: '',
    code: '',
    isVerified: false,
    attempts: 0
  });
  

  // Initialize contact data
  const initializeContactData = () => {
    if (employee) {
      setContactData({
        phone: employee.phone || ''
      });
    }
  };

  // Initialize password data
  const initializePasswordData = () => {
    setPasswordData({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  // Initialize email data
  const initializeEmailData = () => {
    if (user) {
      setEmailData({
        email: user.email || '',
        reason: ''
      });
    }
  };

  // Initialize full name data
  const initializeFullNameData = () => {
    if (employee) {
      setFullNameData({
        firstName: employee.first_name || '',
        lastName: employee.last_name || '',
        reason: ''
      });
    }
  };

  // Initialize bank name data
  const initializeBankNameData = () => {
    if (employee) {
      setBankNameData({
        bankName: employee.bank_name || '',
        reason: ''
      });
    }
  };

  // Initialize account number data
  const initializeAccountNumberData = () => {
    if (employee) {
      setAccountNumberData({
        accountNumber: employee.account_number || '',
        reason: ''
      });
    }
  };

  // Initialize account type data
  const initializeAccountTypeData = () => {
    if (employee) {
      setAccountTypeData({
        accountType: employee.account_type || '',
        reason: ''
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

  // Fetch change requests
  const fetchChangeRequests = async () => {
    try {
      if (!employee) return;
      
      const { data, error } = await changeRequestService.getEmployeeChangeRequests(employee.id);
      if (error) {
        console.error('Error fetching change requests:', error);
        return;
      }
      
      setChangeRequests(data || []);
    } catch (error) {
      console.error('Error fetching change requests:', error);
    }
  };

  // Get change request status for a specific field
  const getChangeRequestStatus = (fieldName: string) => {
    const request = changeRequests.find(req => req.field_name === fieldName && req.status === 'pending');
    return request ? request.status : null;
  };

  // Cancel change request
  const handleCancelChangeRequest = async (requestId: string) => {
    try {
      const { error } = await changeRequestService.updateChangeRequestStatus(requestId, 'cancelled');
      
      if (error) {
        toast({
          title: t('common.error'),
          description: 'Failed to cancel change request',
          variant: "destructive"
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Change request cancelled',
        variant: "default"
      });

      // Refresh change requests
      fetchChangeRequests();
    } catch (error) {
      console.error('Error cancelling change request:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to cancel change request',
        variant: "destructive"
      });
    }
  };

  // Initialize contact data when employee data is loaded
  useEffect(() => {
    if (employee) {
      initializeContactData();
      fetchChangeRequests();
    }
  }, [employee]);

  // Phone editing functions
  const handleEditPhone = () => {
    setIsEditingPhone(true);
  };

  const handleSavePhone = async () => {
    try {
      if (!employee) return;

      const phoneChanged = contactData.phone !== employee.phone;

      if (phoneChanged) {
        // Update phone number directly in Supabase
        const { error } = await supabase
          .from('employees')
          .update({ phone: contactData.phone })
          .eq('id', employee.id);

        if (error) {
          throw error;
        }

        // Update local employee state
        setEmployee(prev => prev ? { ...prev, phone: contactData.phone } : null);

        toast({
          title: t('common.success'),
          description: t('employee.profile.phoneUpdated'),
        });
      }

      // Close editing mode
      setIsEditingPhone(false);
    } catch (error: any) {
      console.error('Error saving phone:', error);
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to update phone number',
        variant: "destructive"
      });
    }
  };

  const handleCancelPhoneEdit = () => {
    initializeContactData();
    setIsEditingPhone(false);
  };

  // Password editing functions
  const handleEditPassword = () => {
    setIsEditingPassword(true);
    initializePasswordData();
  };

  const handleSavePassword = async () => {
    try {
      if (!employee) return;

      // Validate passwords
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({
          title: t('common.error'),
          description: t('employee.profile.passwordMismatch'),
          variant: "destructive"
        });
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast({
          title: t('common.error'),
          description: t('employee.profile.passwordTooShort'),
          variant: "destructive"
        });
        return;
      }

      if (!passwordData.oldPassword) {
        toast({
          title: t('common.error'),
          description: t('employee.profile.passwordRequired'),
          variant: "destructive"
        });
        return;
      }

      // First, verify the old password by attempting to sign in with it
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('User not found');
      }

      // Try to sign in with the old password to verify it's correct
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.oldPassword
      });

      if (signInError) {
        toast({
          title: t('common.error'),
          description: t('employee.profile.passwordIncorrect'),
          variant: "destructive"
        });
        return;
      }

      // If we get here, the old password is correct, now update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: t('common.success'),
        description: t('employee.profile.passwordUpdated'),
      });

      setIsEditingPassword(false);
      initializePasswordData();
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to update password',
        variant: "destructive"
      });
    }
  };

  const handleCancelPasswordEdit = () => {
    setIsEditingPassword(false);
    initializePasswordData();
  };

  // Email editing functions
  const handleEditEmail = () => {
    setIsEditingEmail(true);
    initializeEmailData();
  };

  const handleSaveEmail = async () => {
    try {
      console.log('=== EMAIL SAVE DEBUG ===');
      console.log('Employee:', employee);
      console.log('Email data:', emailData);
      console.log('Email changed:', emailData.email !== user?.email);
      console.log('========================');

      if (!user) {
        console.log('No user data, returning');
        return;
      }

      const emailChanged = emailData.email.trim() !== user.email?.trim();
      console.log('Email changed check:', emailChanged);
      console.log('Current email:', user.email);
      console.log('New email:', emailData.email);

      if (emailChanged) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        console.log('Email validation:', emailRegex.test(emailData.email));
        if (!emailRegex.test(emailData.email)) {
          console.log('Email validation failed');
          toast({
            title: t('common.error'),
            description: t('employee.profile.emailInvalid'),
            variant: "destructive"
          });
          return;
        }

        // Validate reason
        console.log('Reason validation:', emailData.reason.trim().length > 0);
        if (!emailData.reason.trim()) {
          console.log('Reason validation failed');
          toast({
            title: t('common.error'),
            description: t('employee.profile.reasonRequired'),
            variant: "destructive"
          });
          return;
        }

        // Create change request instead of direct update
        console.log('Creating change request with data:', {
          employee_id: employee.id,
          field_name: 'email',
          current_value: user.email,
          requested_value: emailData.email,
          reason: emailData.reason,
          details: `Email change request from ${user.email} to ${emailData.email}`,
          category: 'contact',
          priority: 'normal'
        });

        const result = await changeRequestService.createChangeRequest({
          employee_id: employee.id,
          field_name: 'email',
          current_value: user.email,
          requested_value: emailData.email,
          reason: emailData.reason,
          details: `Email change request from ${user.email} to ${emailData.email}`,
          category: 'contact',
          priority: 'normal'
        });

        console.log('Change request result:', result);

        if (!result.success) {
          console.log('Change request failed:', result.error);
          throw new Error(result.error || 'Failed to create change request');
        }

        toast({
          title: t('common.success'),
          description: t('employee.profile.emailChangeRequested'),
        });
      } else {
        console.log('Email not changed, no request needed');
        toast({
          title: t('common.error'),
          description: t('employee.profile.noEmailChange'),
          variant: "destructive"
        });
        return;
      }

      // Close editing mode
      setIsEditingEmail(false);
      fetchChangeRequests(); // Refresh change requests
    } catch (error: any) {
      console.error('Error saving email change request:', error);
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to submit email change request',
        variant: "destructive"
      });
    }
  };

  const handleCancelEmailEdit = () => {
    setIsEditingEmail(false);
    initializeEmailData();
  };

  // Full name editing functions
  const handleEditFullName = () => {
    setIsEditingFullName(true);
    initializeFullNameData();
  };

  const handleSaveFullName = async () => {
    try {
      console.log('=== FULL NAME SAVE DEBUG ===');
      console.log('Employee:', employee);
      console.log('Full name data:', fullNameData);
      console.log('============================');

      if (!employee) {
        console.log('No employee data, returning');
        return;
      }

      const firstNameChanged = fullNameData.firstName.trim() !== employee.first_name?.trim();
      const lastNameChanged = fullNameData.lastName.trim() !== employee.last_name?.trim();
      const nameChanged = firstNameChanged || lastNameChanged;

      console.log('Name changed check:', nameChanged);
      console.log('First name changed:', firstNameChanged);
      console.log('Last name changed:', lastNameChanged);

      if (nameChanged) {
        // Validate reason
        console.log('Reason validation:', fullNameData.reason.trim().length > 0);
        if (!fullNameData.reason.trim()) {
          console.log('Reason validation failed');
          toast({
            title: t('common.error'),
            description: t('employee.profile.reasonRequired'),
            variant: "destructive"
          });
          return;
        }

        // Create change request for full name change
        console.log('Creating full name change request with data:', {
          employee_id: employee.id,
          field_name: 'first_name',
          current_value: employee.first_name,
          requested_value: fullNameData.firstName,
          reason: fullNameData.reason,
          details: `Full Name Change Request: ${employee.first_name} ${employee.last_name} → ${fullNameData.firstName} ${fullNameData.lastName}`,
          category: 'profile',
          priority: 'normal'
        });

        // Create single change request for full name change
        const result = await changeRequestService.createChangeRequest({
          employee_id: employee.id,
          field_name: 'first_name', // Use first_name as field name
          current_value: `${employee.first_name} ${employee.last_name}`,
          requested_value: `${fullNameData.firstName} ${fullNameData.lastName}`,
          reason: fullNameData.reason,
          details: `FULL_NAME_CHANGE: ${employee.first_name} ${employee.last_name} → ${fullNameData.firstName} ${fullNameData.lastName}`, // Special marker in details
          category: 'profile',
          priority: 'normal'
        });

        console.log('Full name change request result:', result);

        if (!result.success) {
          console.log('Full name change request failed:', result.error);
          throw new Error(result.error || 'Failed to create change request');
        }

        toast({
          title: t('common.success'),
          description: t('employee.profile.fullNameChangeRequested'),
        });
      } else {
        console.log('Name not changed, no request needed');
        toast({
          title: t('common.error'),
          description: t('employee.profile.noNameChange'),
          variant: "destructive"
        });
        return;
      }

      // Close editing mode
      setIsEditingFullName(false);
      fetchChangeRequests(); // Refresh change requests
    } catch (error: any) {
      console.error('Error saving full name change request:', error);
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to submit full name change request',
        variant: "destructive"
      });
    }
  };

  const handleCancelFullNameEdit = () => {
    setIsEditingFullName(false);
    initializeFullNameData();
  };

  // Bank name editing handlers
  const handleEditBankName = () => {
    setIsEditingBankName(true);
    initializeBankNameData();
  };

  const handleSaveBankName = async () => {
    try {
      console.log('=== BANK NAME SAVE DEBUG ===');
      console.log('Current bank name:', employee?.bank_name);
      console.log('New bank name:', bankNameData.bankName);
      console.log('Reason:', bankNameData.reason);

      if (!employee) return;

      // Check if bank name has changed
      if (bankNameData.bankName.trim() === employee.bank_name?.trim()) {
        toast({
          title: t('employee.profile.noBankNameChange'),
          variant: "destructive"
        });
        return;
      }

      // Validate reason
      if (!bankNameData.reason.trim()) {
        toast({
          title: t('employee.profile.reasonRequired'),
          variant: "destructive"
        });
        return;
      }

      // Create change request
      await changeRequestService.createChangeRequest({
        employee_id: employee.id,
        field_name: 'bank_name',
        current_value: employee.bank_name || '',
        requested_value: bankNameData.bankName.trim(),
        reason: bankNameData.reason.trim(),
        details: 'Bank Name Change Request',
        category: 'financial'
      });

      toast({
        title: t('employee.profile.bankNameChangeRequested'),
        variant: "default"
      });

      setIsEditingBankName(false);
      fetchChangeRequests(); // Refresh change requests
    } catch (error) {
      console.error('Error creating bank name change request:', error);
      toast({
        title: t('common.error'),
        description: t('common.errorOccurred'),
        variant: "destructive"
      });
    }
  };

  const handleCancelBankNameEdit = () => {
    setIsEditingBankName(false);
    initializeBankNameData();
  };

  // Account number editing handlers
  const handleEditAccountNumber = () => {
    setIsEditingAccountNumber(true);
    initializeAccountNumberData();
  };

  const handleSaveAccountNumber = async () => {
    try {
      console.log('=== ACCOUNT NUMBER SAVE DEBUG ===');
      console.log('Current account number:', employee?.account_number);
      console.log('New account number:', accountNumberData.accountNumber);
      console.log('Reason:', accountNumberData.reason);

      if (!employee) return;

      // Check if account number has changed
      if (accountNumberData.accountNumber.trim() === employee.account_number?.trim()) {
        toast({
          title: t('employee.profile.noAccountNumberChange'),
          variant: "destructive"
        });
        return;
      }

      // Validate reason
      if (!accountNumberData.reason.trim()) {
        toast({
          title: t('employee.profile.reasonRequired'),
          variant: "destructive"
        });
        return;
      }

      // Create change request
      await changeRequestService.createChangeRequest({
        employee_id: employee.id,
        field_name: 'account_number',
        current_value: employee.account_number || '',
        requested_value: accountNumberData.accountNumber.trim(),
        reason: accountNumberData.reason.trim(),
        details: 'Account Number Change Request',
        category: 'financial'
      });

      toast({
        title: t('employee.profile.accountNumberChangeRequested'),
        variant: "default"
      });

      setIsEditingAccountNumber(false);
      fetchChangeRequests(); // Refresh change requests
    } catch (error) {
      console.error('Error creating account number change request:', error);
      toast({
        title: t('common.error'),
        description: t('common.errorOccurred'),
        variant: "destructive"
      });
    }
  };

  const handleCancelAccountNumberEdit = () => {
    setIsEditingAccountNumber(false);
    initializeAccountNumberData();
  };

  // Account type editing handlers
  const handleEditAccountType = () => {
    setIsEditingAccountType(true);
    initializeAccountTypeData();
  };

  const handleSaveAccountType = async () => {
    try {
      console.log('=== ACCOUNT TYPE SAVE DEBUG ===');
      console.log('Current account type:', employee?.account_type);
      console.log('New account type:', accountTypeData.accountType);
      console.log('Reason:', accountTypeData.reason);

      if (!employee) return;

      // Check if account type has changed
      if (accountTypeData.accountType.trim() === employee.account_type?.trim()) {
        toast({
          title: t('employee.profile.noAccountTypeChange'),
          variant: "destructive"
        });
        return;
      }

      // Validate reason
      if (!accountTypeData.reason.trim()) {
        toast({
          title: t('employee.profile.reasonRequired'),
          variant: "destructive"
        });
        return;
      }

      // Create change request
      await changeRequestService.createChangeRequest({
        employee_id: employee.id,
        field_name: 'account_type',
        current_value: employee.account_type || '',
        requested_value: accountTypeData.accountType.trim(),
        reason: accountTypeData.reason.trim(),
        details: 'Account Type Change Request',
        category: 'financial'
      });

      toast({
        title: t('employee.profile.accountTypeChangeRequested'),
        variant: "default"
      });

      setIsEditingAccountType(false);
      fetchChangeRequests(); // Refresh change requests
    } catch (error) {
      console.error('Error creating account type change request:', error);
      toast({
        title: t('common.error'),
        description: t('common.errorOccurred'),
        variant: "destructive"
      });
    }
  };

  const handleCancelAccountTypeEdit = () => {
    setIsEditingAccountType(false);
    initializeAccountTypeData();
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
          current_value: `${employee.first_name} ${employee.last_name}`,
          requested_value: `${changeRequestFirstName.trim()} ${changeRequestLastName.trim()}`,
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
          current_value: `${employee.first_name} ${employee.last_name}`,
          requested_value: `${changeRequestFirstName.trim()} ${changeRequestLastName.trim()}`,
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
    const financialFields = ['bank_name', 'account_number', 'account_type'];
    const personalFields = ['first_name', 'last_name', 'cedula', 'date_of_birth', 'email'];
    const workFields = ['monthly_salary', 'weekly_hours', 'position', 'department', 'employee_id', 'employment_start_date'];
    const contactFields = ['phone', 'password'];

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
              {/* Phone Field */}
              <div>
                <Label htmlFor="phone">{t('employee.phone')}</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="phone"
                    value={contactData.phone}
                    onChange={(e) => setContactData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditingPhone}
                    className="mt-1"
                  />
                  {!isEditingPhone ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEditPhone}
                      className="text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      {t('common.edit')}
                    </Button>
                  ) : (
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelPhoneEdit}
                        className="text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        {t('common.cancel')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSavePhone}
                        className="text-xs"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        {t('common.save')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password">{t('employee.profile.changePassword')}</Label>
                {!isEditingPassword ? (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleEditPassword}
                      className="w-full justify-start"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      {t('employee.profile.changePassword')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 mt-2">
                    <div>
                      <Label htmlFor="oldPassword" className="text-sm">{t('employee.profile.oldPassword')}</Label>
                      <Input
                        id="oldPassword"
                        type="password"
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                        placeholder={t('employee.profile.passwordPlaceholder')}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword" className="text-sm">{t('employee.profile.newPassword')}</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder={t('employee.profile.newPasswordPlaceholder')}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-sm">{t('employee.profile.confirmPassword')}</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder={t('employee.profile.confirmPasswordPlaceholder')}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center justify-end space-x-2 pt-2">
                      <Button variant="outline" onClick={handleCancelPasswordEdit} size="sm">
                        <X className="h-4 w-4 mr-1" />
                        {t('common.cancel')}
                      </Button>
                      <Button onClick={handleSavePassword} size="sm">
                        <Save className="h-4 w-4 mr-1" />
                        {t('common.save')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
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
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Email Field - Read Only */}
                 <div>
                   <Label className="text-sm font-medium text-muted-foreground">{t('employee.email')}</Label>
                   <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                     {user?.email || 'Not provided'}
                   </div>
                 </div>

                 {/* Full Name Field */}
                 <div>
                   <Label className="text-sm font-medium text-muted-foreground">{t('employee.profile.fullName')}</Label>
                   {!isEditingFullName ? (
                     <div className="space-y-2">
                       <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                         {employee?.first_name} {employee?.last_name}
                       </div>
                       <div className="flex items-center space-x-2">
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={handleEditFullName}
                           className="text-xs"
                         >
                           <Edit className="h-3 w-3 mr-1" />
                           {t('common.edit')}
                         </Button>
                         {(getChangeRequestStatus('first_name') || getChangeRequestStatus('last_name')) && (
                           <Badge variant="outline" className="text-xs">
                             <Clock className="h-3 w-3 mr-1" />
                             {t('employee.profile.requestPending')}
                           </Badge>
                         )}
                       </div>
                     </div>
                   ) : (
                     <div className="space-y-3">
                       <div className="grid grid-cols-2 gap-2">
                         <div>
                           <Label className="text-sm font-medium text-muted-foreground">
                             {t('employee.profile.firstName')}
                           </Label>
                           <Input
                             value={fullNameData.firstName}
                             onChange={(e) => setFullNameData(prev => ({ ...prev, firstName: e.target.value }))}
                             placeholder={t('employee.profile.firstNamePlaceholder')}
                             className="mt-1"
                           />
                         </div>
                         <div>
                           <Label className="text-sm font-medium text-muted-foreground">
                             {t('employee.profile.lastName')}
                           </Label>
                           <Input
                             value={fullNameData.lastName}
                             onChange={(e) => setFullNameData(prev => ({ ...prev, lastName: e.target.value }))}
                             placeholder={t('employee.profile.lastNamePlaceholder')}
                             className="mt-1"
                           />
                         </div>
                       </div>
                       <div>
                         <Label className="text-sm font-medium text-muted-foreground">
                           {t('employee.profile.reasonForChange')} <span className="text-red-500">*</span>
                         </Label>
                         <Textarea
                           value={fullNameData.reason}
                           onChange={(e) => setFullNameData(prev => ({ ...prev, reason: e.target.value }))}
                           placeholder={t('employee.profile.reasonPlaceholder')}
                           className="mt-1"
                           rows={3}
                         />
                       </div>
                       <div className="text-xs text-muted-foreground">
                         {t('employee.profile.changeRequestNote')}
                       </div>
                       <div className="flex space-x-1">
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={handleCancelFullNameEdit}
                           className="text-xs"
                         >
                           <X className="h-3 w-3 mr-1" />
                           {t('common.cancel')}
                         </Button>
                         <Button
                           size="sm"
                           onClick={handleSaveFullName}
                           className="text-xs"
                         >
                           <Send className="h-3 w-3 mr-1" />
                           {t('employee.profile.submitRequest')}
                         </Button>
                       </div>
                     </div>
                   )}
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
              <div className="space-y-6">
                {/* Bank Name Field */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('employee.bankName')}</Label>
                  {!isEditingBankName ? (
                    <div className="space-y-2">
                      <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                        {employee?.bank_name || 'Not provided'}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleEditBankName}
                          className="text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          {t('common.edit')}
                        </Button>
                        {getChangeRequestStatus('bank_name') && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {t('employee.profile.requestPending')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          {t('employee.profile.newBankName')}
                        </Label>
                        <Select 
                          value={bankNameData.bankName} 
                          onValueChange={(value) => setBankNameData(prev => ({ ...prev, bankName: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={t('employee.profile.bankNamePlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BDV">{language === 'en' ? 'Bank of Venezuela' : 'Banco de Venezuela'}</SelectItem>
                            <SelectItem value="BOD">{language === 'en' ? 'BOD Bank' : 'Banco BOD'}</SelectItem>
                            <SelectItem value="Mercantil">{language === 'en' ? 'Mercantil Bank' : 'Banco Mercantil'}</SelectItem>
                            <SelectItem value="Venezuela">{language === 'en' ? 'Venezuela Bank' : 'Banco Venezuela'}</SelectItem>
                            <SelectItem value="Banesco">{language === 'en' ? 'Banesco Bank' : 'Banco Banesco'}</SelectItem>
                            <SelectItem value="Provincial">{language === 'en' ? 'Provincial Bank' : 'Banco Provincial'}</SelectItem>
                            <SelectItem value="Bicentenario">{language === 'en' ? 'Bicentenario Bank' : 'Banco Bicentenario'}</SelectItem>
                            <SelectItem value="100% Banco">{language === 'en' ? '100% Banco' : '100% Banco'}</SelectItem>
                            <SelectItem value="Banco Plaza">{language === 'en' ? 'Banco Plaza' : 'Banco Plaza'}</SelectItem>
                            <SelectItem value="Banco Exterior">{language === 'en' ? 'Banco Exterior' : 'Banco Exterior'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          {t('employee.profile.reasonForChange')} <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          value={bankNameData.reason}
                          onChange={(e) => setBankNameData(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder={t('employee.profile.reasonPlaceholder')}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('employee.profile.changeRequestNote')}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelBankNameEdit}
                          className="text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          {t('common.cancel')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveBankName}
                          className="text-xs"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          {t('employee.profile.submitRequest')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Number Field */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('employee.accountNumber')}</Label>
                  {!isEditingAccountNumber ? (
                    <div className="space-y-2">
                      <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                        {employee?.account_number ? `****-****-${employee.account_number.slice(-4)}` : 'Not provided'}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleEditAccountNumber}
                          className="text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          {t('common.edit')}
                        </Button>
                        {getChangeRequestStatus('account_number') && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {t('employee.profile.requestPending')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          {t('employee.profile.newAccountNumber')}
                        </Label>
                        <Input
                          type="text"
                          value={accountNumberData.accountNumber}
                          onChange={(e) => setAccountNumberData(prev => ({ ...prev, accountNumber: e.target.value }))}
                          placeholder={t('employee.profile.accountNumberPlaceholder')}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          {t('employee.profile.reasonForChange')} <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          value={accountNumberData.reason}
                          onChange={(e) => setAccountNumberData(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder={t('employee.profile.reasonPlaceholder')}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('employee.profile.changeRequestNote')}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelAccountNumberEdit}
                          className="text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          {t('common.cancel')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveAccountNumber}
                          className="text-xs"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          {t('employee.profile.submitRequest')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Type Field */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('employee.accountType')}</Label>
                  {!isEditingAccountType ? (
                    <div className="space-y-2">
                      <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                        {employee?.account_type ? (employee.account_type === 'savings' ? t('employeeForm.savings') : t('employeeForm.checking')) : 'Not provided'}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleEditAccountType}
                          className="text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          {t('common.edit')}
                        </Button>
                        {getChangeRequestStatus('account_type') && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {t('employee.profile.requestPending')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          {t('employee.profile.newAccountType')}
                        </Label>
                        <Select 
                          value={accountTypeData.accountType} 
                          onValueChange={(value) => setAccountTypeData(prev => ({ ...prev, accountType: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={t('employee.profile.accountTypePlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="savings">{t('employeeForm.savings')}</SelectItem>
                            <SelectItem value="checking">{t('employeeForm.checking')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          {t('employee.profile.reasonForChange')} <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          value={accountTypeData.reason}
                          onChange={(e) => setAccountTypeData(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder={t('employee.profile.reasonPlaceholder')}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('employee.profile.changeRequestNote')}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelAccountTypeEdit}
                          className="text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          {t('common.cancel')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveAccountType}
                          className="text-xs"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          {t('employee.profile.submitRequest')}
                        </Button>
                      </div>
                    </div>
                  )}
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
              <div className="space-y-4">
                {/* First Line: Position and Department */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
                
                {/* Second Line: Salary and Weekly Hours */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
                
                {/* Third Line: Employment Start Date */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('employee.profile.hireDate')}</Label>
                    <div className="text-lg font-semibold py-2 px-3 bg-muted/50 rounded-md">
                      {employee?.employment_start_date ? new Date(employee.employment_start_date).toLocaleDateString() : 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Change Requests History */}
        <ChangeRequestsList
          changeRequests={changeRequests}
          onCancelRequest={handleCancelChangeRequest}
          itemsPerPage={5}
        />
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

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
};

export default Profile;
