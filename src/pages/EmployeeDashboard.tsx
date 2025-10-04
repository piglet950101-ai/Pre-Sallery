import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AdvanceRequestForm } from "@/components/AdvanceRequestForm";
import { KYCUpload } from "@/components/KYCUpload";
import { 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Calendar as CalendarIcon,
  CreditCard,
  Download,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Edit,
  Save,
  Eye,
  EyeOff,
  Filter,
  Search
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from 'xlsx';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

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
  pagomovil_phone?: string;
  pagomovil_cedula?: string;
  pagomovil_bank_name?: string;
  is_active: boolean;
  is_verified: boolean;
  is_approved: boolean;
}

interface AdvanceRequest {
  id: string;
  requested_amount: number;
  fee_amount: number;
  net_amount: number;
  status: string;
  payment_method: string;
  payment_details: string;
  batch_id?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

// const employeeData = {
//   name: "María González",
//   monthlySalary: 800,
//   workedDays: 12,
//   totalDays: 22,
//   earnedAmount: 436.36,
//   availableAmount: 349.09, // 80% of earned
//   usedAmount: 150,
//   pendingAdvances: 1
// };

const EmployeeDashboard = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(true);
  const [mustUploadCedula, setMustUploadCedula] = useState<boolean>(true);
  const [isCompanyApproved, setIsCompanyApproved] = useState<boolean>(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [advanceToCancel, setAdvanceToCancel] = useState<AdvanceRequest | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [filteredAdvanceRequests, setFilteredAdvanceRequests] = useState<AdvanceRequest[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [justSubmittedKyc, setJustSubmittedKyc] = useState<boolean>(false);
  const [isEditingBankTransfer, setIsEditingBankTransfer] = useState<boolean>(false);
  const [isEditingPagomovil, setIsEditingPagomovil] = useState<boolean>(false);
  const [isSavingPaymentInfo, setIsSavingPaymentInfo] = useState<boolean>(false);
  const [banks, setBanks] = useState<Array<{id: string, name: string, code: string}>>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState<boolean>(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [paymentInfoData, setPaymentInfoData] = useState({
    bank_name: '',
    account_number: '',
    account_type: '',
    pagomovil_phone: '',
    pagomovil_cedula: '',
    pagomovil_bank_name: ''
  });
  const [validationErrors, setValidationErrors] = useState({
    bank_name: '',
    account_number: '',
    pagomovil_phone: '',
    pagomovil_cedula: '',
    pagomovil_bank_name: ''
  });

  // Validation functions
  const validateBankName = (bankName: string) => {
    if (!bankName || bankName.trim() === '') {
      return language === 'en' ? 'Bank name is required' : 'El nombre del banco es requerido';
    }
    return '';
  };

  const validateAccountNumber = (accountNumber: string) => {
    if (!accountNumber || accountNumber.trim() === '') {
      return language === 'en' ? 'Account number is required' : 'El número de cuenta es requerido';
    }
    if (!/^\d{20}$/.test(accountNumber)) {
      return language === 'en' ? 'Account number must be exactly 20 digits' : 'El número de cuenta debe tener exactamente 20 dígitos';
    }
    return '';
  };

  const validatePagomovilPhone = (phone: string) => {
    if (!phone || phone.trim() === '') {
      return language === 'en' ? 'Phone number is required' : 'El número de teléfono es requerido';
    }
    // Allow +58XXXXXXXXXX or 0XXXXXXXXXX format
    if (!/^(\+58[0-9]{10}|0[0-9]{10})$/.test(phone)) {
      return language === 'en' ? 'Phone must be +58XXXXXXXXXX or 0XXXXXXXXXX format' : 'El teléfono debe tener formato +58XXXXXXXXXX o 0XXXXXXXXXX';
    }
    return '';
  };

  const validatePagomovilCedula = (cedula: string) => {
    if (!cedula || cedula.trim() === '') {
      return language === 'en' ? 'Cédula is required' : 'La cédula es requerida';
    }
    if (!/^[EVJevj][0-9]{6,8}$/.test(cedula)) {
      return language === 'en' ? 'Cédula must start with E or V, followed by 6-8 digits' : 'La cédula debe comenzar con E o V, seguido de 6-8 dígitos';
    }
    return '';
  };

  const validatePagomovilBankName = (bankName: string) => {
    if (!bankName || bankName.trim() === '') {
      return language === 'en' ? 'Bank name is required' : 'El nombre del banco es requerido';
    }
    return '';
  };

  // Validate Bank Transfer section
  const validateBankTransfer = () => {
    const errors = {
      bank_name: validateBankName(paymentInfoData.bank_name),
      account_number: validateAccountNumber(paymentInfoData.account_number)
    };
    setValidationErrors(prev => ({ ...prev, ...errors }));
    return !errors.bank_name && !errors.account_number;
  };

  // Validate PagoMóvil section
  const validatePagomovil = () => {
    const errors = {
      pagomovil_phone: validatePagomovilPhone(paymentInfoData.pagomovil_phone),
      pagomovil_cedula: validatePagomovilCedula(paymentInfoData.pagomovil_cedula),
      pagomovil_bank_name: validatePagomovilBankName(paymentInfoData.pagomovil_bank_name)
    };
    setValidationErrors(prev => ({ ...prev, ...errors }));
    return !errors.pagomovil_phone && !errors.pagomovil_cedula && !errors.pagomovil_bank_name;
  };

  // Clear validation errors for a specific field
  const clearFieldError = (field: string) => {
    setValidationErrors(prev => ({ ...prev, [field]: '' }));
  };
  
  

  // Calculate derived data
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Calculate actual working days from start of month to current date (excluding weekends)
  const getWorkingDaysInMonth = (year: number, month: number, currentDay: number) => {
    let workingDays = 0;
    for (let day = 1; day <= currentDay; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      // Count Monday (1) through Friday (5) as working days
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        workingDays++;
      }
    }
    return workingDays;
  };
  
  const getTotalWorkingDaysInMonth = (year: number, month: number) => {
    let workingDays = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      // Count Monday (1) through Friday (5) as working days
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        workingDays++;
      }
    }
    return workingDays;
  };
  
  const workedDays = getWorkingDaysInMonth(currentYear, currentMonth, currentDate.getDate());
  const totalWorkingDays = getTotalWorkingDaysInMonth(currentYear, currentMonth);
  const totalDays = daysInMonth;
  
  const monthlySalary = employee?.monthly_salary || 0;
  const earnedAmount = Math.round(((monthlySalary / totalWorkingDays) * workedDays) * 100) / 100;
  
  // Calculate used amount from all non-cancelled advances (completed, pending, processing, approved)
  const usedAmount = Math.round(
    advanceRequests
      .filter(req => !['cancelled', 'failed', 'rejected', 'rechazada'].includes(req.status))
      .reduce((sum, req) => sum + req.requested_amount, 0) * 100
  ) / 100;
  
  // Available amount is 80% of earned amount minus already used advances
  const maxAvailableAmount = Math.round((earnedAmount * 0.8) * 100) / 100;
  const availableAmount = Math.max(0, maxAvailableAmount - usedAmount);
  const pendingAdvances = advanceRequests.filter(req => 
    req.status === 'pending' || req.status === 'processing'
  ).length;

  const progressPercentage = (workedDays / totalWorkingDays) * 100;

  // Check if today is a billing date (15th or last day of month)
  const isBillingDate = () => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    return dayOfMonth === 15 || dayOfMonth === lastDayOfMonth;
  };

  // Fetch employee data and advance requests
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error(t('employee.error.unauthenticated'));
        }

        // Read auth user metadata for gating flags
        const meta: any = (user as any)?.user_metadata || {};
        // Show password change screen ONLY if explicitly set by company registration flow
        setMustChangePassword(meta.must_change_password === true);
        // Require KYC upload for all employees unless already done
        setMustUploadCedula(meta.kyc_cedula_uploaded === true ? false : true);

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
        
        // Populate payment info data
        setPaymentInfoData({
          bank_name: employeeData.bank_name || '',
          account_number: employeeData.account_number || '',
          account_type: employeeData.account_type || '',
          pagomovil_phone: employeeData.pagomovil_phone || '',
          pagomovil_cedula: employeeData.pagomovil_cedula || '',
          pagomovil_bank_name: employeeData.pagomovil_bank_name || ''
        });
        
        // Debug: Log employee approval status
        console.log('Employee approval status:', {
          is_approved: employeeData.is_approved,
          is_verified: employeeData.is_verified,
          is_active: employeeData.is_active
        });

        // Company approval state for info messaging later
        if (employeeData?.company_id) {
          const { data: companyData } = await supabase
            .from("companies")
            .select("is_approved")
            .eq("id", employeeData.company_id)
            .maybeSingle();
          const rawApproved: any = companyData?.is_approved;
          const approved = (
            rawApproved === true ||
            rawApproved === 'true' ||
            rawApproved === 't' ||
            rawApproved === 1
          );
          setIsCompanyApproved(approved);
          // Reset justSubmittedKyc when company is approved OR when employee is approved
          if (approved || employeeData.is_approved) {
            setJustSubmittedKyc(false);
          }
        } else {
          setIsCompanyApproved(false);
        }

        // Get advance requests
        const { data: requestsData, error: requestsError } = await supabase
          .from("advance_transactions")
          .select("*")
          .eq("employee_id", employeeData.id)
          .order("created_at", { ascending: false });

        if (requestsError) {
          console.error("Error loading advance requests:", requestsError);
          // Don't throw here, just log the error
        } else {
          setAdvanceRequests(requestsData || []);
        }

      } catch (error: any) {
        console.error("Error fetching employee data:", error);
        toast({
          title: t('common.error'),
          description: error?.message ?? t('common.noData'),
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

  // Fetch today's exchange rate for VES display
  useEffect(() => {
    const loadRate = async () => {
      try {
        const { data, error } = await supabase
          .from('exchange_rate_latest')
          .select('usd_to_ves')
          .maybeSingle();
        if (!error && data && typeof data.usd_to_ves !== 'undefined') {
          setExchangeRate(Number(data.usd_to_ves) || null);
        }
      } catch (e) {
        // ignore
      }
    };
    loadRate();
  }, []);

  // Fetch banks for dropdown
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setIsLoadingBanks(true);
        
        // For now, use hardcoded banks since database migration might not be applied yet
        const hardcodedBanks = [
          { id: '1', name: 'Banco de Venezuela', code: 'BDV' },
          { id: '2', name: 'Banco Mercantil', code: 'MERCANTIL' },
          { id: '3', name: 'Banesco', code: 'BANESCO' },
          { id: '4', name: 'Banco Provincial', code: 'PROVINCIAL' },
          { id: '5', name: 'BOD', code: 'BOD' },
          { id: '6', name: '100% Banco', code: '100BANCO' },
          { id: '7', name: 'Banco del Tesoro', code: 'TESORO' },
          { id: '8', name: 'Banco Bicentenario', code: 'BICENTENARIO' },
          { id: '9', name: 'Banco Nacional de Crédito', code: 'BNC' },
          { id: '10', name: 'Banco Plaza', code: 'PLAZA' },
          { id: '11', name: 'Banco Sofitasa', code: 'SOFITASA' },
          { id: '12', name: 'Citibank Venezuela', code: 'CITIBANK' },
          { id: '13', name: 'Fondo Común', code: 'FONDOCOMUN' }
        ];
        
        console.log("Using hardcoded banks:", hardcodedBanks);
        setBanks(hardcodedBanks);
        
        // Try to fetch from database as well (for future use)
        try {
          const { data: banksData, error: banksError } = await supabase
            .from("banks")
            .select("id, name, code")
            .eq("is_active", true)
            .order("name", { ascending: true });

          if (!banksError && banksData && banksData.length > 0) {
            console.log("Fetched banks from database:", banksData);
            setBanks(banksData);
          }
        } catch (dbError) {
          console.log("Database not available, using hardcoded banks:", dbError);
        }
        
      } catch (error) {
        console.error("Error fetching banks:", error);
        // Fallback to hardcoded list
        setBanks([
          { id: '1', name: 'Banco de Venezuela', code: 'BDV' },
          { id: '2', name: 'Banco Mercantil', code: 'MERCANTIL' },
          { id: '3', name: 'Banesco', code: 'BANESCO' },
          { id: '4', name: 'Banco Provincial', code: 'PROVINCIAL' },
          { id: '5', name: 'BOD', code: 'BOD' }
        ]);
      } finally {
        setIsLoadingBanks(false);
      }
    };

    fetchBanks();
  }, []);

  // Debug: Log banks state changes
  useEffect(() => {
    console.log("Banks state updated:", banks);
  }, [banks]);

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Refresh employee data
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (!employeeError && employeeData) {
        setEmployee(employeeData);
        
        // Populate payment info data
        setPaymentInfoData({
          bank_name: employeeData.bank_name || '',
          account_number: employeeData.account_number || '',
          account_type: employeeData.account_type || '',
          pagomovil_phone: employeeData.pagomovil_phone || '',
          pagomovil_cedula: employeeData.pagomovil_cedula || '',
          pagomovil_bank_name: employeeData.pagomovil_bank_name || ''
        });
      }

      // Refresh advance requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("advance_transactions")
        .select("*")
        .eq("employee_id", employeeData?.id)
        .order("created_at", { ascending: false });

      if (!requestsError) {
        setAdvanceRequests(requestsData || []);
      }

      toast({
        title: t('company.billing.dataUpdated'),
        description: t('company.billing.dataUpdatedDesc'),
      });
    } catch (error: any) {
      console.error("Error refreshing data:", error);
      toast({
        title: t('common.error'),
        description: t('company.billing.couldNotLoadEmployees'),
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSavePaymentInfo = async () => {
    try {
      setIsSavingPaymentInfo(true);
      
      if (!employee) {
        throw new Error(t('employee.error.noEmployee'));
      }

      // Validate Bank Transfer section
      const isBankTransferValid = validateBankTransfer();
      
      // Validate PagoMóvil section if any field is filled
      const hasPagomovilData = paymentInfoData.pagomovil_phone || paymentInfoData.pagomovil_cedula || paymentInfoData.pagomovil_bank_name;
      const isPagomovilValid = hasPagomovilData ? validatePagomovil() : true;
      
      if (!isBankTransferValid || !isPagomovilValid) {
        toast({
          title: t('common.error'),
          description: language === 'en' ? 'Please fix the validation errors before saving' : 'Por favor corrige los errores de validación antes de guardar',
          variant: "destructive"
        });
        return;
      }

      // Update employee payment information
      const { error: updateError } = await supabase
        .from("employees")
        .update({
          bank_name: paymentInfoData.bank_name || null,
          account_number: paymentInfoData.account_number || null,
          account_type: paymentInfoData.account_type || null,
          pagomovil_phone: paymentInfoData.pagomovil_phone || null,
          pagomovil_cedula: paymentInfoData.pagomovil_cedula || null,
          pagomovil_bank_name: paymentInfoData.pagomovil_bank_name || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", employee.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update local state
      setEmployee(prev => prev ? {
        ...prev,
        bank_name: paymentInfoData.bank_name,
        account_number: paymentInfoData.account_number,
        account_type: paymentInfoData.account_type,
        pagomovil_phone: paymentInfoData.pagomovil_phone,
        pagomovil_cedula: paymentInfoData.pagomovil_cedula,
        pagomovil_bank_name: paymentInfoData.pagomovil_bank_name
      } : null);

      setIsEditingBankTransfer(false);
      setIsEditingPagomovil(false);
      toast({
        title: language === 'en' ? 'Payment Information Updated' : 'Información de Pago Actualizada',
        description: language === 'en' 
          ? 'Your payment information has been saved successfully.' 
          : 'Tu información de pago ha sido guardada exitosamente.'
      });

    } catch (error: any) {
      console.error("Error saving payment info:", error);
      toast({
        title: t('common.error'),
        description: error?.message ?? t('common.tryAgain'),
        variant: "destructive"
      });
    } finally {
      setIsSavingPaymentInfo(false);
    }
  };

  // Save only Bank Transfer fields to avoid touching PagoMóvil columns
  const handleSaveBankTransfer = async () => {
    try {
      setIsSavingPaymentInfo(true);

      if (!employee) {
        throw new Error(t('employee.error.noEmployee'));
      }

      const isValid = validateBankTransfer();
      if (!isValid) {
        toast({
          title: t('common.error'),
          description: language === 'en' ? 'Please fix the Bank Transfer errors' : 'Por favor corrige los errores de Transferencia Bancaria',
          variant: 'destructive',
        });
        return;
      }

      const btPayload = {
        bank_name: paymentInfoData.bank_name || null,
        account_number: paymentInfoData.account_number || null,
        account_type: paymentInfoData.account_type || null,
        updated_at: new Date().toISOString(),
      } as Record<string, any>;

      // Ensure we are not sending an effectively empty payload
      const keysToPersist = Object.keys(btPayload).filter(k => k !== 'updated_at' && btPayload[k] !== undefined);
      if (keysToPersist.length === 0) {
        throw new Error(language === 'en' ? 'Nothing to save' : 'Nada para guardar');
      }

      const { data: savedBT, error: updateError } = await supabase
        .from('employees')
        .update(btPayload)
        .eq('id', employee.id)
        .select('id, bank_name, account_number, account_type')
        .limit(1);

      if (updateError) {
        throw new Error(updateError.message);
      }
      if (!savedBT || savedBT.length === 0) {
        throw new Error(language === 'en' ? 'Save failed (no rows returned)' : 'Guardado falló (sin filas devueltas)');
      }

      setEmployee(prev => (prev ? {
        ...prev,
        bank_name: savedBT[0].bank_name ?? null,
        account_number: savedBT[0].account_number ?? null,
        account_type: savedBT[0].account_type ?? null,
      } : null));

      setIsEditingBankTransfer(false);
      toast({
        title: language === 'en' ? 'Bank Transfer Updated' : 'Transferencia Bancaria Actualizada',
        description: language === 'en' ? 'Your bank transfer information has been saved.' : 'Tu información de transferencia bancaria ha sido guardada.',
      });
    } catch (error: any) {
      console.error('Error saving bank transfer info:', error);
      toast({
        title: t('common.error'),
        description: error?.message ?? t('common.tryAgain'),
        variant: 'destructive',
      });
    } finally {
      setIsSavingPaymentInfo(false);
    }
  };

  // Save only PagoMóvil fields to avoid touching Bank Transfer columns
  const handleSavePagomovil = async () => {
    try {
      setIsSavingPaymentInfo(true);

      if (!employee) {
        throw new Error(t('employee.error.noEmployee'));
      }

      // We validate phone and cedula (required when any pagomovil field is present)
      const hasAny = !!(paymentInfoData.pagomovil_phone || paymentInfoData.pagomovil_cedula || paymentInfoData.pagomovil_bank_name);
      if (hasAny) {
        const phoneErr = paymentInfoData.pagomovil_phone ? '' : (language === 'en' ? 'Phone number is required' : 'El número de teléfono es requerido');
        const cedulaErr = paymentInfoData.pagomovil_cedula ? '' : (language === 'en' ? 'Cédula is required' : 'La cédula es requerida');
        setValidationErrors(prev => ({ ...prev, pagomovil_phone: phoneErr, pagomovil_cedula: cedulaErr }));
        if (phoneErr || cedulaErr) {
          toast({
            title: t('common.error'),
            description: language === 'en' ? 'Please complete phone and ID' : 'Por favor completa teléfono y cédula',
            variant: 'destructive',
          });
          return;
        }
      }

      // Build payload; we will drop missing columns if PostgREST reports them
      let payload: Record<string, any> = {
        pagomovil_phone: paymentInfoData.pagomovil_phone || null,
        pagomovil_cedula: paymentInfoData.pagomovil_cedula || null,
        updated_at: new Date().toISOString(),
      };
      if (paymentInfoData.pagomovil_bank_name) payload.pagomovil_bank_name = paymentInfoData.pagomovil_bank_name;

      const maxRetries = 3;
      for (let i = 0; i < maxRetries; i++) {
        const { data: savedPM, error } = await supabase
          .from('employees')
          .update(payload)
          .eq('id', employee.id)
          .select('id, pagomovil_phone, pagomovil_cedula, pagomovil_bank_name')
          .limit(1);

        if (!error) {
          // Persist to local state from DB response to avoid cache/desync issues
          if (savedPM && savedPM.length > 0) {
            setEmployee(prev => (prev ? {
              ...prev,
              pagomovil_phone: savedPM[0].pagomovil_phone ?? null,
              pagomovil_cedula: savedPM[0].pagomovil_cedula ?? null,
              pagomovil_bank_name: savedPM[0].pagomovil_bank_name ?? null,
            } : null));
          }
          break;
        }

        const code = String((error as any).code || '');
        const msg = String((error as any).message || '');
        if (code === 'PGRST204') {
          const m = msg.match(/'([^']+)'/);
          const missingCol = m?.[1];
          if (missingCol && (missingCol in payload)) {
            delete payload[missingCol];
            continue; // retry without the missing column
          }
        }
        throw new Error(msg || 'Update failed');
      }

      setEmployee(prev => (prev ? {
        ...prev,
        pagomovil_phone: paymentInfoData.pagomovil_phone,
        pagomovil_cedula: paymentInfoData.pagomovil_cedula,
        pagomovil_bank_name: paymentInfoData.pagomovil_bank_name,
      } : null));

      setIsEditingPagomovil(false);
      toast({
        title: language === 'en' ? 'Pago Móvil Updated' : 'Pago Móvil Actualizado',
        description: language === 'en' ? 'Your Pago Móvil information has been saved.' : 'Tu información de Pago Móvil ha sido guardada.',
      });
    } catch (error: any) {
      console.error('Error saving pagomovil info:', error);
      toast({
        title: t('common.error'),
        description: error?.message ?? t('common.tryAgain'),
        variant: 'destructive',
      });
    } finally {
      setIsSavingPaymentInfo(false);
    }
  };

  const handleCancelEditBankTransfer = () => {
    // Reset to original values
    if (employee) {
      setPaymentInfoData(prev => ({
        ...prev,
        bank_name: employee.bank_name || '',
        account_number: employee.account_number || '',
        account_type: employee.account_type || ''
      }));
    }
    // Clear validation errors for bank transfer fields
    setValidationErrors(prev => ({
      ...prev,
      bank_name: '',
      account_number: ''
    }));
    setIsEditingBankTransfer(false);
  };

  const handleCancelEditPagomovil = () => {
    // Reset to original values
    if (employee) {
      setPaymentInfoData(prev => ({
        ...prev,
        pagomovil_phone: employee.pagomovil_phone || '',
        pagomovil_cedula: employee.pagomovil_cedula || '',
        pagomovil_bank_name: employee.pagomovil_bank_name || ''
      }));
    }
    // Clear validation errors for pagomovil fields
    setValidationErrors(prev => ({
      ...prev,
      pagomovil_phone: '',
      pagomovil_cedula: '',
      pagomovil_bank_name: ''
    }));
    setIsEditingPagomovil(false);
  };

  const handleCancelClick = (advance: AdvanceRequest) => {
    setAdvanceToCancel(advance);
    setShowCancelModal(true);
  };

  const confirmCancelAdvance = async () => {
    if (!advanceToCancel) return;

    try {
      // Update the advance status to 'cancelled'
      const { error: updateError } = await supabase
        .from("advance_transactions")
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq("id", advanceToCancel.id);

      if (updateError) {
        throw new Error(`${t('employee.error.cancelAdvance')}: ${updateError.message}`);
      }

      toast({
        title: t('employee.cancelledTitle'),
        description: t('employee.cancelledDesc'),
      });

      // Close modal and refresh data
      setShowCancelModal(false);
      setAdvanceToCancel(null);
      refreshData();
    } catch (error: any) {
      console.error("Error cancelling advance:", error);
      toast({
        title: t('common.error'),
        description: error?.message ?? t('employee.couldNotCancel'),
        variant: "destructive"
      });
    }
  };

  const cancelCancelAction = () => {
    setShowCancelModal(false);
    setAdvanceToCancel(null);
  };




  // Filter advance requests by date range
  useEffect(() => {
    if (!dateFrom && !dateTo) {
      setFilteredAdvanceRequests(advanceRequests);
      return;
    }

    const filtered = advanceRequests.filter(request => {
      const requestDate = new Date(request.created_at);
      const requestDateOnly = startOfDay(requestDate);
      
      if (dateFrom && dateTo) {
        const fromDate = startOfDay(dateFrom);
        const toDate = endOfDay(dateTo);
        return requestDateOnly >= fromDate && requestDateOnly <= toDate;
      } else if (dateFrom) {
        const fromDate = startOfDay(dateFrom);
        return requestDateOnly >= fromDate;
      } else if (dateTo) {
        const toDate = endOfDay(dateTo);
        return requestDateOnly <= toDate;
      }
      
      return true;
    });

    setFilteredAdvanceRequests(filtered);
  }, [advanceRequests, dateFrom, dateTo]);

  // Export to Excel
  const exportToExcel = () => {
    if (filteredAdvanceRequests.length === 0) {
      toast({
        title: t('common.noData'),
        description: t('common.noDataToExport'),
        variant: "destructive"
      });
      return;
    }

    const exportData = filteredAdvanceRequests.map(request => ({
      [t('common.date')]: format(new Date(request.created_at), 'dd/MM/yyyy HH:mm'),
      [t('common.requestedAmount')]: `$${request.requested_amount.toFixed(2)}`,
      [t('common.fee')]: `$${request.fee_amount.toFixed(2)}`,
      [t('common.netAmount')]: `$${request.net_amount.toFixed(2)}`,
      [t('common.status')]: request.status,
      [t('common.paymentMethod')]: request.payment_method === 'pagomovil' ? t('employee.paymentMethod.pagomovil') : t('employee.paymentMethod.bankTransfer'),
      [t('common.paymentDetails')]: request.payment_details,
      [t('common.batch')]: request.batch_id || 'N/A',
      [t('common.processedAt')]: request.processed_at ? format(new Date(request.processed_at), 'dd/MM/yyyy HH:mm') : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths to ensure all content is visible
    const columnWidths = [
      { wch: 20 }, // Date
      { wch: 15 }, // Requested Amount
      { wch: 12 }, // Fee
      { wch: 15 }, // Net Amount
      { wch: 12 }, // Status
      { wch: 15 }, // Payment Method
      { wch: 25 }, // Payment Details
      { wch: 15 }, // Batch
      { wch: 20 }  // Processed At
    ];
    worksheet['!cols'] = columnWidths;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Advance History');

    const fileName = `advance_history_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: t('common.exportSuccess'),
      description: `${filteredAdvanceRequests.length} ${t('company.requests')} → ${fileName}`,
    });
  };

  // Clear date filters
  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };


  // Pagination calculations
  const totalPages = Math.ceil(filteredAdvanceRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredAdvanceRequests.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, filteredAdvanceRequests.length]);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Change password handler (first-login gating)
  const handlePasswordChange = async () => {
    try {
      setIsUpdatingPassword(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('User not found');
      }

      if (!passwordData.currentPassword) {
        toast({ title: t('common.error'), description: t('employee.profile.passwordRequired'), variant: "destructive" });
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({ title: t('common.error'), description: t('employee.profile.passwordMismatch'), variant: "destructive" });
        return;
      }
      if ((passwordData.newPassword || '').length < 6) {
        toast({ title: t('common.error'), description: t('employee.profile.passwordTooShort'), variant: "destructive" });
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: passwordData.currentPassword });
      if (signInError) {
        toast({ title: t('common.error'), description: t('employee.profile.passwordIncorrect'), variant: "destructive" });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: passwordData.newPassword, data: { must_change_password: false } as any });
      if (updateError) throw updateError;

      setMustChangePassword(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: t('common.success'), description: t('employee.profile.passwordUpdated') });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({ title: t('common.error'), description: error?.message ?? 'Failed to change password', variant: "destructive" });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Temporary: mark cedula uploaded after using KYC component
  const handleMarkCedulaUploaded = async () => {
    try {
      const { error } = await supabase.auth.updateUser({ data: { kyc_cedula_uploaded: true } as any });
      if (error) throw error;
      setMustUploadCedula(false);
      toast({ title: t('common.success'), description: language === 'en' ? 'ID document submitted.' : 'Documento de cédula enviado.' });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error?.message ?? 'Failed to mark as uploaded', variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('employee.loadingEmployeeData')}</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('employee.noDataTitle')}</h2>
          <p className="text-muted-foreground mb-4">{t('employee.noDataDesc')}</p>
          <Button onClick={refreshData} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('employee.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const employeeName = `${employee.first_name} ${employee.last_name}`;

  // Gate the dashboard until password is changed, then until cedula image is uploaded
  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span>{language === 'en' ? 'Action required: Change your password' : 'Acción requerida: Cambia tu contraseña'}</span>
              </CardTitle>
              <CardDescription>
                {language === 'en' ? 'For your security, please change your password to continue.' : 'Por tu seguridad, por favor cambia tu contraseña para continuar.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('employee.profile.oldPassword')}</Label>
                <Input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('employee.profile.newPassword')}</Label>
                <Input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('employee.profile.confirmPassword')}</Label>
                <Input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))} />
              </div>
              <div className="pt-2">
                <Button onClick={handlePasswordChange} disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? (language === 'en' ? 'Saving...' : 'Guardando...') : (language === 'en' ? 'Change password' : 'Cambiar contraseña')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (mustUploadCedula) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span>{language === 'en' ? 'Upload your ID (Cédula)' : 'Sube tu Cédula de Identidad'}</span>
              </CardTitle>
              <CardDescription>
                {language === 'en' ? 'Please upload front and back of your ID to continue.' : 'Por favor sube el frente y reverso de tu cédula para continuar.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <KYCUpload 
                userType='employee' 
                employeeId={employee.id} 
                onCompleted={() => {
                  setMustUploadCedula(false);
                  setJustSubmittedKyc(true);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isEmployeeApproved = employee?.is_approved === true;

  // Debug: Log gating decision
  console.log('Employee dashboard gating:', {
    justSubmittedKyc,
    isCompanyApproved,
    isEmployeeApproved,
    employeeId: employee?.id,
    willShowGatingScreen: justSubmittedKyc || !isCompanyApproved || !isEmployeeApproved
  });

  // Gate all features until company approval AND employee approval, even after password change and KYC upload
  // This ensures employees cannot access advance requests until both company and employee are approved
  if (justSubmittedKyc || !isCompanyApproved || !isEmployeeApproved) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span>{language === 'en' 
                  ? (!isCompanyApproved ? 'Awaiting company approval' : 'Awaiting administrator approval')
                  : (!isCompanyApproved ? 'En espera de aprobación de la empresa' : 'En espera de aprobación del administrador')}
                </span>
              </CardTitle>
              <CardDescription>
                {language === 'en'
                  ? (!isCompanyApproved 
                      ? 'Your company is not yet approved by the operator. You cannot access features until your company is approved.'
                      : !isEmployeeApproved
                        ? 'Your account is ready, but you cannot access features until your company administrator approves your profile.'
                        : 'Your account is being processed. Please wait for approval.')
                  : (!isCompanyApproved 
                      ? 'Tu empresa aún no ha sido aprobada por el operador. No podrás acceder a las funciones hasta que tu empresa sea aprobada.'
                      : !isEmployeeApproved
                        ? 'Tu cuenta está lista, pero no podrás acceder a las funciones hasta que el administrador de tu empresa apruebe tu perfil.'
                        : 'Tu cuenta está siendo procesada. Por favor espera la aprobación.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {language === 'en'
                  ? (!isCompanyApproved 
                      ? 'We will notify you as soon as your company is approved by the operator.'
                      : !isEmployeeApproved
                        ? 'We will notify you as soon as your company administrator approves your access to request advances.'
                        : 'Please wait while your account is being processed.')
                  : (!isCompanyApproved 
                      ? 'Te notificaremos tan pronto el operador apruebe tu empresa.'
                      : !isEmployeeApproved
                        ? 'Te notificaremos tan pronto el administrador de tu empresa apruebe tu acceso a solicitar adelantos.'
                        : 'Por favor espera mientras tu cuenta está siendo procesada.')}
              </div>
              <div className="pt-2">
                <Button variant="outline" onClick={refreshData} disabled={isRefreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {t('employee.refresh')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Employee Header */}
        <div className="flex items-center justify-between">

          <Button 
            onClick={refreshData} 
            disabled={isRefreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('employee.refresh')}
          </Button>
        </div>

        {/* Main Dashboard Content */}
        <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('employee.availableAdvance')}</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">${availableAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {t('employee.ofEarned').replace('${amount}', earnedAmount.toFixed(2))}
              </p>
            </CardContent>
          </Card>

          {/* Available in VES (today's rate) */}
          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{language === 'en' ? 'Available (VES)' : 'Disponible (VES)'}</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {exchangeRate ? (
                <div className="text-2xl font-bold text-primary">{(availableAmount * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              ) : (
                <div className="text-2xl font-bold text-muted-foreground">N/A</div>
              )}
              <p className="text-xs text-muted-foreground">
                {language === 'en' ? "Today's rate applied" : 'Tasa de hoy aplicada'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('employee.monthlySalary')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${monthlySalary.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {t('employee.daysWorked').replace('{worked}', workedDays.toString()).replace('{total}', totalWorkingDays.toString())}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('employee.advancesUsed')}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${usedAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {t('employee.thisPeriod')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('employee.pending')}</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingAdvances}</div>
              <p className="text-xs text-muted-foreground">
                {t('employee.advanceInProcess')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Request Advance */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span>{t('employee.requestAdvance')}</span>
                </CardTitle>
                <CardDescription>
                  {t('employee.requestDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Indicators */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{t('employee.daysWorkedMonth')}</span>
                      <span>{workedDays} / {totalWorkingDays} {t('employee.days')}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{t('employee.availableAmount')}</span>
                      <span>${availableAmount.toFixed(2)} USD</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                </div>

                {/* Billing Date Warning */}
                {isBillingDate() && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <h4 className="font-semibold text-yellow-800">{t('employee.billing.advanceNotAvailable')}</h4>
                        <p className="text-sm text-yellow-700">
                          {t('employee.billing.advanceRestrictionMessage')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Request Form - explicitly disabled until company approval */}
                {isCompanyApproved ? (
                  !isBillingDate() ? (
                    <AdvanceRequestForm 
                      employeeData={{
                        name: employeeName,
                        monthlySalary,
                        earnedAmount,
                        availableAmount,
                        usedAmount,
                        workedDays,
                        totalDays,
                        bank_name: employee.bank_name,
                        account_number: employee.account_number,
                        pagomovil_phone: employee.pagomovil_phone,
                        pagomovil_cedula: employee.pagomovil_cedula,
                        pagomovil_bank_name: employee.pagomovil_bank_name
                      }}
                      onAdvanceSubmitted={refreshData}
                      existingAdvanceRequests={advanceRequests}
                    />
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('employee.billing.formNotAvailable')}</h3>
                      <p className="text-gray-500">
                        {t('employee.billing.formDisabledMessage')}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                      {language === 'en' ? 'Waiting for company approval' : 'Esperando aprobación de la empresa'}
                    </h3>
                    <p className="text-yellow-700">
                      {language === 'en' 
                        ? 'You will be able to request an advance after your company administrator approves you.' 
                        : 'Podrás solicitar un adelanto cuando el administrador de tu empresa te apruebe.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary" />
                  <span>{t('employee.advanceHistory')}</span>
                    <Badge variant="secondary" className="ml-2">
                      {filteredAdvanceRequests.length} {t('employee.solicitudes')}
                    </Badge>
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm text-muted-foreground">{t('common.showing')}:</Label>
                      <Select value={itemsPerPage.toString()} onValueChange={(value) => handleItemsPerPageChange(Number(value))}>
                        <SelectTrigger className="w-[80px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" size="sm" onClick={exportToExcel}>
                    <Download className="h-4 w-4 mr-2" />
                      {t('common.exportXLS')}
                  </Button>
                  </div>
                </CardTitle>
                
                {/* Date Filters */}
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">{t('employee.desde')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-[140px] justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "dd/MM/yyyy") : t('common.select')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={(date) => setDateFrom(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">{t('common.to')}:</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-[140px] justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "dd/MM/yyyy") : t('common.select')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={(date) => setDateTo(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {(dateFrom || dateTo) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearDateFilters}
                      className="text-muted-foreground"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t('common.clear')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredAdvanceRequests.length === 0 ? (
                    <div className="text-center py-6">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">
                        {advanceRequests.length === 0 
                          ? t('common.noData') 
                          : t('company.reports.filtersDesc')
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {advanceRequests.length === 0 
                          ? t('employee.requestDescription') 
                          : t('company.reports.filtersDesc')
                        }
                      </p>
                    </div>
                  ) : (
                    paginatedRequests.map((request) => {
                      const requestDate = new Date(request.created_at);
                      const isToday = requestDate.toDateString() === new Date().toDateString();
                      const isCompleted = request.status === 'completed' || request.status === 'completada';
                      const isPending = request.status === 'pending' || request.status === 'processing';
                      const isApproved = request.status === 'approved';
                      
                      const getStatusBadge = () => {
                        switch (request.status) {
                          case 'completed':
                          case 'completada':
                            return <Badge className="bg-green-100 text-green-800">{t('employee.completed')}</Badge>;
                          case 'approved':
                            return <Badge className="bg-blue-100 text-blue-800">{t('company.approved')}</Badge>;
                          case 'processing':
                            return <Badge className="bg-orange-100 text-orange-800">{t('common.processing')}</Badge>;
                          case 'pending':
                            return <Badge variant="secondary">{t('employee.pending')}</Badge>;
                          case 'cancelled':
                            return <Badge variant="outline" className="text-muted-foreground">{t('common.cancelled')}</Badge>;
                          case 'failed':
                            return <Badge variant="destructive">{t('common.failed')}</Badge>;
                          case 'rejected':
                          case 'rechazada':
                            return <Badge variant="destructive">{t('common.rejected') || 'Rejected'}</Badge>;
                          default:
                            return <Badge variant="outline">{request.status}</Badge>;
                        }
                      };

                      const getStatusIcon = () => {
                        if (isCompleted) {
                          return <DollarSign className="h-4 w-4 text-green-600" />;
                        } else if (isApproved) {
                          return <CheckCircle className="h-4 w-4 text-blue-600" />;
                        } else if (isPending) {
                          return <Clock className="h-4 w-4 text-orange-600" />;
                        } else if (request.status === 'cancelled') {
                          return <X className="h-4 w-4 text-muted-foreground" />;
                        } else {
                          return <AlertCircle className="h-4 w-4 text-red-600" />;
                        }
                      };

                      const getStatusBg = () => {
                        if (isCompleted) {
                          return "bg-green-100";
                        } else if (isApproved) {
                          return "bg-blue-100";
                        } else if (isPending) {
                          return "bg-orange-100";
                        } else if (request.status === 'cancelled') {
                          return "bg-gray-100";
                        } else if (request.status === 'rejected' || request.status === 'rechazada') {
                          return "bg-red-100";
                        } else {
                          return "bg-red-100";
                        }
                      };

                      const getPaymentMethodText = () => {
                        return request.payment_method === 'pagomovil' ? t('employee.paymentMethod.pagomovil') : t('employee.paymentMethod.bankTransfer');
                      };

                      return (
                        <div key={request.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors relative">
                          <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                              <div className={`h-7 w-7 ${getStatusBg()} rounded-full flex items-center justify-center`}>
                                {getStatusIcon()}
                      </div>
                      <div>
                                <div className="font-semibold text-base">${request.requested_amount.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {isToday 
                                    ? `${t('employee.today')}, ${requestDate.toLocaleTimeString(language === 'en' ? 'en-US' : 'es-ES', { hour: '2-digit', minute: '2-digit' })}`
                                    : requestDate.toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { 
                                        day: 'numeric', 
                                        month: 'short', 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })
                                  }
                                </div>
                      </div>
                    </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge()}
                              {request.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelClick(request)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  {t('common.cancel')}
                                </Button>
                              )}
                            </div>
                  </div>

                          {/* Compact Details Row */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center space-x-4">
                              <span>
                                <span className="text-destructive">-${request.fee_amount.toFixed(2)}</span> {t('common.fee')}
                              </span>
                              <span>
                                <span className="text-primary font-medium">${request.net_amount.toFixed(2)}</span> {t('employee.neto')}
                              </span>
                              <span>{getPaymentMethodText()}</span>
                      </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs">
                                {request.payment_method === 'pagomovil' 
                                  ? request.payment_details 
                                  : `****${request.payment_details.slice(-4)}`
                                }
                              </span>
                      </div>
                    </div>

                          {/* Additional Info - Compact */}
                          {(request.batch_id || request.processed_at) && (
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 pt-1 border-t border-muted/30">
                              {request.batch_id && (
                                <span>{t('employee.lote')} {request.batch_id}</span>
                              )}
                              {request.processed_at && (
                                <span>
                                  {t('employee.procesado')} {new Date(request.processed_at).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                  </div>
                          )}

                      </div>
                      );
                    })
                  )}
                  </div>

                {/* Pagination Controls */}
                {filteredAdvanceRequests.length > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-muted/30">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>
                        {t('common.showing')} {startIndex + 1} - {Math.min(endIndex, filteredAdvanceRequests.length)} {t('common.of')} {filteredAdvanceRequests.length} {t('company.requests')}
                      </span>
                      </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                              className="h-8 w-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                  </div>
                </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-none shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">{t('employee.paymentMethods')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{employee.bank_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {employee.account_type === 'savings' ? t('employeeForm.savings') : t('employeeForm.checking')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ****-****-{employee.account_number.slice(-4)}
                    </div>
                  </div>
                  <Badge>{t('employee.main')}</Badge>
                </div>
                
                {employee.phone && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                      <div className="font-medium">{t('employee.paymentMethod.pagomovil')}</div>
                      <div className="text-sm text-muted-foreground">{employee.phone}</div>
                  </div>
                  <Badge variant="outline">{t('employee.backup')}</Badge>
                </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {t('employee.paymentNote')}
                </p>
              </CardContent>
            </Card>

            {/* Next Payroll */}
            <Card className="border-none shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5" />
                  <span>{t('employee.nextPayroll')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">
                    {new Date(currentYear, currentMonth + 1, 0).getDate()} {t('employee.daysCount')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(currentYear, currentMonth + 1, 0).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </div>
                  <div className="text-sm">
                    {t('employee.willDeduct')} <span className="font-semibold text-destructive">${usedAmount.toFixed(2)}</span> {t('employee.advances')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card className="border-none shadow-card border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <span>{t('employee.needHelp')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('employee.supportDescription')}
                </p>
                <Button variant="outline" className="w-full">
                  {t('employee.contactSupport')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Information Section */}
        <Card className="border-none shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span>{language === 'en' ? 'Payment Information' : 'Información de Pago'}</span>
            </CardTitle>
            <CardDescription>
              {language === 'en' ? 'Configure your payment methods for advance requests' : 'Configura tus métodos de pago para solicitudes de adelanto'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bank Transfer Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{language === 'en' ? 'Bank Transfer' : 'Transferencia Bancaria'}</h3>
                <div className="flex items-center space-x-3">
                  <Badge variant={employee?.bank_name && employee?.account_number ? "default" : "secondary"}>
                    {employee?.bank_name && employee?.account_number ? 
                      (language === 'en' ? 'Configured' : 'Configurado') : 
                      (language === 'en' ? 'Not Set' : 'No Configurado')
                    }
                  </Badge>
                  {!isEditingBankTransfer && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingBankTransfer(true)}
                      className="flex items-center space-x-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>{language === 'en' ? 'Edit' : 'Editar'}</span>
                    </Button>
                  )}
                </div>
              </div>
              
              {!isEditingBankTransfer ? (
                // Read-only view
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">{language === 'en' ? 'Bank Name' : 'Nombre del Banco'}</Label>
                    <div className="mt-1 p-3 border rounded-lg bg-muted/50">
                      {employee?.bank_name || (language === 'en' ? 'Not provided' : 'No proporcionado')}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{language === 'en' ? 'Account Number' : 'Número de Cuenta'}</Label>
                    <div className="mt-1 p-3 border rounded-lg bg-muted/50">
                      {employee?.account_number ? 
                        `${employee.account_number.slice(0, 4)}****${employee.account_number.slice(-4)}` : 
                        (language === 'en' ? 'Not provided' : 'No proporcionado')
                      }
                    </div>
                  </div>
                </div>
              ) : (
                // Edit view
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">{language === 'en' ? 'Bank Name' : 'Nombre del Banco'}</Label>
                      <div className="text-xs text-muted-foreground mb-1">
                        {language === 'en' ? `Available banks: ${banks.length}` : `Bancos disponibles: ${banks.length}`}
                      </div>
                      <Select
                        value={paymentInfoData.bank_name}
                        onValueChange={(value) => {
                          console.log("Bank selected:", value);
                          setPaymentInfoData(prev => ({ ...prev, bank_name: value }));
                          clearFieldError('bank_name');
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={language === 'en' ? 'Select bank' : 'Selecciona banco'} />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingBanks ? (
                            <SelectItem value="" disabled>
                              {language === 'en' ? 'Loading banks...' : 'Cargando bancos...'}
                            </SelectItem>
                          ) : banks.length === 0 ? (
                            <SelectItem value="" disabled>
                              {language === 'en' ? 'No banks available' : 'No hay bancos disponibles'}
                            </SelectItem>
                          ) : (
                            banks.map((bank) => (
                              <SelectItem key={bank.id} value={bank.name}>
                                {bank.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {validationErrors.bank_name && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.bank_name}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{language === 'en' ? 'Account Number' : 'Número de Cuenta'}</Label>
                      <Input
                        value={paymentInfoData.account_number}
                        onChange={(e) => {
                          setPaymentInfoData(prev => ({ ...prev, account_number: e.target.value }));
                          clearFieldError('account_number');
                        }}
                        placeholder={language === 'en' ? '20 digits' : '20 dígitos'}
                        maxLength={20}
                        className={`mt-1 ${validationErrors.account_number ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.account_number ? (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.account_number}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'en' ? 'Must be exactly 20 digits' : 'Debe tener exactamente 20 dígitos'}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handleCancelEditBankTransfer}
                      disabled={isSavingPaymentInfo}
                    >
                      {language === 'en' ? 'Cancel' : 'Cancelar'}
                    </Button>
                    <Button
                      onClick={handleSaveBankTransfer}
                      disabled={isSavingPaymentInfo}
                      className="flex items-center space-x-2"
                    >
                      {isSavingPaymentInfo ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>{language === 'en' ? 'Save Changes' : 'Guardar Cambios'}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Pagomovil Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{language === 'en' ? 'Pago Móvil' : 'Pago Móvil'}</h3>
                <div className="flex items-center space-x-3">
                  <Badge variant={employee?.pagomovil_phone && employee?.pagomovil_cedula && employee?.pagomovil_bank_name ? "default" : "secondary"}>
                    {employee?.pagomovil_phone && employee?.pagomovil_cedula && employee?.pagomovil_bank_name ? 
                      (language === 'en' ? 'Configured' : 'Configurado') : 
                      (language === 'en' ? 'Not Set' : 'No Configurado')
                    }
                  </Badge>
                  {!isEditingPagomovil && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingPagomovil(true)}
                      className="flex items-center space-x-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>{language === 'en' ? 'Edit' : 'Editar'}</span>
                    </Button>
                  )}
                </div>
              </div>
              
              {!isEditingPagomovil ? (
                // Read-only view
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">{language === 'en' ? 'Phone Number' : 'Número de Teléfono'}</Label>
                    <div className="mt-1 p-3 border rounded-lg bg-muted/50">
                      {employee?.pagomovil_phone || (language === 'en' ? 'Not provided' : 'No proporcionado')}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{language === 'en' ? 'Cédula' : 'Cédula'}</Label>
                    <div className="mt-1 p-3 border rounded-lg bg-muted/50">
                      {employee?.pagomovil_cedula || (language === 'en' ? 'Not provided' : 'No proporcionado')}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{language === 'en' ? 'Bank Name' : 'Nombre del Banco'}</Label>
                    <div className="mt-1 p-3 border rounded-lg bg-muted/50">
                      {employee?.pagomovil_bank_name || (language === 'en' ? 'Not provided' : 'No proporcionado')}
                    </div>
                  </div>
                </div>
              ) : (
                // Edit view
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">{language === 'en' ? 'Phone Number' : 'Número de Teléfono'}</Label>
                      <Input
                        value={paymentInfoData.pagomovil_phone}
                        onChange={(e) => {
                          setPaymentInfoData(prev => ({ ...prev, pagomovil_phone: e.target.value }));
                          clearFieldError('pagomovil_phone');
                        }}
                        placeholder={language === 'en' ? '+58XXXXXXXXXX' : '+58XXXXXXXXXX'}
                        className={`mt-1 ${validationErrors.pagomovil_phone ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.pagomovil_phone ? (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.pagomovil_phone}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'en' ? 'Format: +58XXXXXXXXXX or 0XXXXXXXXXX' : 'Formato: +58XXXXXXXXXX o 0XXXXXXXXXX'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{language === 'en' ? 'Cédula' : 'Cédula'}</Label>
                      <Input
                        value={paymentInfoData.pagomovil_cedula}
                        onChange={(e) => {
                          setPaymentInfoData(prev => ({ ...prev, pagomovil_cedula: e.target.value }));
                          clearFieldError('pagomovil_cedula');
                        }}
                        placeholder={language === 'en' ? 'E12345678' : 'E12345678'}
                        className={`mt-1 ${validationErrors.pagomovil_cedula ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.pagomovil_cedula ? (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.pagomovil_cedula}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'en' ? 'Start with E or V, 6-8 digits' : 'Comienza con E o V, 6-8 dígitos'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{language === 'en' ? 'Bank Name' : 'Nombre del Banco'}</Label>
                      <div className="text-xs text-muted-foreground mb-1">
                        {language === 'en' ? `Available banks: ${banks.length}` : `Bancos disponibles: ${banks.length}`}
                      </div>
                      <Select
                        value={paymentInfoData.pagomovil_bank_name}
                        onValueChange={(value) => {
                          console.log("PagoMóvil bank selected:", value);
                          setPaymentInfoData(prev => ({ ...prev, pagomovil_bank_name: value }));
                          clearFieldError('pagomovil_bank_name');
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={language === 'en' ? 'Select bank' : 'Selecciona banco'} />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingBanks ? (
                            <SelectItem value="" disabled>
                              {language === 'en' ? 'Loading banks...' : 'Cargando bancos...'}
                            </SelectItem>
                          ) : banks.length === 0 ? (
                            <SelectItem value="" disabled>
                              {language === 'en' ? 'No banks available' : 'No hay bancos disponibles'}
                            </SelectItem>
                          ) : (
                            banks.map((bank) => (
                              <SelectItem key={bank.id} value={bank.name}>
                                {bank.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {validationErrors.pagomovil_bank_name && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.pagomovil_bank_name}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handleCancelEditPagomovil}
                      disabled={isSavingPaymentInfo}
                    >
                      {language === 'en' ? 'Cancel' : 'Cancelar'}
                    </Button>
                    <Button
                      onClick={handleSavePagomovil}
                      disabled={isSavingPaymentInfo}
                      className="flex items-center space-x-2"
                    >
                      {isSavingPaymentInfo ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>{language === 'en' ? 'Save Changes' : 'Guardar Cambios'}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Information Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">
                    {language === 'en' ? 'Payment Method Selection' : 'Selección de Método de Pago'}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {language === 'en' ? 
                      'When you request an advance, you can choose between bank transfer or Pago Móvil if both are configured. You only need to provide one method, but having both gives you more flexibility.' :
                      'Cuando solicites un adelanto, puedes elegir entre transferencia bancaria o Pago Móvil si ambos están configurados. Solo necesitas proporcionar un método, pero tener ambos te da más flexibilidad.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {t('employee.cancelAdvanceTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('employee.cancelAdvanceConfirm').replace('${amount}', `$${advanceToCancel?.requested_amount.toFixed(2)}`)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={cancelCancelAction}
              className="flex-1 sm:flex-none"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelAdvance}
              className="flex-1 sm:flex-none"
            >
              {t('employee.yesCancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default EmployeeDashboard;
