import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmployeeInfoForm } from "@/components/EmployeeInfoForm";
import { SimpleEmployeeForm } from "@/components/SimpleEmployeeForm";
import Header from "@/components/Header";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  FileText,
  Settings,
  Plus,
  Download,
  Search,
  Filter,
  Mail,
  RefreshCw,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  Eye,
  Edit,
  UserX,
  UserCheck,
  Trash2,
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Pagination from "@/components/Pagination";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import * as XLSX from 'xlsx';
import { format, startOfDay, endOfDay } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { changeRequestService, ChangeRequest } from "@/services/changeRequestService";
import { EmployeeService } from "@/services/employeeService";

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  cedula?: string;
  birth_date?: string;
  year_of_employment: number;
  position: string;
  department?: string;
  employment_start_date: string;
  employment_type: string;
  weekly_hours: number;
  monthly_salary: number;
  living_expenses: number;
  dependents: number;
  emergency_contact: string;
  emergency_phone: string;
  address: string;
  city: string;
  state: string;
  postal_code?: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  notes?: string;
  activation_code: string;
  is_active: boolean;
  is_verified: boolean;
  verification_date?: string;
  created_at: string;
  updated_at: string;
}

const CompanyDashboard = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  // Format bytes to a short label
  const formatBytes = (bytes: number): string => {
    if (!bytes || isNaN(bytes)) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  // Load recent reports from Supabase Storage
  const loadRecentReportsFromStorage = async (companyId: string) => {
    try {
      const basePaths = [`${companyId}`, 'company'];
      let aggregated: any[] = [];
      for (const basePath of basePaths) {
        const { data, error } = await supabase.storage.from('reports').list(basePath, {
          limit: 100,
          sortBy: { column: 'updated_at', order: 'desc' }
        });
        if (error) {
          console.warn('Could not list reports at', basePath, error);
          continue;
        }
        const mapped = (data || [])
          .filter((f: any) => /\.(xlsx|csv|pdf)$/i.test(f.name))
          .map((f: any) => {
            const match = f.name.match(/^report_([^_]+)_([^_]+)_([0-9\-]+)\.(xlsx|csv|pdf)$/i);
            const type = match?.[1] || 'unknown';
            const period = match?.[2] || 'unknown';
            const ext = (match?.[4] || '').toLowerCase();
            const format = ext === 'xlsx' ? 'excel' : (ext || 'pdf');
            const { data: pub } = supabase.storage.from('reports').getPublicUrl(`${basePath}/${f.name}`);
            return {
              name: f.name.replace(/\.(xlsx|csv|pdf)$/i, ''),
              type,
              period,
              format,
              createdAt: f.updated_at || new Date().toISOString(),
              size: formatBytes((f as any).metadata?.size || (f as any).size || 0),
              url: pub.publicUrl,
            } as any;
          });
        aggregated = aggregated.concat(mapped);
      }
      // De-duplicate by name+format (in case file exists in both paths)
      const uniqueMap = new Map<string, any>();
      for (const r of aggregated) {
        uniqueMap.set(`${r.name}.${r.format}`, r);
      }
      const unique = Array.from(uniqueMap.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setRecentReports(unique);
    } catch (e) {
      console.warn('Error loading recent reports:', e);
    }
  };
  // Upload a Blob to Supabase Storage and return public URL
  const uploadReportToStorage = async (blob: Blob, filePath: string, contentType: string): Promise<string | null> => {
    try {
      const bucket = 'reports';
      const { error: upErr } = await supabase.storage.from(bucket).upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType,
      });
      if (upErr) {
        console.error('Upload error:', upErr);
        toast({ title: t('common.error'), description: upErr.message || 'Could not upload report to storage', variant: 'destructive' });
        return null;
      }
      // Try public URL
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(filePath);
      if (pub?.publicUrl) return pub.publicUrl;
      // Fallback: signed URL (if bucket is private)
      const { data: signed, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days
      if (signErr) {
        console.warn('Could not create signed URL:', signErr);
        return null;
      }
      return signed?.signedUrl ?? null;
    } catch (e: any) {
      console.error('Upload exception:', e);
      toast({ title: t('common.error'), description: e?.message || 'Upload exception', variant: 'destructive' });
      return null;
    }
  };
  // Auto-fit Excel column widths based on content
  const autoFitColumns = (worksheet: XLSX.WorkSheet, rows: any[]) => {
    const headers = Object.keys(rows?.[0] || {});
    const cols = headers.map((key) => {
      const headerLen = String(key).length;
      const maxLen = rows.reduce((acc, row) => {
        const cell = row[key];
        const cellLen = String(cell ?? '').length;
        return Math.max(acc, cellLen);
      }, headerLen);
      return { wch: Math.min(50, Math.max(12, maxLen + 2)) };
    });
    (worksheet as any)['!cols'] = cols;
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showSimpleForm, setShowSimpleForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [employeeFees, setEmployeeFees] = useState<any[]>([]);
  const [isLoadingEmployeeFees, setIsLoadingEmployeeFees] = useState(true);
  const [advances, setAdvances] = useState<any[]>([]);
  const [isLoadingAdvances, setIsLoadingAdvances] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [hasCompanyRecord, setHasCompanyRecord] = useState<boolean | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [filteredAdvances, setFilteredAdvances] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [advanceToAction, setAdvanceToAction] = useState<any>(null);

  // CSV Upload states
  const [showCsvUploadModal, setShowCsvUploadModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [csvUploadStep, setCsvUploadStep] = useState<'upload' | 'preview' | 'import'>('upload');
  const [selectedCsvRows, setSelectedCsvRows] = useState<Set<number>>(new Set());
  const [csvCurrentPage, setCsvCurrentPage] = useState(1);
  const [csvItemsPerPage] = useState(10);
  
  // Report states
  const [reportPeriod, setReportPeriod] = useState('thisMonth');
  const [reportType, setReportType] = useState('comprehensive');
  const [reportFormat, setReportFormat] = useState('excel');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  // Export format selection states
  const [showFormatDialog, setShowFormatDialog] = useState(false);
  const [pendingExportType, setPendingExportType] = useState<string | null>(null);
  const [selectedExportFormat, setSelectedExportFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');
  
  // Billing states
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState('current');
  
  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  // Payment history pagination
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentsPerPage, setPaymentsPerPage] = useState(5);
  
  // Billing state management
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [lastPaymentDate, setLastPaymentDate] = useState('');
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  // Delete employee modal state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [permissionEmployee, setPermissionEmployee] = useState<Employee | null>(null);

  // Change request states
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [isLoadingChangeRequests, setIsLoadingChangeRequests] = useState(false);
  const [changeRequestStatus, setChangeRequestStatus] = useState<string>('all');
  const [changeRequestCategory, setChangeRequestCategory] = useState<string>('all');
  const [changeRequestPriority, setChangeRequestPriority] = useState<string>('all');
  const [changeRequestSearch, setChangeRequestSearch] = useState('');
  const [selectedChangeRequests, setSelectedChangeRequests] = useState<string[]>([]);
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
  const [viewingChangeRequest, setViewingChangeRequest] = useState<ChangeRequest | null>(null);
  const [changeRequestPage, setChangeRequestPage] = useState(1);
  const [changeRequestItemsPerPage, setChangeRequestItemsPerPage] = useState(10);
  const [showApproveChangeRequestModal, setShowApproveChangeRequestModal] = useState(false);
  const [showRejectChangeRequestModal, setShowRejectChangeRequestModal] = useState(false);
  const [changeRequestToAction, setChangeRequestToAction] = useState<ChangeRequest | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState<string>("");
  const [employeeCurrentPage, setEmployeeCurrentPage] = useState<number>(1);
  const [employeeItemsPerPage, setEmployeeItemsPerPage] = useState<number>(10);

  // Calculate pending employees and change requests counts
  const pendingEmployees = employees.filter(emp => !emp.is_active).length;
  const pendingChangeRequests = changeRequests.filter(req => req.status === 'pending').length;
  const totalEmployees = employees.length;
  const totalChangeRequests = changeRequests.length;

  // Combined count for the main Employees tab badge
  const totalPendingItems = pendingEmployees + pendingChangeRequests;

  // Filter out cancelled advances (memoized to avoid re-creating on every render)
  const activeAdvances = useMemo(() => (
    advances.filter(advance => advance.status !== 'cancelled')
  ), [advances]);

  // Company data (will be calculated from real data, excluding cancelled advances)

  const companyData = {
    name: company?.name || "Cargando...",
    rif: company?.rif || "Cargando...",
    totalAdvances: activeAdvances.reduce((sum, advance) => sum + advance.requested_amount, 0),
    pendingAdvances: activeAdvances.filter(advance => advance.status === 'pending').length,
    totalEmployeeRegistrationFees: employeeFees.length > 0
      ? employeeFees.reduce((sum, fee) => sum + fee.fee_amount, 0)
      : employees.filter(emp => emp.is_active).length * 1.00, // Fallback: $1 per active employee
    weeklyBilling: activeAdvances
      .filter(advance => {
        const advanceDate = new Date(advance.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return advanceDate >= weekAgo;
      })
      .reduce((sum, advance) => sum + advance.requested_amount, 0),
    // Calculate monthly advances (current month)
    monthlyAdvances: activeAdvances
      .filter(advance => {
        const advanceDate = new Date(advance.created_at);
        const now = new Date();
        return advanceDate.getMonth() === now.getMonth() && 
               advanceDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, advance) => sum + advance.requested_amount, 0),
    // Calculate last month advances for comparison
    lastMonthAdvances: activeAdvances
      .filter(advance => {
        const advanceDate = new Date(advance.created_at);
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        return advanceDate.getMonth() === lastMonth.getMonth() && 
               advanceDate.getFullYear() === lastMonth.getFullYear();
      })
      .reduce((sum, advance) => sum + advance.requested_amount, 0)
  };

  // Calculate percentage change for monthly advances
  const monthlyChangePercent = companyData.lastMonthAdvances > 0 
    ? ((companyData.monthlyAdvances - companyData.lastMonthAdvances) / companyData.lastMonthAdvances) * 100
    : 0;

  // Calculate UNPAID advances and fees for billing
  const unpaidAdvances = activeAdvances.filter(advance => 
    advance.status === 'pending' || advance.status === 'approved' || advance.status === 'processing'
    // Exclude 'completed' and 'failed' advances as they are either paid or rejected
  );
  
  const unpaidEmployeeFees = employeeFees.filter(fee => 
    fee.status === 'pending' || fee.status === 'unpaid'
  );

  // Report data calculations - use ALL advances for reporting (not only unpaid)
  const reportData = {
    totalAdvances: activeAdvances.reduce((sum, advance) => sum + advance.requested_amount, 0),
    totalAdvanceCount: activeAdvances.length,
    totalFees: activeAdvances.reduce((sum, advance) => sum + (advance.fee_amount || 0), 0),
    averageFeeRate: activeAdvances.length > 0 
      ? (activeAdvances.reduce((sum, advance) => sum + (((advance.fee_amount || 0) / Math.max(advance.requested_amount || 0, 1)) * 100), 0) / activeAdvances.length)
      : 0,
    employeeParticipationRate: employees.length > 0 
      ? (employees.filter(emp => emp.is_active && activeAdvances.some(adv => adv.employee_id === emp.id)).length / employees.length) * 100
      : 0,
    averagePerEmployee: employees.filter(emp => emp.is_active).length > 0
      ? activeAdvances.reduce((sum, advance) => sum + (advance.requested_amount || 0), 0) / employees.filter(emp => emp.is_active).length
      : 0,
    approvedAdvances: activeAdvances.filter(adv => adv.status === 'completed' || adv.status === 'approved').length,
    pendingAdvances: activeAdvances.filter(adv => adv.status === 'pending').length,
    rejectedAdvances: activeAdvances.filter(adv => adv.status === 'failed').length,
    averageAdvanceAmount: activeAdvances.length > 0
      ? activeAdvances.reduce((sum, advance) => sum + (advance.requested_amount || 0), 0) / activeAdvances.length
      : 0,
    mostActiveEmployees: employees.filter(emp => emp.is_active).length > 0 ? employees.filter(emp => emp.is_active).length : 0,
    mostActiveDay: 'Lunes', // Placeholder until computed from timestamps
    peakHour: '10:00 AM', // Placeholder until computed from timestamps
    monthlyGrowth: monthlyChangePercent
  };

  // Calculate initial total outstanding amount
  const getInitialTotalOutstanding = () => {
    return currentMonthUnpaidAdvances + currentMonthUnpaidFees;
  };

  // Calculate real-time total outstanding from actual data
  const calculateRealTotalOutstanding = () => {
    const isFirstPeriod = currentBillingPeriod.period === 'first';
    return isFirstPeriod
      ? currentPeriodTotalAdvances  // First period: Advance amounts only
      : currentPeriodTotalAdvances + currentPeriodUnpaidFees;  // Second period: Advance amounts + Employee fees
  };

  // Compute next due date (twice a month: 15th and end of month)
  const computeNextDueDate = () => {
    try {
      const now = new Date();
      const dayOfMonth = now.getDate();
      let nextDue: Date;

      if (dayOfMonth <= 15) {
        // First billing period: charge on 15th
        nextDue = new Date(now.getFullYear(), now.getMonth(), 15);
      } else {
        // Second billing period: charge on last day of month
        nextDue = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
      return nextDue.toISOString().split('T')[0];
    } catch (e) {
      // Fallback to today if any unexpected error occurs
      return new Date().toISOString().split('T')[0];
    }
  };

  // Determine current billing period
  const getCurrentBillingPeriod = () => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (dayOfMonth <= 15) {
      return {
        period: 'first',
        startDate: new Date(year, month, 1),
        endDate: new Date(year, month, 14), // 1st-14th (not 15th)
        dueDate: new Date(year, month, 15), // Due on 15th
        description: '1st-14th of month',
        invoiceNumber: `INV-${year}-${String(month + 1).padStart(2, '0')}-01`
      };
    } else {
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      return {
        period: 'second',
        startDate: new Date(year, month, 15), // 15th-end
        endDate: new Date(year, month, lastDayOfMonth),
        dueDate: new Date(year, month, lastDayOfMonth), // Due on last day
        description: '15th-end of month',
        invoiceNumber: `INV-${year}-${String(month + 1).padStart(2, '0')}-02`
      };
    }
  };

  // Check if today is a billing date (15th or last day of month)
  const isBillingDate = () => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    return dayOfMonth === 15 || dayOfMonth === lastDayOfMonth;
  };

  // Check if today is the 15th of the month
  const isFifteenthOfMonth = () => {
    const now = new Date();
    return now.getDate() === 15;
  };

  // Check if today is the last day of the month
  const isLastDayOfMonth = () => {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return now.getDate() === lastDayOfMonth;
  };

  // Calculate non-negative whole days remaining until a given ISO date (0 if today or past)
  const getDaysRemaining = (isoDateString: string) => {
    try {
      const due = new Date(isoDateString);
      const today = new Date();
      // Normalize to midnight UTC to avoid timezone negatives
      const dueUTC = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
      const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffDays = Math.ceil((dueUTC - todayUTC) / msPerDay);
      return Math.max(0, diffDays);
    } catch {
      return 0;
    }
  };

  // Manual refresh function to reload company data
  const refreshCompanyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      
      if (companyError) {
        console.error('Error refreshing company data:', companyError);
        return;
      }

      if (!companyData) {
        console.warn("No company found for this user. User may need to complete company registration.");
        setCompany(null);
        return;
      }
      
      setCompany(companyData);
      
      toast({
        title: t('company.billing.dataUpdated'),
        description: t('company.billing.dataUpdatedDesc'),
      });
    } catch (error) {
      console.error('Error in refreshCompanyData:', error);
    }
  };

  // Safe date formatting helper
  const safeFormatDate = (date: any, formatStr: string, fallback: string = '--') => {
    try {
      if (!date) return fallback;
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return fallback;
      return format(dateObj, formatStr);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return fallback;
    }
  };

  // Clear mockup data from database
  const clearMockupData = async () => {
    try {
      // Get current company user with better error handling
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.warn('Auth error in clearMockupData:', userError);
        return;
      }
      if (!user) return;
      
      // Get company ID
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (companyError || !companyData) return;
      
      // Delete mockup payment records (INV-2024-001 and INV-2024-002)
      const { error: deleteError } = await supabase
        .from("company_payments")
        .delete()
        .eq("company_id", companyData.id)
        .in("invoice_number", ["INV-2024-001", "INV-2024-002"]);
      
      if (deleteError) {
        console.warn('Error clearing mockup data:', deleteError);
      } else {
        console.log('Mockup data cleared successfully');
      }
    } catch (error) {
      console.warn('Error clearing mockup data:', error);
    }
  };

  // Fetch payment history from Supabase
  const fetchPaymentHistory = async () => {
    try {
      setIsLoadingPayments(true);
      
      // First, clear any mockup data
      await clearMockupData();
      
      // Get current company user with better error handling
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        throw new Error(`Authentication error: ${userError.message}`);
      }
      if (!user) {
        console.warn('No authenticated user found');
        setPaymentHistory([]);
        return;
      }
      
      // Get company ID
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      
      if (companyError) {
        console.error("Error fetching company data:", companyError);
        throw new Error(`Failed to fetch company data: ${companyError.message}`);
      }

      if (!companyData) {
        console.warn("No company found for this user. User may need to complete company registration.");
        // Return empty array instead of throwing error
        setPaymentHistory([]);
        return;
      }
      
      // Fetch payments for this company
      const { data: payments, error: paymentsError } = await supabase
        .from("company_payments")
        .select("*")
        .eq("company_id", companyData.id)
        .order("created_at", { ascending: false });
      
      if (paymentsError) {
        throw new Error(t('company.billing.couldNotLoadPayments'));
      }
      
      // Transform data for UI
      const transformedPayments = payments.map(payment => ({
        id: payment.id,
        invoiceNumber: payment.invoice_number,
        amount: payment.amount,
        status: payment.status,
        dueDate: payment.due_date,
        paidDate: payment.paid_date,
        period: payment.period,
        paymentMethod: payment.payment_method,
        paymentDetails: payment.payment_details
      }));
      
      setPaymentHistory(transformedPayments);
      
      // Calculate total outstanding
      const pendingPayments = transformedPayments.filter(p => p.status === 'pending');
      const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
      setTotalOutstanding(totalPending);
      
      // Set last payment date
      const lastPaidPayment = transformedPayments.find(p => p.status === 'paid');
      if (lastPaidPayment && lastPaidPayment.paidDate) {
        try {
          // Validate the date before setting
          const date = new Date(lastPaidPayment.paidDate);
          if (!isNaN(date.getTime())) {
            setLastPaymentDate(lastPaidPayment.paidDate);
          }
        } catch (error) {
          console.warn('Invalid date format for lastPaymentDate:', lastPaidPayment.paidDate);
        }
      }
      
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      toast({
        title: t('company.billing.error'),
        description: t('company.billing.couldNotLoadPayments'),
        variant: "destructive"
      });
    } finally {
      setIsLoadingPayments(false);
    }
  };

  // Keep payment page within valid bounds when data or page size changes
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(paymentHistory.length / paymentsPerPage));
    if (paymentPage > totalPages) {
      setPaymentPage(totalPages);
    }
  }, [paymentHistory.length, paymentsPerPage]);

  // Calculate current billing period amounts based on new logic
  const currentBillingPeriod = getCurrentBillingPeriod();

  // Calculate advances for current billing period (all advances, not just unpaid)
  const currentPeriodAdvances = activeAdvances
    .filter(advance => {
      const advanceDate = new Date(advance.created_at);
      return advanceDate >= currentBillingPeriod.startDate && advanceDate <= currentBillingPeriod.endDate;
    });

  const currentPeriodUnpaidAdvances = currentPeriodAdvances
    .filter(advance => advance.status === 'pending' || advance.status === 'approved' || advance.status === 'processing')
    .reduce((sum, advance) => sum + advance.requested_amount, 0);

  // Calculate total advances amount for billing (all advances in period)
  const currentPeriodTotalAdvances = currentPeriodAdvances
    .reduce((sum, advance) => sum + advance.requested_amount, 0);

  // Calculate commission fees for current period
  const currentPeriodCommissionFees = currentPeriodAdvances
    .reduce((sum, advance) => sum + (advance.fee_amount || 0), 0);

  // Calculate employee fees for current billing period
  let currentPeriodUnpaidFees = 0;

  // Calculate monthly employee fees ($1 per active employee per month)
  const activeEmployeesCount = employees.filter(emp => emp.is_active).length;
  const monthlyEmployeeFees = activeEmployeesCount * 1.00; // $1 per employee per month

  // Use actual employee fees from database if available, otherwise use calculated amount
  if (unpaidEmployeeFees.length > 0) {
    // Use fees from database
    currentPeriodUnpaidFees = unpaidEmployeeFees
      .filter(fee => {
        const feeDate = new Date(fee.created_at);
        return feeDate >= currentBillingPeriod.startDate && feeDate <= currentBillingPeriod.endDate;
      })
      .reduce((sum, fee) => sum + fee.fee_amount, 0);
  } else {
    // Fallback: use calculated monthly fees if no database records exist
    currentPeriodUnpaidFees = monthlyEmployeeFees;
  }

  // Legacy calculations for backward compatibility
  const currentMonthUnpaidAdvances = unpaidAdvances
    .filter(advance => {
      const advanceDate = new Date(advance.created_at);
      const now = new Date();
      return advanceDate.getMonth() === now.getMonth() && advanceDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, advance) => sum + advance.requested_amount, 0);

  const currentMonthUnpaidFees = unpaidEmployeeFees
    .filter(fee => {
      const feeDate = new Date(fee.created_at);
      const now = new Date();
      return feeDate.getMonth() === now.getMonth() && feeDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, fee) => sum + fee.fee_amount, 0);

  // Billing data calculations - use period-based billing logic
  // First period (1-14th): Advance amounts only (billed on 15th)
  // Second period (15th-end): Advance amounts + Employee fees (billed on last day)
  const isFirstPeriod = currentBillingPeriod.period === 'first';
  const totalBilling = isFirstPeriod
    ? currentPeriodTotalAdvances  // First period: Advance amounts only
    : currentPeriodTotalAdvances + currentPeriodUnpaidFees;  // Second period: Advance amounts + Employee fees

  const billingData = {
    currentMonthFees: currentPeriodUnpaidFees,
    currentMonthAdvances: currentPeriodTotalAdvances,
    currentMonthRegistrationFees: currentPeriodUnpaidFees,
    totalOutstanding: totalBilling, // Use period-based billing logic
    lastPaymentDate: lastPaymentDate || '',
    nextDueDate: computeNextDueDate(),
    paymentHistory: paymentHistory,
    billingPeriod: currentBillingPeriod,
    // Additional data for billing breakdown
    currentPeriodAdvancesCount: currentPeriodAdvances.length,
    currentPeriodCommissionFees: currentPeriodCommissionFees,
    currentPeriodTotalAdvances: currentPeriodTotalAdvances,
    isFirstPeriod: isFirstPeriod,
    totalBilling: totalBilling
  };


  // Initialize totalOutstanding when component mounts
  useEffect(() => {
    if (totalOutstanding === 0) {
      setTotalOutstanding(getInitialTotalOutstanding());
    }
  }, []); // Empty dependency array - only run once

  // Update totalOutstanding when unpaid amounts change
  useEffect(() => {
    const newTotal = currentPeriodUnpaidAdvances + currentPeriodUnpaidFees;
    setTotalOutstanding(newTotal);
  }, [currentPeriodUnpaidAdvances, currentPeriodUnpaidFees]);


  // Check authentication status and fetch data when component mounts
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Check if user is authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Authentication error on mount:', userError);
          return;
        }
        if (!user) {
          console.warn('No authenticated user found on mount');
          return;
        }
        
        // User is authenticated, fetch data
        await fetchPaymentHistory();
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };
    
    initializeData();
  }, []); // Empty dependency array - only run once

  // Fetch employees from Supabase and set up real-time subscription
  useEffect(() => {
    let companyId: string | null = null;
    let channel: any = null;
    
    const fetchEmployees = async () => {
      try {
        setIsLoadingEmployees(true);
        
        // Check authentication first
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Auth error in fetchEmployees:', userError);
          setEmployees([]);
          return;
        }
        if (!user) {
          console.warn('No authenticated user found in fetchEmployees');
          setEmployees([]);
          return;
        }
        
        // Get company data from companies table
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        
        if (companyError) {
          console.error("Error fetching company data:", companyError);
          throw new Error(t('company.billing.couldNotLoadEmployees'));
        }

        if (!companyData) {
          console.warn("No company found for this user. User may need to complete company registration.");
          setEmployees([]);
          setCompany(null);
          setHasCompanyRecord(false);
          return;
        }
        
        companyId = companyData.id;
        setCompany(companyData);
        setHasCompanyRecord(true);
        // Load persisted recent reports for this company
        loadRecentReportsFromStorage(companyId);

        // Load change requests for this company
        try {
          const changeRequestsResult = await changeRequestService.getChangeRequests({
            company_id: companyData.id
          });
          if (changeRequestsResult.success && changeRequestsResult.data) {
            setChangeRequests(changeRequestsResult.data);
          }
        } catch (error) {
          console.error('Error loading change requests:', error);
        }
        
        // Fetch employees for this company
        const { data: employeesData, error: employeesError } = await supabase
          .from("employees")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false });
        
        if (employeesError) {
          throw new Error(`Error al cargar empleados: ${employeesError.message}`);
        }
        
        setEmployees(employeesData || []);
        
        // Fetch employee fees for this company
        fetchEmployeeFees();

        // Create monthly employee fees if they don't exist
        setTimeout(() => createMonthlyEmployeeFees(), 1000);
        
        // Fetch advances for this company
        const { data: advancesData, error: advancesError } = await supabase
          .from("advance_transactions")
          .select(`
            *,
            employees!inner(
              first_name,
              last_name
            )
          `)
          .eq("company_id", companyId)
          .order("created_at", { ascending: false });
        
        if (advancesError) {
          console.error("Error fetching advances:", advancesError);
        } else {
          setAdvances(advancesData || []);
        }
        
        setIsLoadingAdvances(false);
        
        // Set up real-time subscription for employee updates
        if (companyId) {
          channel = supabase
            .channel(`employee-updates-${companyId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'employees',
                filter: `company_id=eq.${companyId}`
              },
              (payload) => {
                
                if (payload.eventType === 'UPDATE') {
                  // Update the specific employee in the list
                  setEmployees(prevEmployees => 
                    prevEmployees.map(emp => 
                      emp.id === payload.new.id ? { ...emp, ...payload.new } as Employee : emp
                    )
                  );
                  
                  // Show notification for status changes
                  if (payload.old.is_active !== payload.new.is_active) {
                    const employeeName = `${payload.new.first_name} ${payload.new.last_name}`;
                    if (payload.new.is_active) {
                      toast({
                        title: "Empleado Activado",
                        description: `${employeeName} ha activado su cuenta`,
                      });
                    } else {
                      toast({
                        title: "Empleado Desactivado",
                        description: `${employeeName} ha sido desactivado`,
                      });
                    }
                  }
                  
                  // Show notification for verification status changes
                  if (payload.old.is_verified !== payload.new.is_verified) {
                    const employeeName = `${payload.new.first_name} ${payload.new.last_name}`;
                    if (payload.new.is_verified) {
                      toast({
                        title: "Empleado Verificado",
                        description: `${employeeName} ha sido verificado exitosamente`,
                      });
                    }
                  }
                } else if (payload.eventType === 'INSERT') {
                  // Add new employee to the list
                  setEmployees(prevEmployees => [payload.new as Employee, ...prevEmployees]);
                  
                  const employeeName = `${payload.new.first_name} ${payload.new.last_name}`;
                  toast({
                    title: "Nuevo Empleado Agregado",
                    description: `${employeeName} ha sido agregado a la empresa`,
                  });
                } else if (payload.eventType === 'DELETE') {
                  // Remove employee from the list
                  setEmployees(prevEmployees => 
                    prevEmployees.filter(emp => emp.id !== payload.old.id)
                  );
                }
              }
            )
            .subscribe();
            
          // Set up real-time subscription for advance updates
          const advancesChannel = supabase
            .channel(`advance-updates-${companyId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'advance_transactions',
                filter: `company_id=eq.${companyId}`
              },
              (payload) => {
                
                if (payload.eventType === 'INSERT') {
                  // Add new advance to the list
                  setAdvances(prevAdvances => [payload.new, ...prevAdvances]);
                } else if (payload.eventType === 'UPDATE') {
                  // Update the specific advance in the list
                  setAdvances(prevAdvances => 
                    prevAdvances.map(advance => 
                      advance.id === payload.new.id ? { ...advance, ...payload.new } : advance
                    )
                  );
                } else if (payload.eventType === 'DELETE') {
                  // Remove advance from the list
                  setAdvances(prevAdvances => 
                    prevAdvances.filter(advance => advance.id !== payload.old.id)
                  );
                }
              }
            )
            .subscribe();
        }
      } catch (error: any) {
        console.error("Error fetching employees:", error);
        toast({
          title: "Error",
          description: error?.message ?? "No se pudieron cargar los empleados",
          variant: "destructive"
        });
      } finally {
        setIsLoadingEmployees(false);
      }
    };
    
    fetchEmployees();
    
    // Cleanup subscriptions on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [toast]);

  const generateActivationCode = () => {
    // Generate a 6-digit activation code
    return Math.floor(100000 + Math.random() * 900000).toString();
  };


  const refreshEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      
      // Get current company user with better error handling
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error in refreshEmployees:', userError);
        throw new Error(`Authentication error: ${userError.message}`);
      }
      if (!user) {
        console.warn('No authenticated user found in refreshEmployees');
        return;
      }
      
      // Get company ID from companies table
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      
      if (companyError) {
        console.error("Error fetching company data:", companyError);
        throw new Error(`Failed to fetch company data: ${companyError.message}`);
      }

      if (!companyData) {
        throw new Error("No company found for this user. Please contact support.");
      }
      
      // Fetch employees for this company
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*")
        .eq("company_id", companyData.id)
        .order("created_at", { ascending: false });
      
      if (employeesError) {
        throw new Error(`Error al cargar empleados: ${employeesError.message}`);
      }
      
      setEmployees(employeesData || []);
      toast({
        title: t('company.billing.listUpdated'),
        description: t('company.billing.listUpdatedDesc'),
      });
    } catch (error: any) {
      console.error("Error refreshing employees:", error);
      toast({
        title: t('common.error'),
        description: error?.message ?? t('company.employees.updateError'),
        variant: "destructive"
      });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Fetch employee fees
  const fetchEmployeeFees = async () => {
    try {
      setIsLoadingEmployeeFees(true);
      
      // Get current company user with better error handling
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error in fetchEmployeeFees:', userError);
        throw new Error(`Authentication error: ${userError.message}`);
      }
      if (!user) {
        console.warn('No authenticated user found in fetchEmployeeFees');
        setEmployeeFees([]);
        return;
      }
      
      // Get company data from companies table
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      
      if (companyError) {
        console.error("Error fetching company data:", companyError);
        throw new Error(`Failed to fetch company data: ${companyError.message}`);
      }

      if (!companyData) {
        throw new Error("No company found for this user. Please contact support.");
      }
      
      // Fetch employee fees for this company
      const { data: feesData, error: feesError } = await supabase
        .from("employee_fees")
        .select(`
          *,
          employees!inner(
            first_name,
            last_name
          )
        `)
        .eq("company_id", companyData.id)
        .order("created_at", { ascending: false });
      
      if (feesError) {
        console.error("Error fetching employee fees:", feesError);
        // Don't throw error, just log it - fees table might not exist yet
        setEmployeeFees([]);
        return;
      }
      
      setEmployeeFees(feesData || []);
    } catch (error: any) {
      console.error("Error fetching employee fees:", error);
      setEmployeeFees([]);
    } finally {
      setIsLoadingEmployeeFees(false);
    }
  };

  // Create monthly employee fees if they don't exist
  const createMonthlyEmployeeFees = async () => {
    try {
      // Get current company user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get company data
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (companyError || !companyData) return;

      // Check if fees already exist for this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const { data: existingFees } = await supabase
        .from("employee_fees")
        .select("*")
        .eq("company_id", companyData.id)
        .gte("created_at", new Date(currentYear, currentMonth, 1).toISOString())
        .lt("created_at", new Date(currentYear, currentMonth + 1, 1).toISOString());

      // If no fees exist for this month, create them
      if (!existingFees || existingFees.length === 0) {
        const activeEmployees = employees.filter(emp => emp.is_active);

        if (activeEmployees.length > 0) {
          const feeRecords = activeEmployees.map(employee => ({
            company_id: companyData.id,
            employee_id: employee.id,
            fee_amount: 1.00, // $1 per employee per month
            fee_type: 'employee_monthly_fee',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          const { error: insertError } = await supabase
            .from("employee_fees")
            .insert(feeRecords);

          if (insertError) {
            console.error("Error creating monthly employee fees:", insertError);
          } else {
            // Refresh employee fees
            await fetchEmployeeFees();
          }
        }
      }
    } catch (error) {
      console.error("Error creating monthly employee fees:", error);
    }
  };

  const handleEmployeeSave = async (employeeInfo: any) => {
    try {
      setIsLoading(true);
      
      // Generate activation code
      const activationCode = generateActivationCode();
      
      // Get current company user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      
      // Get company ID from companies table
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      
      if (companyError) {
        console.error("Error fetching company data:", companyError);
        throw new Error(`Failed to fetch company data: ${companyError.message}`);
      }

      if (!companyData) {
        throw new Error("No company found for this user. Please contact support.");
      }

      // Use auth user email for the employee
      const employeeEmail = user.email;

      // Note: Email uniqueness is handled at the auth user level, not in employees table
      
      // Insert employee data into employees table
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .insert([{
          auth_user_id: null, // Will be set when employee activates account
          company_id: companyData.id,
          first_name: employeeInfo.firstName,
          last_name: employeeInfo.lastName,
          phone: employeeInfo.phone || null,
          cedula: employeeInfo.cedula || null,
          birth_date: employeeInfo.birthDate,
          year_of_employment: employeeInfo.yearOfEmployment,
          position: employeeInfo.position,
          department: employeeInfo.department,
          employment_start_date: employeeInfo.employmentStartDate,
          employment_type: employeeInfo.employmentType,
          weekly_hours: employeeInfo.weeklyHours,
          monthly_salary: employeeInfo.monthlySalary,
          living_expenses: employeeInfo.livingExpenses,
          dependents: employeeInfo.dependents,
          emergency_contact: employeeInfo.emergencyContact,
          emergency_phone: employeeInfo.emergencyPhone,
          address: employeeInfo.address,
          city: employeeInfo.city,
          state: employeeInfo.state,
          postal_code: employeeInfo.postalCode,
          bank_name: employeeInfo.bankName,
          account_number: employeeInfo.accountNumber,
          account_type: employeeInfo.accountType,
          notes: employeeInfo.notes || null,
          activation_code: activationCode,
          is_active: false,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (employeeError) {
        throw new Error(`Error al crear empleado: ${employeeError.message}`);
      }

      // Create auth user for the employee
      try {
        console.log(`Creating auth user for ${employeeEmail}...`);

        // Store current user session to restore later
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: employeeEmail,
          password: 'pre123456', // Default password
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: {
              role: 'employee',
              employee_id: employeeData.id,
              company_id: companyData.id
            }
          }
        });

        console.log(`Auth user creation result for ${employeeEmail}:`, { authData, authError });

        if (authError) {
          console.error(`Auth user creation failed for ${employeeEmail}:`, authError);
          throw new Error(`Failed to create auth user: ${authError.message}`);
        } else if (!authData.user) {
          console.error(`Auth user creation returned no user for ${employeeEmail}`);
          throw new Error(`Auth user creation returned no user`);
        } else {
          // Update user metadata to ensure role is properly set
          const { error: metadataError } = await supabase.auth.updateUser({
            data: {
              role: 'employee',
              employee_id: employeeData.id,
              company_id: companyData.id
            }
          });

          if (metadataError) {
            console.warn(`Failed to update user metadata for ${employeeEmail}:`, metadataError);
            // Don't throw error, continue with employee update
          }

          // Update employee with auth_user_id and mark as active
          const updateResult = await supabase
            .from('employees')
            .update({
              auth_user_id: authData.user.id,
              is_active: true,
              is_verified: true
            })
            .eq('id', employeeData.id);

          console.log(`Updated employee ${employeeData.id} with auth_user_id:`, updateResult);

          if (updateResult.error) {
            console.error(`Failed to update employee with auth_user_id:`, updateResult.error);
            throw new Error(`Failed to link auth user to employee: ${updateResult.error.message}`);
          }
        }

        // Restore the original user session to prevent automatic sign-in
        if (currentSession) {
          await supabase.auth.setSession(currentSession);
          console.log(`Restored original user session for company admin`);
        }

      } catch (authError) {
        console.error(`Auth user creation failed for ${employeeEmail}:`, authError);
        // Still continue since employee was created
      }

      // Create employee fee record ($1 monthly registration fee)
      const currentDate = new Date();
      const dueDate = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
      
      const { error: feeError } = await supabase
        .from("employee_fees")
        .insert([{
          company_id: companyData.id,
          employee_id: employeeData.id,
          fee_amount: 1.00,
          fee_type: 'employee_monthly_fee',
          status: 'pending',
          due_date: dueDate.toISOString().split('T')[0],
          notes: `Monthly registration fee for ${employeeInfo.firstName} ${employeeInfo.lastName}`
        }]);

      if (feeError) {
        console.error('Error creating employee fee:', feeError);
        // Don't fail the employee creation, just log the error
      } else {
        console.log('Employee fee created successfully for:', employeeInfo.firstName, employeeInfo.lastName);
      }
      
      // Refresh fees after adding new employee fee
      await fetchEmployeeFees();

      // Create monthly employee fees for the new employee
      setTimeout(() => createMonthlyEmployeeFees(), 500);

      // TODO: Send activation code via email/SMS
      // await supabase.functions.invoke('send-activation-code', { 
      //   email: employeeInfo.email, 
      //   activationCode: activationCode,
      //   employeeName: `${employeeInfo.firstName} ${employeeInfo.lastName}`
      // });
      
      toast({
        title: t('company.billing.employeeAdded'),
        description: t('company.billing.employeeAddedDesc'),
      });
      
      // Refresh employee list
      const { data: updatedEmployees, error: refreshError } = await supabase
        .from("employees")
        .select("*")
        .eq("company_id", companyData.id)
        .order("created_at", { ascending: false });
      
      if (!refreshError && updatedEmployees) {
        setEmployees(updatedEmployees);
      }
      
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message ?? "No se pudo agregar el empleado",
        variant: "destructive"
      });
      setIsDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimpleEmployeeSave = async (employeeData: any) => {
    try {
      setIsLoading(true);

      // Generate activation code
      const activationCode = generateActivationCode();

      // Get current company user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Get company ID from companies table
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (companyError) {
        console.error("Error fetching company data:", companyError);
        throw new Error(`Failed to fetch company data: ${companyError.message}`);
      }

      if (!companyData) {
        throw new Error("No company found for this user. Please contact support.");
      }

      // Use provided email for the employee
      const employeeEmail = employeeData.email;

      // Note: Email uniqueness is handled at the auth user level, not in employees table

      // Insert employee data with default values
      const { data: newEmployeeData, error: employeeError } = await supabase
        .from("employees")
        .insert([{
          auth_user_id: null, // Will be set when employee activates account
          company_id: companyData.id,
          first_name: employeeData.firstName,
          last_name: employeeData.lastName,
          phone: null,
          cedula: null,
          birth_date: null,
          year_of_employment: new Date().getFullYear(),
          position: 'Employee',
          department: null,
          employment_start_date: new Date().toISOString(),
          employment_type: 'full-time',
          weekly_hours: 0,
          monthly_salary: 0,
          living_expenses: 0,
          dependents: 0,
          emergency_contact: '',
          emergency_phone: '',
          address: '',
          city: '',
          state: '',
          postal_code: '',
          bank_name: '',
          account_number: '',
          account_type: 'checking',
          notes: '',
          activation_code: activationCode,
          is_active: false,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (employeeError) {
        throw new Error(`Error al crear empleado: ${employeeError.message}`);
      }

      if (!newEmployeeData || newEmployeeData.length === 0) {
        throw new Error("Employee was not created");
      }

      const employee = newEmployeeData[0]; // Get the first (and only) employee from the array

      // Create auth user for the employee
      try {
        console.log(`Creating auth user for ${employeeEmail}...`);

        // Store current user session to restore later
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: employeeEmail,
          password: 'pre123456', // Default password
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: {
              role: 'employee',
              employee_id: employee.id,
              company_id: companyData.id
            }
          }
        });

        console.log(`Auth user creation result for ${employeeEmail}:`, { authData, authError });

        if (authError) {
          console.error(`Auth user creation failed for ${employeeEmail}:`, authError);
          throw new Error(`Failed to create auth user: ${authError.message}`);
        } else if (!authData.user) {
          console.error(`Auth user creation returned no user for ${employeeEmail}`);
          throw new Error(`Auth user creation returned no user`);
        } else {
          // Update user metadata to ensure role is properly set
          const { error: metadataError } = await supabase.auth.updateUser({
            data: {
              role: 'employee',
              employee_id: employee.id,
              company_id: companyData.id
            }
          });

          if (metadataError) {
            console.warn(`Failed to update user metadata for ${employeeEmail}:`, metadataError);
            // Don't throw error, continue with employee update
          }

          // Update employee with auth_user_id and mark as active
          const updateResult = await supabase
            .from('employees')
            .update({
              auth_user_id: authData.user.id,
              is_active: true,
              is_verified: true
            })
            .eq('id', employee.id);

          console.log(`Updated employee ${employee.id} with auth_user_id:`, updateResult);

          if (updateResult.error) {
            console.error(`Failed to update employee with auth_user_id:`, updateResult.error);
            throw new Error(`Failed to link auth user to employee: ${updateResult.error.message}`);
          }
        }

        // Restore the original user session to prevent automatic sign-in
        if (currentSession) {
          await supabase.auth.setSession(currentSession);
          console.log(`Restored original user session for company admin`);
        }

      } catch (authError) {
        console.error(`Auth user creation failed for ${employeeEmail}:`, authError);
        // Still continue since employee was created
      }

      // Create employee fee record ($1 monthly registration fee)
      const currentDate = new Date();
      const dueDate = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now

      const { error: feeError } = await supabase
        .from("employee_fees")
        .insert([{
          company_id: companyData.id,
          employee_id: employee.id,
          fee_amount: 1.00,
          fee_type: 'employee_monthly_fee',
          status: 'pending',
          due_date: dueDate.toISOString().split('T')[0],
          notes: `Monthly registration fee for ${employeeData.firstName} ${employeeData.lastName}`
        }]);

      if (feeError) {
        console.error("Error creating employee fee:", feeError);
        // Don't throw error here, just log it - employee was created successfully
      }

      // Refresh fees after adding new employee fee
      await fetchEmployeeFees();

      // Create monthly employee fees for the new employee
      setTimeout(() => createMonthlyEmployeeFees(), 500);

      toast({
        title: t('company.billing.employeeAdded'),
        description: t('company.billing.employeeAddedDesc'),
      });

      // Refresh employee list
      const { data: updatedEmployees, error: refreshError } = await supabase
        .from("employees")
        .select("*")
        .eq("company_id", companyData.id)
        .order("created_at", { ascending: false });

      if (!refreshError && updatedEmployees) {
        setEmployees(updatedEmployees);
      }

      setShowSimpleForm(false);
      setIsLoading(false);
    } catch (error: any) {
      toast({
        title: t('company.billing.error'),
        description: error.message,
        variant: "destructive"
      });
      setShowSimpleForm(false);
      setIsLoading(false);
    }
  };

  const handleEditEmployee = async (employee: Employee) => {
    console.log("handleEditEmployee called with employee:", employee);
    try {
      // Fetch the most up-to-date employee data
      const { data: updatedEmployee, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", employee.id)
        .single();
      
      console.log("Fetched employee data:", updatedEmployee);
      
      if (error) {
        console.error("Error fetching employee data:", error);
        // Fallback to the employee data we already have
        console.log("Setting editingEmployee to fallback employee:", employee);
        setEditingEmployee(employee);
      } else {
        console.log("Setting editingEmployee to updated employee:", updatedEmployee);
        setEditingEmployee(updatedEmployee);
      }
      
      // Open modal immediately - the key prop will ensure proper re-rendering
      console.log("Opening edit dialog");
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Error in handleEditEmployee:", error);
      // Fallback to the employee data we already have
      console.log("Setting editingEmployee to fallback employee (catch):", employee);
      setEditingEmployee(employee);
      setIsEditDialogOpen(true);
    }
  };

  // Helper function to map database employee data to form data
  const mapEmployeeToFormData = (employee: Employee) => {
    console.log("mapEmployeeToFormData called with employee:", employee);
    const mappedData = {
      firstName: employee.first_name || "",
      lastName: employee.last_name || "",
      phone: employee.phone || "",
      cedula: employee.cedula || "",
      birthDate: employee.birth_date ? new Date(employee.birth_date) : null,
      yearOfEmployment: employee.year_of_employment || 0,
      position: employee.position || "",
      department: employee.department || "",
      employmentStartDate: employee.employment_start_date ? new Date(employee.employment_start_date) : null,
      employmentType: employee.employment_type || "",
      weeklyHours: employee.weekly_hours || 0,
      monthlySalary: employee.monthly_salary || 0,
      livingExpenses: employee.living_expenses || 0,
      dependents: employee.dependents || 0,
      emergencyContact: employee.emergency_contact || "",
      emergencyPhone: employee.emergency_phone || "",
      address: employee.address || "",
      city: employee.city || "",
      state: employee.state || "",
      postalCode: employee.postal_code || "",
      bankName: employee.bank_name || "",
      accountNumber: employee.account_number || "",
      accountType: employee.account_type || "",
      notes: employee.notes || "",
    };
    console.log("mapEmployeeToFormData returning mapped data:", mappedData);
    return mappedData;
  };

  const openDeleteEmployee = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };

  const openViewEmployee = (employee: Employee) => {
    setViewingEmployee(employee);
    setIsViewDialogOpen(true);
  };

  const openPermissionEmployee = (employee: Employee) => {
    setPermissionEmployee(employee);
    setIsPermissionDialogOpen(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    try {
      setIsLoading(true);

      // First, check for any remaining foreign key references
      console.log("Starting cascade delete for employee:", employeeToDelete.id);

      // Check for any remaining references in all possible tables
      const tablesToCheck = ['audit_logs', 'employee_fees', 'change_requests', 'advance_transactions'];
      for (const table of tablesToCheck) {
        const { data: remainingRecords, error: checkError } = await supabase
          .from(table)
          .select('id')
          .eq('employee_id', employeeToDelete.id)
          .limit(1);

        if (checkError) {
          console.log(`Table ${table} check error:`, checkError);
        } else if (remainingRecords && remainingRecords.length > 0) {
          console.log(`Found remaining records in ${table}:`, remainingRecords);
        } else {
          console.log(`No remaining records in ${table}`);
        }
      }

      // Skip audit logs deletion due to RLS policies
      // The foreign key constraint should handle this with CASCADE DELETE
      console.log("Skipping audit logs deletion - relying on CASCADE DELETE from foreign key constraint...");

      // Just verify what audit logs exist for debugging
      const { data: existingAuditLogs, error: auditCheckError } = await supabase
        .from("audit_logs")
        .select("id, action, created_at")
        .eq("employee_id", employeeToDelete.id);

      console.log("Existing audit logs for employee:", existingAuditLogs);
      console.log("Audit check error:", auditCheckError);

      if (existingAuditLogs && existingAuditLogs.length > 0) {
        console.log(`Found ${existingAuditLogs.length} audit logs that should be deleted by CASCADE DELETE`);
      } else {
        console.log("No audit logs found for this employee");
      }

      // Delete employee fees for this employee
      console.log("Deleting employee fees...");
      const { error: feeError } = await supabase
        .from("employee_fees")
        .delete()
        .eq("employee_id", employeeToDelete.id);

      if (feeError) {
        console.error("Error deleting employee fees:", feeError);
        throw new Error(`Failed to delete employee fees: ${feeError.message}`);
      } else {
        console.log("Employee fees deleted successfully");
      }

      // Delete change requests for this employee
      console.log("Deleting change requests...");
      const { error: changeRequestError } = await supabase
        .from("change_requests")
        .delete()
        .eq("employee_id", employeeToDelete.id);

      if (changeRequestError) {
        console.error("Error deleting change requests:", changeRequestError);
        throw new Error(`Failed to delete change requests: ${changeRequestError.message}`);
      } else {
        console.log("Change requests deleted successfully");
      }

      // Delete advance transactions for this employee
      console.log("Deleting advance transactions...");
      const { error: advanceError } = await supabase
        .from("advance_transactions")
        .delete()
        .eq("employee_id", employeeToDelete.id);

      if (advanceError) {
        console.error("Error deleting advance transactions:", advanceError);
        throw new Error(`Failed to delete advance transactions: ${advanceError.message}`);
      } else {
        console.log("Advance transactions deleted successfully");
      }

      // Final verification: Check if any references still exist (excluding audit_logs)
      console.log("Final verification - checking for remaining references...");
      const tablesToCheckExcludingAudit = tablesToCheck.filter(table => table !== 'audit_logs');

      for (const table of tablesToCheckExcludingAudit) {
        const { data: finalCheck, error: finalCheckError } = await supabase
          .from(table)
          .select('id')
          .eq('employee_id', employeeToDelete.id)
          .limit(1);

        if (finalCheckError) {
          console.log(`Final check error for ${table}:`, finalCheckError);
        } else if (finalCheck && finalCheck.length > 0) {
          console.error(`CRITICAL: Still found references in ${table}:`, finalCheck);
          throw new Error(`Cannot delete employee: still has references in ${table}`);
        } else {
          console.log(`Final check passed for ${table}`);
        }
      }

      // Check audit logs separately for debugging
      const { data: finalAuditCheck } = await supabase
        .from('audit_logs')
        .select('id')
        .eq('employee_id', employeeToDelete.id)
        .limit(1);

      if (finalAuditCheck && finalAuditCheck.length > 0) {
        console.log(`Note: ${finalAuditCheck.length} audit logs still exist, but will be handled by CASCADE DELETE`);
      } else {
        console.log("No audit logs found in final check");
      }

      // Now delete the employee
      console.log("Deleting employee record...");
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", employeeToDelete.id);

      if (error) {
        console.error("Error deleting employee:", error);
        throw new Error(`Failed to delete employee: ${error.message}`);
      } else {
        console.log("Employee deleted successfully");
      }

      // Remove from local state
      setEmployees(prev => prev.filter(e => e.id !== employeeToDelete.id));

      toast({
        title: t('company.billing.employeeDeleted'),
        description: `${employeeToDelete.first_name} ${employeeToDelete.last_name} ${t('company.billing.employeeDeletedDesc')}`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message ?? "No se pudo eliminar el empleado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const handleUpdateEmployee = async (employeeInfo: any) => {
    try {
      setIsLoading(true);
      
      if (!editingEmployee) {
        throw new Error(t('company.billing.couldNotUpdateEmployees'));
      }

      // Use auth user email for the employee
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const employeeEmail = user.email;

      // Get company ID for duplicate check
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error("Usuario no autenticado");
      }

      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("auth_user_id", currentUser.id)
        .single();

      if (companyError) {
        console.error("Error fetching company data:", companyError);
        throw new Error(`Failed to fetch company data: ${companyError.message}`);
      }

      if (!companyData) {
        throw new Error("No company found for this user. Please contact support.");
      }

      // Note: Email uniqueness is handled at the auth user level, not in employees table
      
      // Update employee data in Supabase
      const { data: updatedEmployee, error: updateError } = await supabase
        .from("employees")
        .update({
          first_name: employeeInfo.firstName,
          last_name: employeeInfo.lastName,
          phone: employeeInfo.phone || null,
          cedula: employeeInfo.cedula || null,
          birth_date: employeeInfo.birthDate,
          year_of_employment: employeeInfo.yearOfEmployment,
          position: employeeInfo.position,
          department: employeeInfo.department,
          employment_start_date: employeeInfo.employmentStartDate,
          employment_type: employeeInfo.employmentType,
          weekly_hours: employeeInfo.weeklyHours,
          monthly_salary: employeeInfo.monthlySalary,
          living_expenses: employeeInfo.livingExpenses,
          dependents: employeeInfo.dependents,
          emergency_contact: employeeInfo.emergencyContact,
          emergency_phone: employeeInfo.emergencyPhone,
          address: employeeInfo.address,
          city: employeeInfo.city,
          state: employeeInfo.state,
          postal_code: employeeInfo.postalCode,
          bank_name: employeeInfo.bankName,
          account_number: employeeInfo.accountNumber,
          account_type: employeeInfo.accountType,
          notes: employeeInfo.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingEmployee.id)
        .select();
      
      if (updateError) {
        throw new Error(`Error al actualizar empleado: ${updateError.message}`);
      }
      
      toast({
        title: t('company.billing.dataUpdated'),
        description: t('company.billing.dataUpdatedDesc'),
      });
      
      // Refresh employee list
      const { data: { user: refreshUser } } = await supabase.auth.getUser();
      if (refreshUser) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("id")
          .eq("auth_user_id", refreshUser.id)
          .single();
        
        if (companyData) {
          const { data: updatedEmployees } = await supabase
            .from("employees")
            .select("*")
            .eq("company_id", companyData.id)
            .order("created_at", { ascending: false });
          
          if (updatedEmployees) {
            setEmployees(updatedEmployees);
          }
        }
      }
      
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message ?? "No se pudo actualizar el empleado",
        variant: "destructive"
      });
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
    } finally {
      setIsLoading(false);
    }
  };

  // CSV Upload Functions
  const handleCsvFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCsvFile(file);
    } else {
      toast({
        title: t('company.csvUpload.invalidFile'),
        description: t('company.csvUpload.invalidFileDesc'),
        variant: "destructive"
      });
    }
  };

  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const data = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const row: any = { rowNumber: index + 2 };

          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });

          return row;
        }).filter(row => Object.values(row).some(value => value !== ''));

        setCsvData(data);
        setSelectedCsvRows(new Set(data.map((_, index) => index))); // Select all by default
        setCsvCurrentPage(1);
        setCsvUploadStep('preview');
      } catch (error) {
        toast({
          title: t('company.csvUpload.parseError'),
          description: t('company.csvUpload.parseErrorDesc'),
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const importCsvEmployees = async () => {
    if (!csvData.length || selectedCsvRows.size === 0) return;

    setIsProcessingCsv(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      // Get current company user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Get company ID
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (companyError) {
        console.error("Error fetching company data:", companyError);
        throw new Error(`Failed to fetch company data: ${companyError.message}`);
      }

      if (!companyData) {
        throw new Error("No company found for this user. Please contact support.");
      }

      // Only process selected rows
      const selectedRows = csvData.filter((_, index) => selectedCsvRows.has(index));

      for (const row of selectedRows) {
        try {
          // Get email for auth user creation (not stored in employees table)
          const employeeEmail = row.email || row.email_address || row['email address'] || '';
          
          // Map CSV columns to employee fields
          const employeeData = {
            first_name: row.firstname || row.first_name || row['first name'] || '',
            last_name: row.lastname || row.last_name || row['last name'] || '',
            phone: row.phone || row.phone_number || row['phone number'] || '',
            monthly_salary: parseFloat(row.salary || row.monthly_salary || row['monthly salary'] || '0') || 0,
            weekly_hours: parseFloat(row.hours || row.weekly_hours || row['weekly hours'] || '0') || 0,
            year_of_employment: parseInt(row.year || row.year_of_employment || row['year of employment'] || new Date().getFullYear().toString()) || new Date().getFullYear(),
            bank_name: row.bank || row.bank_name || row['bank name'] || '',
            account_number: row.account || row.account_number || row['account number'] || '',
            account_type: row.type || row.account_type || row['account type'] || 'checking',
            cedula: row.cedula || row.id || row['id number'] || '',
            address: row.address || '',
            city: row.city || '',
            state: row.state || '',
            postal_code: row.postal || row.postal_code || row['postal code'] || '',
            dependents: parseInt(row.dependents || '0') || 0,
            emergency_contact: row.emergency_contact || row['emergency contact'] || '',
            emergency_phone: row.emergency_phone || row['emergency phone'] || '',
            position: row.position || row.job_title || row['job title'] || row.title || 'Employee', // Default position
            employment_start_date: row.employment_start_date || row['employment start date'] || new Date().toISOString(), // Default to current date
            employment_type: row.employment_type || row['employment type'] || 'full-time', // Default employment type
            living_expenses: parseFloat(row.living_expenses || row['living expenses'] || '0') || 0, // Default living expenses
            company_id: companyData.id,
            activation_code: generateActivationCode(),
            is_active: true,
            is_verified: false
          };

          // Validate required fields
          if (!employeeData.first_name || !employeeData.last_name || !employeeEmail) {
            errors.push(`Row ${row.rowNumber}: Missing required fields (first name, last name, email)`);
            errorCount++;
            continue;
          }


          // Insert employee
          const { data: newEmployee, error: insertError } = await supabase
            .from("employees")
            .insert([employeeData])
            .select();

          if (insertError) {
            errors.push(`Row ${row.rowNumber}: ${insertError.message}`);
            errorCount++;
          } else if (!newEmployee || newEmployee.length === 0) {
            errors.push(`Row ${row.rowNumber}: Employee was not created`);
            errorCount++;
          } else {
            const employee = newEmployee[0]; // Get the first (and only) employee from the array
            // Create auth user for the employee
            let authUserCreated = false;
            try {
              console.log(`Creating auth user for ${employeeEmail}...`);

              // Store current user session to restore later
              const { data: { session: currentSession } } = await supabase.auth.getSession();

              const { data: authData, error: authError } = await supabase.auth.signUp({
                email: employeeEmail,
                password: 'pre123456', // Default password
                options: {
                  emailRedirectTo: `${window.location.origin}/login`,
                  data: {
                    role: 'employee',
                    employee_id: employee.id,
                    company_id: companyData.id
                  }
                }
              });

              console.log(`Auth user creation result for ${user.email}:`, { authData, authError });

              if (authError) {
                console.error(`Auth user creation failed for ${user.email}:`, authError);
                errors.push(`Row ${row.rowNumber}: Auth user creation failed - ${authError.message}`);
                errorCount++;
                // Don't count as success if auth user creation failed
                continue;
              } else if (!authData.user) {
                console.error(`Auth user creation returned no user for ${user.email}`);
                errors.push(`Row ${row.rowNumber}: Auth user creation returned no user`);
                errorCount++;
                continue;
              } else {
                // Update user metadata to ensure role is properly set
                const { error: metadataError } = await supabase.auth.updateUser({
                  data: {
                    role: 'employee',
                    employee_id: employee.id,
                    company_id: companyData.id
                  }
                });

                if (metadataError) {
                  console.warn(`Failed to update user metadata for ${user.email}:`, metadataError);
                  // Don't throw error, continue with employee update
                }

                // Update employee with auth_user_id and mark as active
                const updateResult = await supabase
                  .from('employees')
                  .update({
                    auth_user_id: authData.user.id,
                    is_active: true,
                    is_verified: true
                  })
                  .eq('id', employee.id);

                console.log(`Updated employee ${employee.id} with auth_user_id:`, updateResult);

                if (updateResult.error) {
                  console.error(`Failed to update employee with auth_user_id:`, updateResult.error);
                  errors.push(`Row ${row.rowNumber}: Failed to link auth user to employee`);
                  errorCount++;
                  continue;
                }

                authUserCreated = true;
              }

              // Restore the original user session to prevent automatic sign-in
              if (currentSession) {
                await supabase.auth.setSession(currentSession);
                console.log(`Restored original user session for company admin`);
              }

            } catch (authError) {
              console.error(`Auth user creation failed for ${user.email}:`, authError);
              errors.push(`Row ${row.rowNumber}: Auth user creation error - ${authError}`);
              errorCount++;
              continue;
            }

            // Only count as success if both employee and auth user were created
            if (authUserCreated) {
              // Create employee fee record ($1 monthly registration fee)
              try {
                const currentDate = new Date();
                const dueDate = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
                
                const { error: feeError } = await supabase
                  .from("employee_fees")
                  .insert([{
                    company_id: companyData.id,
                    employee_id: employee.id,
                    fee_amount: 1.00,
                    fee_type: 'employee_monthly_fee',
                    status: 'pending',
                    due_date: dueDate.toISOString().split('T')[0],
                    notes: `Monthly registration fee for ${employeeData.first_name} ${employeeData.last_name}`
                  }]);

                if (feeError) {
                  console.error('Error creating employee fee for CSV import:', feeError);
                  // Don't fail the import, just log the error
                }
              } catch (feeError) {
                console.error('Error creating employee fee for CSV import:', feeError);
                // Don't fail the import, just log the error
              }
              
              successCount++;
            }
          }
        } catch (rowError: any) {
          errors.push(`Row ${row.rowNumber}: ${rowError.message}`);
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: t('company.csvUpload.importSuccess'),
          description: `Successfully imported ${successCount} out of ${selectedRows.length} selected employees. Employees can log in with the company email and password 'pre123456'. Note: If login fails, check if email confirmation is required in Supabase settings.`,
        });

        // Refresh employees list without reloading the page
        await refreshEmployees();
      }

      if (errorCount > 0) {
        toast({
          title: t('company.csvUpload.importErrors'),
          description: errors.slice(0, 5).join(', ') + (errors.length > 5 ? '...' : ''),
          variant: "destructive"
        });
      }

      // Reset form
      setCsvUploadStep('upload');
      setCsvFile(null);
      setCsvData([]);
      setShowCsvUploadModal(false);

    } catch (error: any) {
      toast({
        title: t('company.csvUpload.importError'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessingCsv(false);
    }
  };

  const resetCsvUpload = () => {
    setCsvUploadStep('upload');
    setCsvFile(null);
    setCsvData([]);
    setSelectedCsvRows(new Set());
    setCsvCurrentPage(1);
    setShowCsvUploadModal(false);
  };

  // CSV selection and pagination helpers
  const toggleCsvRowSelection = (index: number) => {
    const newSelected = new Set(selectedCsvRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedCsvRows(newSelected);
  };

  const selectAllCsvRows = () => {
    setSelectedCsvRows(new Set(csvData.map((_, index) => index)));
  };

  const deselectAllCsvRows = () => {
    setSelectedCsvRows(new Set());
  };

  const getCsvPaginatedData = () => {
    const startIndex = (csvCurrentPage - 1) * csvItemsPerPage;
    const endIndex = startIndex + csvItemsPerPage;
    return csvData.slice(startIndex, endIndex);
  };

  const getCsvTotalPages = () => {
    return Math.ceil(csvData.length / csvItemsPerPage);
  };

  const handleToggleEmployeeAccess = async (employee: Employee) => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("employees")
        .update({ is_active: !employee.is_active })
        .eq("id", employee.id);

      if (error) throw error;

      // Update local state
      setEmployees(prev =>
        prev.map(emp =>
          emp.id === employee.id
            ? { ...emp, is_active: !employee.is_active }
            : emp
        )
      );

      toast({
        title: employee.is_active ? t('company.employeeAccessRevoked') : t('company.employeeAccessGranted'),
        description: `${employee.first_name} ${employee.last_name} ${employee.is_active ? t('company.accessRevokedDesc') : t('company.accessGrantedDesc')}`,
      });

      setIsPermissionDialogOpen(false);
      setPermissionEmployee(null);
    } catch (error: any) {
      console.error("Error toggling employee access:", error);
      toast({
        title: t('common.error'),
        description: error?.message ?? t('company.couldNotToggleAccess'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter advances by date range and exclude cancelled
  useEffect(() => {
    let filtered = activeAdvances;
    
    if (dateFrom || dateTo) {
      filtered = activeAdvances.filter(advance => {
        const advanceDate = new Date(advance.created_at);
        const advanceDateOnly = startOfDay(advanceDate);
        
        if (dateFrom && dateTo) {
          const fromDate = startOfDay(dateFrom);
          const toDate = endOfDay(dateTo);
          return advanceDateOnly >= fromDate && advanceDateOnly <= toDate;
        } else if (dateFrom) {
          const fromDate = startOfDay(dateFrom);
          return advanceDateOnly >= fromDate;
        } else if (dateTo) {
          const toDate = endOfDay(dateTo);
          return advanceDateOnly <= toDate;
        }
        
        return true;
      });
    }
    
    setFilteredAdvances(filtered);
  }, [activeAdvances, dateFrom, dateTo]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAdvances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAdvances = filteredAdvances.slice(startIndex, endIndex);

  // Filter employees by search
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    const term = employeeSearch.trim().toLowerCase();
    return employees.filter(e =>
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(term) ||
      (e.cedula?.toLowerCase().includes(term))
    );
  }, [employees, employeeSearch]);

  // Reset to first page when search changes
  useEffect(() => {
    setEmployeeCurrentPage(1);
  }, [employeeSearch]);

  const employeeTotalPages = Math.max(1, Math.ceil(filteredEmployees.length / employeeItemsPerPage));
  const employeeStartIndex = (employeeCurrentPage - 1) * employeeItemsPerPage;
  const employeeEndIndex = employeeStartIndex + employeeItemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(employeeStartIndex, employeeEndIndex);

  // Filter change requests by search and filters
  const filteredChangeRequests = useMemo(() => {
    return changeRequests.filter(request => {
      if (changeRequestStatus !== 'all' && request.status !== changeRequestStatus) return false;
      if (changeRequestCategory !== 'all' && request.category !== changeRequestCategory) return false;
      if (changeRequestPriority !== 'all' && request.priority !== changeRequestPriority) return false;
      if (changeRequestSearch && !request.field_name.toLowerCase().includes(changeRequestSearch.toLowerCase()) &&
        !request.reason.toLowerCase().includes(changeRequestSearch.toLowerCase())) return false;
      return true;
    });
  }, [changeRequests, changeRequestStatus, changeRequestCategory, changeRequestPriority, changeRequestSearch]);

  // Change request pagination calculations
  const changeRequestTotalPages = Math.max(1, Math.ceil(filteredChangeRequests.length / changeRequestItemsPerPage));
  const changeRequestStartIndex = (changeRequestPage - 1) * changeRequestItemsPerPage;
  const changeRequestEndIndex = changeRequestStartIndex + changeRequestItemsPerPage;
  const paginatedChangeRequests = filteredChangeRequests.slice(changeRequestStartIndex, changeRequestEndIndex);

  // Reset change request page when filters change
  useEffect(() => {
    setChangeRequestPage(1);
  }, [changeRequestStatus, changeRequestCategory, changeRequestPriority, changeRequestSearch]);

  // Change request confirmation handlers
  const confirmApproveChangeRequest = async () => {
    if (!changeRequestToAction) return;
    const request = changeRequestToAction;
    
    try {
      // First, let's check if the employee exists
      const { data: existingEmployee, error: checkError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', request.employee_id)
        .single();

      if (checkError) {
        console.error('Error checking employee:', checkError);
        throw new Error(`Employee not found: ${checkError.message}`);
      }

      // Check current user context for RLS
      const { data: { user } } = await supabase.auth.getUser();

      // Check if current user is the company admin
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('auth_user_id', user?.id)
        .single();

      // Check if this is a full name change (detected by special marker in details)
      const isFullNameChange = request.details?.includes('FULL_NAME_CHANGE');
      const isNameChange = request.field_name === 'first_name' || request.field_name === 'last_name';
      const isEmailChange = request.field_name === 'email';
      let partnerRequest = null;
      
      // Initialize service result
      let serviceResult = { success: false, data: null };
      
      if (isFullNameChange) {
        console.log('Processing full name change request');
        console.log('Request details:', request);
      } else if (isEmailChange) {
        // Email changes are disabled - reject the request
        console.log('Email change request detected - rejecting as email changes are disabled');
        console.log('Current email:', request.current_value);
        console.log('Requested email:', request.requested_value);
        
        // Reject the change request
        const rejectResult = await changeRequestService.updateChangeRequestStatus(
          request.id!,
          'rejected',
          'Email changes are currently disabled. Please contact your administrator.'
        );
        
        if (!rejectResult.success) {
          throw new Error(`Failed to reject email change request: ${rejectResult.error}`);
        }
        
        // Refresh the change requests list
        const refreshResult = await changeRequestService.getChangeRequests({
          company_id: company?.id
        });
        if (refreshResult.success && refreshResult.data) {
          setChangeRequests(refreshResult.data);
        }
        
        toast({
          title: 'Email Change Rejected',
          description: 'Email changes are currently disabled. The request has been rejected.',
          variant: "destructive"
        });
        
        return; // Exit the function early for email changes
        
      } else if (isNameChange) {
        // Look for the partner name change request
        const partnerFieldName = request.field_name === 'first_name' ? 'last_name' : 'first_name';
        console.log('Looking for partner request:', {
          employee_id: request.employee_id,
          partnerFieldName,
          currentFieldName: request.field_name,
          details: request.details
        });
        
        // Debug: Show all pending change requests for this employee
        const employeeRequests = changeRequests.filter(req => 
          req.employee_id === request.employee_id && req.status === 'pending'
        );
        console.log('All pending requests for this employee:', employeeRequests);
        
        partnerRequest = changeRequests.find(req => 
          req.employee_id === request.employee_id &&
          req.field_name === partnerFieldName &&
          req.status === 'pending' &&
          (req.details?.includes('Full Name Change') || req.details?.includes('Full Name Change -'))
        );
        
        console.log('Partner request found:', partnerRequest);
      }

      // Update the employee's profile using EmployeeService
      if (isFullNameChange) {
        // This is a full name change - update both fields together
        console.log('Processing full name change - updating both first_name and last_name');
        console.log('Current value:', request.current_value);
        console.log('Requested value:', request.requested_value);
        
        // Split the full names
        const currentNames = request.current_value.split(' ');
        const requestedNames = request.requested_value.split(' ');
        
        const firstNameValue = requestedNames[0] || '';
        const lastNameValue = requestedNames.slice(1).join(' ') || '';
        
        console.log('Extracted first name:', firstNameValue);
        console.log('Extracted last name:', lastNameValue);
        
        // Update first name
        const firstNameResult = await EmployeeService.updateEmployeeField({
          employee_id: request.employee_id,
          field_name: 'first_name',
          field_value: firstNameValue,
          company_id: company?.id!
        });
        
        if (!firstNameResult.success) {
          throw new Error(`Failed to update first name: ${firstNameResult.message}`);
        }
        
        // Update last name
        const lastNameResult = await EmployeeService.updateEmployeeField({
          employee_id: request.employee_id,
          field_name: 'last_name',
          field_value: lastNameValue,
          company_id: company?.id!
        });
        
        if (!lastNameResult.success) {
          throw new Error(`Failed to update last name: ${lastNameResult.message}`);
        }
        
        serviceResult = { success: true, data: lastNameResult.data };
        
      } else if (isNameChange && partnerRequest) {
        // This is a full name change - update both fields together
        console.log('Processing full name change - updating both first_name and last_name');
        console.log('Current request:', request);
        console.log('Partner request:', partnerRequest);
        
        // Get the correct values for each field and split them properly
        const firstNameValue = request.field_name === 'first_name' ? 
          request.requested_value.split(' ')[0] : 
          partnerRequest.requested_value.split(' ')[0];
        const lastNameValue = request.field_name === 'last_name' ? 
          request.requested_value.split(' ').slice(1).join(' ') : 
          partnerRequest.requested_value.split(' ').slice(1).join(' ');
        
        console.log('First name value:', firstNameValue);
        console.log('Last name value:', lastNameValue);
        console.log('Splitting logic - request field:', request.field_name);
        console.log('Splitting logic - request value:', request.requested_value);
        console.log('Splitting logic - partner value:', partnerRequest.requested_value);
        
        // Update first name
        const firstNameResult = await EmployeeService.updateEmployeeField({
          employee_id: request.employee_id,
          field_name: 'first_name',
          field_value: firstNameValue,
          company_id: company?.id!
        });
        
        if (!firstNameResult.success) {
          throw new Error(`Failed to update first name: ${firstNameResult.message}`);
        }
        
        // Update last name
        const lastNameResult = await EmployeeService.updateEmployeeField({
          employee_id: request.employee_id,
          field_name: 'last_name',
          field_value: lastNameValue,
          company_id: company?.id!
        });
        
        if (!lastNameResult.success) {
          throw new Error(`Failed to update last name: ${lastNameResult.message}`);
        }
        
        serviceResult = { success: true, data: lastNameResult.data };
        
        // Also approve the partner request
        const partnerApprovalResult = await changeRequestService.updateChangeRequestStatus(
          partnerRequest.id!,
          'approved',
          'Request approved as part of full name change'
        );
        
        if (!partnerApprovalResult.success) {
          console.warn('Failed to approve partner request:', partnerApprovalResult.error);
        }
      } else if (isNameChange && !partnerRequest) {
        // Single name change - handle it normally but with proper splitting
        console.log('Processing single name change - no partner request found');
        console.log('Request field:', request.field_name);
        console.log('Request value:', request.requested_value);
        
        // For single name changes, we need to extract the correct part
        let fieldValue;
        if (request.field_name === 'first_name') {
          fieldValue = request.requested_value.split(' ')[0];
        } else if (request.field_name === 'last_name') {
          fieldValue = request.requested_value.split(' ').slice(1).join(' ');
        } else {
          fieldValue = request.requested_value;
        }
        
        console.log('Extracted field value:', fieldValue);
        
        serviceResult = await EmployeeService.updateEmployeeField({
          employee_id: request.employee_id,
          field_name: request.field_name,
          field_value: fieldValue,
          company_id: company?.id!
        });
      } else {
        // Regular single field update - but skip email fields as they're handled by auth
        if (request.field_name === 'email') {
          console.log('Email field detected in general update - skipping as it should be handled by auth system');
          serviceResult = { success: true, data: { email: request.requested_value } };
        } else {
          serviceResult = await EmployeeService.updateEmployeeField({
            employee_id: request.employee_id,
            field_name: request.field_name,
            field_value: request.requested_value,
            company_id: company?.id!
          });
        }
      }

      if (!serviceResult.success) {
        throw new Error(`Failed to update employee profile`);
      }

      // Set updateResult for compatibility with existing code
      const updateResult = [serviceResult.data];

      if (!updateResult || updateResult.length === 0) {
        console.error('No rows updated - this might be an RLS policy issue');
        throw new Error('No rows were updated. This might be due to Row Level Security policies.');
      }

      // Verify the update by fetching the employee data
      const { data: verifyEmployee, error: verifyError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', request.employee_id)
        .single();

      if (verifyError) {
        console.error('Error verifying employee update:', verifyError);
      }

      // Then update the change request status
      const approveResult = await changeRequestService.updateChangeRequestStatus(
        request.id!,
        'approved',
        'Request approved by company admin'
      );

      if (approveResult.success) {
        // Refresh the list
        const refreshResult = await changeRequestService.getChangeRequests({
          company_id: company?.id
        });
        if (refreshResult.success && refreshResult.data) {
          setChangeRequests(refreshResult.data);
        }

        // Also refresh employees list to show updated info
        refreshEmployees();

        let successMessage;
        if (isNameChange && partnerRequest) {
          successMessage = 'Full name change approved and employee profile updated successfully (both first and last name)';
        } else {
          successMessage = 'Change request approved and employee profile updated successfully';
        }

        toast({
          title: 'Success',
          description: successMessage,
        });
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve change request',
        variant: "destructive"
      });
    } finally {
      setShowApproveChangeRequestModal(false);
      setChangeRequestToAction(null);
    }
  };

  const confirmRejectChangeRequest = async () => {
    if (!changeRequestToAction) return;
    
    try {
      const rejectResult = await changeRequestService.updateChangeRequestStatus(
        changeRequestToAction.id!,
        'rejected',
        'Request rejected by company admin'
      );
      
      if (rejectResult.success) {
        // Refresh the list
        const refreshResult = await changeRequestService.getChangeRequests({
          company_id: company?.id
        });
        if (refreshResult.success && refreshResult.data) {
          setChangeRequests(refreshResult.data);
        }
        toast({
          title: 'Success',
          description: 'Change request rejected successfully',
        });
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject change request',
        variant: "destructive"
      });
    } finally {
      setShowRejectChangeRequestModal(false);
      setChangeRequestToAction(null);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, filteredAdvances.length]);

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

  // Clear date filters
  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Handle approve click
  const handleApproveClick = (advance: any) => {
    setAdvanceToAction(advance);
    setShowApproveModal(true);
  };

  // Handle reject click
  const handleRejectClick = (advance: any) => {
    setAdvanceToAction(advance);
    setShowRejectModal(true);
  };

  // Confirm approve advance
  const confirmApproveAdvance = async () => {
    if (!advanceToAction) return;

    try {
      
      const { data, error } = await supabase
        .from("advance_transactions")
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq("id", advanceToAction.id)
        .select();


      if (error) {
        console.error("Supabase error details:", error);
        throw new Error(`Error al aprobar el adelanto: ${error.message}`);
      }

      // Update local state immediately
      setAdvances(prevAdvances => 
        prevAdvances.map(advance => 
          advance.id === advanceToAction.id 
            ? { ...advance, status: 'approved', updated_at: new Date().toISOString() }
            : advance
        )
      );

      toast({
        title: "Adelanto aprobado",
        description: "El adelanto ha sido aprobado exitosamente",
      });

      setShowApproveModal(false);
      setAdvanceToAction(null);
    } catch (error: any) {
      console.error("Error approving advance:", error);
      toast({
        title: "Error",
        description: error?.message ?? "No se pudo aprobar el adelanto",
        variant: "destructive"
      });
    }
  };

  // Confirm reject advance
  const confirmRejectAdvance = async () => {
    if (!advanceToAction) return;

    try {
      
      const { data, error } = await supabase
        .from("advance_transactions")
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq("id", advanceToAction.id)
        .select();


      if (error) {
        console.error("Supabase error details:", error);
        throw new Error(`Error al rechazar el adelanto: ${error.message}`);
      }

      // Update local state immediately
      setAdvances(prevAdvances => 
        prevAdvances.map(advance => 
          advance.id === advanceToAction.id 
            ? { ...advance, status: 'failed', updated_at: new Date().toISOString() }
            : advance
        )
      );

      toast({
        title: "Adelanto rechazado",
        description: "El adelanto ha sido rechazado",
      });

      setShowRejectModal(false);
      setAdvanceToAction(null);
    } catch (error: any) {
      console.error("Error rejecting advance:", error);
      toast({
        title: "Error",
        description: error?.message ?? "No se pudo rechazar el adelanto",
        variant: "destructive"
      });
    }
  };

  // Cancel actions
  const cancelApproveAction = () => {
    setShowApproveModal(false);
    setAdvanceToAction(null);
  };

  const cancelRejectAction = () => {
    setShowRejectModal(false);
    setAdvanceToAction(null);
  };

  // Export to Excel
  const exportToExcel = async () => {
    if (filteredAdvances.length === 0) {
      toast({
        title: t('common.noData'),
        description: t('common.noDataToExport'),
        variant: "destructive"
      });
      return;
    }

    // Get current user for email display
    const { data: { user } } = await supabase.auth.getUser();

    const exportData = filteredAdvances.map(advance => ({
      [t('common.date')]: format(new Date(advance.created_at), 'dd/MM/yyyy HH:mm'),
      [t('common.employee')]: `${advance.employees.first_name} ${advance.employees.last_name}`,
      Email: user?.email || 'N/A',
      [t('common.requestedAmount')]: `$${advance.requested_amount.toFixed(2)}`,
      [t('common.fee')]: `$${advance.fee_amount.toFixed(2)}`,
      [t('common.netAmount')]: `$${advance.net_amount.toFixed(2)}`,
      [t('common.status')]: advance.status,
      [t('common.paymentMethod')]: advance.payment_method === 'pagomovil' ? 'PagoMóvil' : 'Transferencia Bancaria',
      [t('common.paymentDetails')]: advance.payment_details,
      [t('common.batch')]: advance.batch_id || 'N/A',
      [t('common.processedAt')]: advance.processed_at ? format(new Date(advance.processed_at), 'dd/MM/yyyy HH:mm') : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    autoFitColumns(worksheet, exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('company.reports.advancesReport'));

    const fileName = `advances_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: t('common.exportSuccess'),
      description: `${filteredAdvances.length} ${t('company.reports.type.advances').toLowerCase()} - ${fileName}`,
    });
  };

  // Generate report with explicit params (used by recent reports download)
  const generateReportWithParams = async (
    type: string,
    period: string,
    formatChoice: 'excel' | 'csv' | 'pdf',
    options?: { addToRecent?: boolean; uploadToStorage?: boolean; dataHash?: string }
  ) => {
    try {
      setIsGeneratingReport(true);
      
      // Get current user for email display
      const { data: { user } } = await supabase.auth.getUser();
      
      const reportName = `report_${type}_${period}_${format(new Date(), 'yyyy-MM-dd')}`;
      
      // Create report data based on type
      let exportData = [];
      
      switch (type) {
        case 'advances':
          console.log('Exporting advances - activeAdvances:', activeAdvances);
          console.log('Exporting advances - activeAdvances length:', activeAdvances.length);
          if (activeAdvances.length > 0) {
            console.log('First advance sample:', activeAdvances[0]);
          }
          exportData = activeAdvances.map(advance => ({
            [t('common.date')]: format(new Date(advance.created_at), 'dd/MM/yyyy HH:mm'),
            [t('common.employee')]: `${advance.employees.first_name} ${advance.employees.last_name}`,
            Email: user?.email || 'N/A',
            [t('common.requestedAmount')]: advance.requested_amount,
            [t('common.fee')]: advance.fee_amount,
            [t('common.netAmount')]: advance.net_amount,
            [t('common.status')]: advance.status === 'completed' ? t('employee.completed') :
              advance.status === 'pending' ? t('employee.pending') :
                advance.status === 'processing' ? t('common.processing') :
                  advance.status === 'approved' ? t('company.approved') :
                    advance.status === 'failed' ? t('common.failed') : advance.status,
            [t('common.paymentMethod')]: advance.payment_method === 'pagomovil' ? 'PagoMóvil' : 'Bank Transfer',
            [t('common.paymentDetails')]: advance.payment_details,
            [t('common.batch')]: advance.batch_id || 'N/A'
          }));
          break;
          
        case 'fees':
          exportData = activeAdvances.map(advance => ({
            [t('common.date')]: format(new Date(advance.created_at), 'dd/MM/yyyy'),
            [t('common.employee')]: `${advance.employees.first_name} ${advance.employees.last_name}`,
            [t('company.reports.advances')]: advance.requested_amount,
            [t('common.fee')]: advance.fee_amount,
            'Fee %': ((advance.fee_amount / advance.requested_amount) * 100).toFixed(2) + '%',
            [t('common.status')]: advance.status,
            'Processed At': advance.processed_at ? format(new Date(advance.processed_at), 'dd/MM/yyyy') : 'N/A'
          }));
          break;
          
        case 'employees':
          exportData = employees.map(employee => ({
            [t('common.employee')]: `${employee.first_name} ${employee.last_name}`,
            Email: user?.email || 'N/A',
            ID: employee.cedula || 'N/A',
            Position: employee.position || 'N/A',
            Department: employee.department || 'N/A',
            'Monthly Salary': employee.monthly_salary,
            Status: employee.is_active ? t('company.active') : t('common.pending'),
            Verified: employee.is_verified ? 'Yes' : 'No',
            'Registered At': format(new Date(employee.created_at), 'dd/MM/yyyy'),
            'Advances Count': activeAdvances.filter(adv => adv.employee_id === employee.id).length,
            'Total Advances': activeAdvances.filter(adv => adv.employee_id === employee.id)
              .reduce((sum, adv) => sum + adv.requested_amount, 0)
          }));
          break;
          
        case 'comprehensive':
          exportData = activeAdvances.map(advance => ({
            [t('common.date')]: format(new Date(advance.created_at), 'dd/MM/yyyy HH:mm'),
            [t('common.employee')]: `${advance.employees.first_name} ${advance.employees.last_name}`,
            Email: user?.email || 'N/A',
            ID: advance.employees.cedula || 'N/A',
            Position: advance.employees.position || 'N/A',
            [t('common.requestedAmount')]: advance.requested_amount,
            [t('common.fee')]: advance.fee_amount,
            [t('common.netAmount')]: advance.net_amount,
            [t('common.status')]: advance.status === 'completed' ? t('employee.completed') :
              advance.status === 'pending' ? t('employee.pending') :
                advance.status === 'processing' ? t('common.processing') :
                  advance.status === 'approved' ? t('company.approved') :
                    advance.status === 'failed' ? t('common.failed') : advance.status,
            [t('common.paymentMethod')]: advance.payment_method === 'pagomovil' ? 'PagoMóvil' : 'Bank Transfer',
            [t('common.paymentDetails')]: advance.payment_details,
            [t('common.batch')]: advance.batch_id || 'N/A',
            'Processed At': advance.processed_at ? format(new Date(advance.processed_at), 'dd/MM/yyyy HH:mm') : 'N/A'
          }));
          break;

        case 'analytics':
          // Generate analytics report with summary data
          console.log('Exporting analytics - activeAdvances:', activeAdvances);
          console.log('Exporting analytics - employees:', employees);
          console.log('Exporting analytics - activeAdvances length:', activeAdvances.length);
          console.log('Exporting analytics - employees length:', employees.length);
          // Access the global reportData object (defined outside this function)
          const globalReportData = {
            totalAdvances: activeAdvances.reduce((sum, advance) => sum + advance.requested_amount, 0),
            totalAdvanceCount: activeAdvances.length,
            totalFees: activeAdvances.reduce((sum, advance) => sum + (advance.fee_amount || 0), 0),
            averageFeeRate: activeAdvances.length > 0
              ? (activeAdvances.reduce((sum, advance) => sum + (((advance.fee_amount || 0) / Math.max(advance.requested_amount || 0, 1)) * 100), 0) / activeAdvances.length)
              : 0,
            employeeParticipationRate: employees.length > 0
              ? (employees.filter(emp => emp.is_active && activeAdvances.some(adv => adv.employee_id === emp.id)).length / employees.length) * 100
              : 0,
            mostActiveEmployees: employees.filter(emp => emp.is_active).length,
            mostActiveDay: 'Monday', // This would need to be calculated based on actual data
            peakHour: '9:00 AM', // This would need to be calculated based on actual data
            monthlyGrowth: 0, // This would need to be calculated based on actual data
            approvedAdvances: activeAdvances.filter(adv => adv.status === 'completed' || adv.status === 'approved').length,
            pendingAdvances: activeAdvances.filter(adv => adv.status === 'pending' || adv.status === 'processing').length,
            rejectedAdvances: activeAdvances.filter(adv => adv.status === 'failed').length,
            averageAdvanceAmount: activeAdvances.length > 0
              ? activeAdvances.reduce((sum, advance) => sum + advance.requested_amount, 0) / activeAdvances.length
              : 0
          };

          const analyticsData = {
            [t('company.reports.totalRequests')]: globalReportData.totalAdvanceCount || 0,
            [t('company.reports.approvedRequests')]: globalReportData.approvedAdvances || 0,
            [t('company.reports.pendingRequests')]: globalReportData.pendingAdvances || 0,
            [t('company.reports.rejectedRequests')]: globalReportData.rejectedAdvances || 0,
            [t('company.reports.totalAmount')]: globalReportData.totalAdvances || 0,
            [t('company.reports.avgAmount')]: globalReportData.averageAdvanceAmount || 0,
            [t('company.participationRate')]: globalReportData.employeeParticipationRate || 0,
            [t('company.mostActiveEmployees')]: globalReportData.mostActiveEmployees || 0,
            [t('company.mostActiveDay')]: globalReportData.mostActiveDay || 'N/A',
            [t('company.peakHour')]: globalReportData.peakHour || 'N/A',
            [t('company.monthlyGrowth')]: globalReportData.monthlyGrowth || 0,
            'Export Date': format(new Date(), 'dd/MM/yyyy HH:mm')
          };
          exportData = [analyticsData];
          console.log('Analytics exportData:', exportData);
          break;
      }

      console.log('Final exportData for', type, ':', exportData);
      console.log('Final exportData length:', exportData.length);

      if (exportData.length === 0) {
        toast({
          title: t('common.noData'),
          description: t('common.noDataToExport'),
          variant: "destructive"
        });
        return;
      }
      
      // Generate file based on format
      let fileName = '';
      let fileSize = '';
      const shouldUpload = options?.uploadToStorage !== false;
      const shouldAddRecent = options?.addToRecent !== false;
      let publicUrl: string | null = null;
      
      if (formatChoice === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        autoFitColumns(worksheet, exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
        
        fileName = `${reportName}.xlsx`;
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        // Trigger local download
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
        // Upload to storage
        if (shouldUpload) {
          const storagePath = `${company?.id || 'company'}/${fileName}`;
          publicUrl = await uploadReportToStorage(blob, storagePath, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        }
        fileSize = `${Math.round(JSON.stringify(exportData).length / 1024)} KB`;
        toast({ title: t('common.exportSuccess'), description: fileName });
      } else if (formatChoice === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(exportData));
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        fileName = `${reportName}.csv`;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        if (shouldUpload) {
          const storagePath = `${company?.id || 'company'}/${fileName}`;
          publicUrl = await uploadReportToStorage(blob, storagePath, 'text/csv');
        }
        fileSize = `${Math.round(csv.length / 1024)} KB`;
        toast({ title: t('common.exportSuccess'), description: fileName });
      } else if (formatChoice === 'pdf') {
        // Generate PDF using jsPDF
        const pdf = generatePDFReport(exportData, type, reportName);
        fileName = `${reportName}.pdf`;
        const blob = pdf.output('blob');
        // Trigger local download
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
        // Upload to storage
        if (shouldUpload) {
          const storagePath = `${company?.id || 'company'}/${fileName}`;
          publicUrl = await uploadReportToStorage(blob, storagePath, 'application/pdf');
        }
        fileSize = `${Math.round(JSON.stringify(exportData).length / 1024)} KB`;
      }
      
      // Add to recent reports
      if (shouldAddRecent) {
      const newReport = {
        name: reportName,
          type,
          period,
          format: formatChoice,
        createdAt: new Date().toISOString(),
          size: fileSize,
          url: publicUrl || '',
          dataHash: options?.dataHash || ''
      };
      setRecentReports(prev => [newReport, ...prev.slice(0, 9)]); // Keep only last 10
      }
      
      toast({
        title: t('common.exportSuccess'),
        description: `${fileName} - ${exportData.length} ${t('company.requests')}`,
      });
      
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: t('common.error'),
        description: error?.message || t('register.tryAgain'),
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Backwards-compatible: use current UI selections
  const generateReport = async () => {
    return generateReportWithParams(reportType, reportPeriod, reportFormat as 'excel' | 'csv' | 'pdf');
  };

  // Generate data hash for comparison
  const generateDataHash = (type: string) => {
    let dataToHash = '';

    if (type === 'advances') {
      dataToHash = JSON.stringify(activeAdvances.map(adv => ({
        id: adv.id,
        requested_amount: adv.requested_amount,
        fee_amount: adv.fee_amount,
        status: adv.status,
        created_at: adv.created_at
      })));
    } else if (type === 'analytics') {
      dataToHash = JSON.stringify({
        totalAdvances: activeAdvances.reduce((sum, advance) => sum + advance.requested_amount, 0),
        totalAdvanceCount: activeAdvances.length,
        approvedAdvances: activeAdvances.filter(adv => adv.status === 'completed' || adv.status === 'approved').length,
        pendingAdvances: activeAdvances.filter(adv => adv.status === 'pending' || adv.status === 'processing').length,
        rejectedAdvances: activeAdvances.filter(adv => adv.status === 'failed').length,
        averageAdvanceAmount: activeAdvances.length > 0
          ? activeAdvances.reduce((sum, advance) => sum + advance.requested_amount, 0) / activeAdvances.length
          : 0
      });
    }

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < dataToHash.length; i++) {
      const char = dataToHash.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  };

  // Check if data has changed since last export
  const hasDataChanged = (type: string) => {
    const currentHash = generateDataHash(type);
    const lastReport = recentReports.find(report =>
      report.type === type &&
      report.period === reportPeriod &&
      report.format === reportFormat
    );

    if (!lastReport) return true; // No previous report, so data has "changed"

    return lastReport.dataHash !== currentHash;
  };

  // Handle export button click - show format selection dialog
  const handleExportClick = (type: string) => {
    setPendingExportType(type);
    setSelectedExportFormat('excel'); // Default to Excel
    setShowFormatDialog(true);
  };

  // Handle format selection and export
  const handleFormatSelection = async () => {
    if (pendingExportType) {
      setShowFormatDialog(false);
      await exportReport(pendingExportType, selectedExportFormat);
      setPendingExportType(null);
    }
  };

  // Export specific report type with format selection
  const exportReport = async (type: string, format?: 'excel' | 'csv' | 'pdf') => {
    try {
      setIsGeneratingReport(true);

      // Check if data is loaded
      if (isLoadingAdvances || isLoadingEmployees) {
        toast({
          title: "Please wait",
          description: "Data is still loading. Please try again in a moment.",
          variant: "destructive"
        });
        return;
      }

      const selectedFormat = format || reportFormat as 'excel' | 'csv' | 'pdf';
      const dataChanged = hasDataChanged(type);
      const currentHash = generateDataHash(type);

      // Generate report with selected format
      await generateReportWithParams(
        type,
        reportPeriod,
        selectedFormat,
        {
          addToRecent: dataChanged,
          uploadToStorage: dataChanged,
          dataHash: currentHash
        }
      );

      if (dataChanged) {
        toast({
          title: t('common.exportSuccess'),
          description: `${type} report exported as ${selectedFormat.toUpperCase()} and saved to recent reports`,
        });
      } else {
        toast({
          title: t('common.exportSuccess'),
          description: `${type} report exported as ${selectedFormat.toUpperCase()} (no changes detected, not saved to recent reports)`,
        });
      }
    } catch (error: any) {
      console.error("Error exporting report:", error);
      toast({
        title: "Error",
        description: error?.message ?? "Failed to export report",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Export a PDF mirroring the on-screen "Reporte de Adelantos" summary section
  const generateAdvancesSectionPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const marginX = 20;
    let y = 20;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('Reporte de Adelantos', marginX, y);
    y += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Análisis detallado de solicitudes de adelanto', marginX, y);
    y += 6;
    pdf.text(`Fecha de exportación: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, marginX, y);
    y += 8;

    const summary = {
      total: activeAdvances.length,
      approved: activeAdvances.filter(a => a.status === 'completed' || a.status === 'approved').length,
      pending: activeAdvances.filter(a => a.status === 'pending' || a.status === 'processing').length,
      rejected: activeAdvances.filter(a => a.status === 'failed').length,
      average: activeAdvances.length > 0 
        ? activeAdvances.reduce((s, a) => s + a.requested_amount, 0) / activeAdvances.length 
        : 0,
    };

    const rows = [
      ['Total de solicitudes:', String(summary.total)],
      ['Solicitudes aprobadas:', String(summary.approved)],
      ['Solicitudes pendientes:', String(summary.pending)],
      ['Solicitudes rechazadas:', String(summary.rejected)],
      ['Monto promedio:', `$${summary.average.toFixed(2)}`],
    ];

    pdf.setFontSize(11);
    rows.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'normal');
      pdf.text(label, marginX, y);
      pdf.setFont('helvetica', 'bold');
      pdf.text(value, marginX + 120, y, { align: 'right' });
      y += 8;
    });

    // subtle divider
    y += 4;
    pdf.setDrawColor(230);
    pdf.line(marginX, y, 190, y);

    return pdf;
  };

  // Export a PDF mirroring the on-screen Usage Analysis summary section (localized)
  const generateAnalyticsSectionPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const marginX = 20;
    let y = 20;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(t('company.reports.usageAnalysis'), marginX, y);
    y += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(t('company.reports.usageAnalysisDesc'), marginX, y);
    y += 6;
    pdf.text(`${t('company.reports.filters')}: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, marginX, y);
    y += 8;

    const analytics = {
      participation: `${reportData.employeeParticipationRate.toFixed(1)}%`,
      mostActiveEmployees: String(reportData.mostActiveEmployees),
      mostActiveDay: reportData.mostActiveDay,
      peakHour: reportData.peakHour,
      monthlyGrowth: `${reportData.monthlyGrowth >= 0 ? '+' : ''}${reportData.monthlyGrowth.toFixed(1)}%`,
    };

    const rows: Array<[string, string]> = [
      [t('company.participationRate') + ':', analytics.participation],
      [t('company.mostActiveEmployees') + ':', analytics.mostActiveEmployees],
      [t('company.mostActiveDay') + ':', analytics.mostActiveDay],
      [t('company.peakHour') + ':', analytics.peakHour],
      [t('company.monthlyGrowth') + ':', analytics.monthlyGrowth],
    ];

    pdf.setFontSize(11);
    rows.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'normal');
      pdf.text(label, marginX, y);
      pdf.setFont('helvetica', 'bold');
      pdf.text(String(value), marginX + 120, y, { align: 'right' });
      y += 8;
    });

    // subtle divider
    y += 4;
    pdf.setDrawColor(230);
    pdf.line(marginX, y, 190, y);

    return pdf;
  };



  // Generate PDF report using jsPDF
  const generatePDFReport = (data: any[], type: string, reportName: string) => {
    console.log('PDF Generation - data:', data);
    console.log('PDF Generation - type:', type);
    console.log('PDF Generation - data length:', data.length);
    if (data.length > 0) {
      console.log('PDF Generation - first row keys:', Object.keys(data[0]));
      console.log('PDF Generation - first row:', data[0]);
    }

    const currentDate = new Date();
    const companyName = company?.name || 'Empresa';
    const companyRif = company?.rif || 'N/A';
    
    // Create new PDF document - auto switch to landscape for many columns
    const isWide = data && data.length > 0 && Object.keys(data[0]).length > 8;
    const pdf = new jsPDF(isWide ? 'l' : 'p', 'mm', 'a4');
    
    // Simple header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const reportTitle = type === 'advances' ? t('company.reports.advances') : t('company.reports.usageAnalysis');
    pdf.text(reportTitle, 20, 20);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${companyName} - RIF: ${companyRif}`, 20, 28);
    pdf.text(`${t('common.generated')}: ${format(currentDate, 'dd/MM/yyyy HH:mm')}`, 20, 34);
    
    // Summary: include for analytics and other types, but not for 'advances'
    if (type !== 'advances') {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('common.summary'), 20, 45);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${t('common.totalRecords')}: ${data.length}`, 20, 52);
      pdf.text(`${t('common.period')}: ${reportPeriod}`, 20, 58);

      // Add basic stats if we have data
      if (data.length > 0) {
        const totalAmount = data.reduce((sum, row) => {
          // Find amount field dynamically by looking for common amount field names
          const amountFields = Object.keys(row).filter(key =>
            key.toLowerCase().includes('amount') ||
            key.toLowerCase().includes('monto') ||
            key.toLowerCase().includes('requested') ||
            key.toLowerCase().includes('solicitado')
          );

          let amount = 0;
          for (const field of amountFields) {
            const value = parseFloat(String(row[field] || 0));
            if (!isNaN(value) && value > 0) {
              amount = value;
              break;
            }
          }

          return sum + amount;
        }, 0);

        const avgAmount = totalAmount / data.length;

        pdf.text(`${t('common.totalAmount')}: $${totalAmount.toFixed(2)}`, 20, 64);
        pdf.text(`${t('common.average')}: $${avgAmount.toFixed(2)}`, 20, 70);
      }
    }
    
    // Add data in key-value pair style (like the dashboard UI)
    if (data.length > 0) {
      try {
        let yPosition = type === 'advances' ? 45 : 80;

        // For advances report, show individual advance details
        if (type === 'advances') {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(t('company.reports.advanceDetails'), 20, yPosition);
          yPosition += 10;

          data.forEach((advance, index) => {
            // Check if we need a new page
            if (yPosition > pdf.internal.pageSize.height - 40) {
              pdf.addPage();
              yPosition = 20;
            }

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${t('company.reports.advance')} #${index + 1}`, 20, yPosition);
            yPosition += 6;

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);

            // Display key-value pairs with proper translations
            const fields = [
              { key: t('common.date'), value: advance[Object.keys(advance).find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('fecha'))] || 'N/A' },
              { key: t('common.employee'), value: advance[Object.keys(advance).find(k => k.toLowerCase().includes('employee') || k.toLowerCase().includes('empleado'))] || 'N/A' },
              { key: 'Email', value: advance['Email'] || 'N/A' },
              { key: t('common.requestedAmount'), value: advance[Object.keys(advance).find(k => k.toLowerCase().includes('amount') || k.toLowerCase().includes('monto'))] || 'N/A' },
              { key: t('common.fee'), value: advance[Object.keys(advance).find(k => k.toLowerCase().includes('fee') || k.toLowerCase().includes('comisión'))] || 'N/A' },
              { key: t('common.netAmount'), value: advance[Object.keys(advance).find(k => k.toLowerCase().includes('net') || k.toLowerCase().includes('neto'))] || 'N/A' },
              { key: t('common.status'), value: advance[Object.keys(advance).find(k => k.toLowerCase().includes('status') || k.toLowerCase().includes('estado'))] || 'N/A' },
              { key: t('common.paymentMethod'), value: advance[Object.keys(advance).find(k => k.toLowerCase().includes('payment') || k.toLowerCase().includes('pago'))] || 'N/A' }
            ];

            fields.forEach(field => {
              if (field.value !== 'N/A') {
                pdf.text(`${field.key}: ${field.value}`, 25, yPosition);
                yPosition += 5;
              }
            });

            yPosition += 8; // Space between advances
          });
        } else {
          // For analytics report, show summary data in key-value pairs
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(t('company.reports.detailedAnalysis'), 20, yPosition);
          yPosition += 10;

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);

          // Display all fields as key-value pairs
          Object.entries(data[0]).forEach(([key, value]) => {
            if (yPosition > pdf.internal.pageSize.height - 20) {
              pdf.addPage();
              yPosition = 20;
            }

            // Format the value based on its type
            let displayValue = String(value || 'N/A');
            if (typeof value === 'number' && key.toLowerCase().includes('amount')) {
              displayValue = `$${value.toFixed(2)}`;
            } else if (typeof value === 'number' && key.toLowerCase().includes('rate')) {
              displayValue = `${value.toFixed(1)}%`;
            } else if (typeof value === 'number' && key.toLowerCase().includes('growth')) {
              displayValue = `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
            }

            pdf.text(`${key}: ${displayValue}`, 20, yPosition);
          yPosition += 6;
        });
        }

      } catch (error) {
        console.error('Error generating PDF content:', error);
        pdf.setFontSize(10);
        pdf.text(t('common.errorGeneratingReport'), 20, 60);
      }
    } else {
      pdf.setFontSize(10);
      pdf.text(t('common.noDataAvailable'), 20, 80);
    }
    
    // Simple footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Página ${i} de ${pageCount}`, 20, pdf.internal.pageSize.height - 10);
      pdf.text(`Generado: ${format(currentDate, 'dd/MM/yyyy HH:mm')}`, pdf.internal.pageSize.width - 60, pdf.internal.pageSize.height - 10);
    }
    
    return pdf;
  };

  // Process payment
  const processPayment = async () => {
    try {
      
      setIsProcessingPayment(true);
      
      // Get current company user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      
      // Get company ID
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      
      if (companyError || !companyData) {
        throw new Error("No se pudo obtener la información de la empresa");
      }
      
      const currentAmount = calculateRealTotalOutstanding();
      const today = new Date().toISOString().split('T')[0];
      
      // Create payment record in Supabase (optional - continue if fails)
      try {
        const { data: paymentData, error: paymentError } = await supabase
          .from("company_payments")
          .insert([{
            company_id: companyData.id,
            amount: currentAmount,
            status: 'paid',
            payment_method: paymentMethod,
            payment_details: paymentDetails,
            paid_date: today,
            invoice_number: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
            period: `${new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`,
            due_date: billingData.nextDueDate
          }])
          .select();
        
        if (paymentError) {
          console.warn('Warning: Could not create payment record:', paymentError);
        }
      } catch (dbError) {
        console.warn('Database error (continuing with local updates):', dbError);
      }
      
      // Always proceed with local updates regardless of database status
      
      // Update employee fees status to 'paid' in the database
      try {
        const { error: feesUpdateError } = await supabase
          .from("employee_fees")
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString(),
            paid_amount: 1.00,
            updated_at: new Date().toISOString()
          })
          .eq("company_id", companyData.id)
          .in("status", ["pending", "unpaid"]);
        
        if (feesUpdateError) {
          console.warn('Warning: Could not update employee fees status:', feesUpdateError);
        }
      } catch (feesError) {
        console.warn('Error updating employee fees:', feesError);
      }
      
      // Update advance transactions status to 'completed' in the database
      try {
        const { error: advancesUpdateError } = await supabase
          .from("advance_transactions")
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("company_id", companyData.id)
          .in("status", ["pending", "approved", "processing"]);
        
        if (advancesUpdateError) {
          console.warn('Warning: Could not update advance transactions status:', advancesUpdateError);
        }
      } catch (advancesError) {
        console.warn('Error updating advance transactions:', advancesError);
      }
      
      // Update local company data to reflect payment
      if (companyData) {
        // Update local company data immediately
        const updatedCompanyData = {
          ...companyData,
          monthlyAdvances: 0,
          totalEmployeeRegistrationFees: 0
        };
        setCompany(updatedCompanyData);
        
        // Note: Company data fields are computed from other tables
        // The actual reset happens through the payment record creation
      }
      
      // Update local state - this will trigger the useEffect to update totalOutstanding
      setTotalOutstanding(0);
      setLastPaymentDate(today);
      
      // Refresh company data from Supabase to ensure we have the latest values
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: updatedCompanyData, error: refreshError } = await supabase
            .from("companies")
            .select("*")
            .eq("auth_user_id", user.id)
            .single();
          
          if (!refreshError && updatedCompanyData) {
            setCompany(updatedCompanyData);
          }
        }
      } catch (error) {
        console.warn('Could not refresh company data:', error);
      }
      
      // Refresh payment history (optional)
      try {
        await fetchPaymentHistory();
      } catch (historyError) {
        console.warn('Could not refresh payment history:', historyError);
        // Continue even if history refresh fails
      }
      
      // Refresh employee fees data to reflect updated statuses
      try {
        const { data: updatedFeesData, error: feesRefreshError } = await supabase
          .from("employee_fees")
          .select(`
            *,
            employees!inner(
              first_name,
              last_name
            )
          `)
          .eq("company_id", companyData.id)
          .order("created_at", { ascending: false });
        
        if (feesRefreshError) {
          console.warn('Warning: Could not refresh employee fees:', feesRefreshError);
        } else {
          setEmployeeFees(updatedFeesData || []);
        }
      } catch (feesRefreshError) {
        console.warn('Error refreshing employee fees:', feesRefreshError);
      }
      
      toast({
        title: t('company.billing.paymentProcessed'),
        description: t('company.billing.paymentProcessedDesc'),
      });
      
      setShowPaymentModal(false);
      setPaymentDetails('');
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: t('company.billing.paymentError'),
        description: t('company.billing.paymentErrorDesc'),
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Generate invoice
  const generateInvoice = async (invoiceData: any) => {
    try {
      console.log('Generating invoice with data:', invoiceData);
      
      const doc = new jsPDF();
      
      // Set up the PDF document
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Safely extract values with fallbacks
      const invoiceNumber = invoiceData.invoiceNumber || invoiceData.id || 'INV-UNKNOWN';
      const period = invoiceData.period || invoiceData.billing_period || 'Período no especificado';
      const dueDate = invoiceData.dueDate || invoiceData.due_date || format(new Date(), 'dd/MM/yyyy');
      const advanceFees = invoiceData.advanceFees || invoiceData.advance_fees || invoiceData.advances_amount || 0;
      const registrationFees = invoiceData.registrationFees || invoiceData.registration_fees || invoiceData.employee_fees || 0;
      const totalAmount = invoiceData.amount || invoiceData.total_amount || (advanceFees + registrationFees);
      
      // Header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURA', pageWidth - 60, 30);
      
      // Company info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Pre-Sallery', 20, 50);
      doc.text('Sistema de Adelantos de Salario', 20, 60);
      
      // Invoice details
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Factura #${invoiceNumber}`, pageWidth - 60, 50);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth - 60, 60);
      doc.text(`Período: ${period}`, pageWidth - 60, 70);
      doc.text(`Vence: ${dueDate}`, pageWidth - 60, 80);
      
      // Client info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Datos del Cliente:', 20, 100);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Empresa: ${company?.name || 'N/A'}`, 20, 110);
      doc.text(`RIF: ${company?.rif || 'N/A'}`, 20, 120);
      doc.text(`Empleados activos: ${employees.filter(emp => emp.is_active).length}`, 20, 130);
      
      // Invoice items - simplified version
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLES DE FACTURACIÓN:', 20, 150);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Adelantos procesados: ${reportData?.approvedAdvances || 0}`, 20, 165);
      doc.text(`Monto total adelantos: $${Number(advanceFees).toFixed(2)}`, 20, 175);
      doc.text(`Empleados registrados: ${employeeFees?.length || 0}`, 20, 185);
      doc.text(`Tarifas de registro: $${Number(registrationFees).toFixed(2)}`, 20, 195);
      
      // Total
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL A PAGAR: $${Number(totalAmount).toFixed(2)}`, pageWidth - 60, 220);
      
      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Gracias por su confianza en Pre-Sallery', pageWidth / 2, pageHeight - 20, { align: 'center' });
      doc.text('Sistema de Adelantos de Salario', pageWidth / 2, pageHeight - 15, { align: 'center' });
      
      // Save the PDF
      doc.save(`Factura_${invoiceData.invoiceNumber}.pdf`);
      
      toast({
        title: "Factura generada",
        description: `Se ha generado la factura ${invoiceData.invoiceNumber} en formato PDF`,
      });
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        invoiceData,
        reportData,
        companyData,
        employeeFees
      });
      toast({
        title: "Error",
        description: `No se pudo generar la factura: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* No company record message */}
        {hasCompanyRecord === false && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-yellow-800">{t('company.noCompanyRecord')}</h3>
            </div>
            <p className="text-yellow-700 mb-4">
              {t('company.noCompanyRecordDesc')}
            </p>
            <Button asChild>
              <Link to="/register">{t('company.completeRegistration')}</Link>
            </Button>
          </div>
        )}

        {/* Delete employee confirmation */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('company.deleteEmployeeTitle')}</DialogTitle>
              <DialogDescription>
                {t('company.deleteEmployeeConfirm').replace('{name}', employeeToDelete ? `${employeeToDelete.first_name} ${employeeToDelete.last_name}` : t('common.employee'))}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 sm:flex-none">
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={confirmDeleteEmployee} className="flex-1 sm:flex-none">
                {t('common.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View employee details */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>{t('company.viewEmployeeDetails')}</span>
              </DialogTitle>
              <DialogDescription>
                {viewingEmployee ? `${viewingEmployee.first_name} ${viewingEmployee.last_name}` : ''}
              </DialogDescription>
            </DialogHeader>
            {viewingEmployee && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h4 className="font-semibold">{t('company.personalInfo')}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.firstName')}:</span>
                        <span className="text-sm font-medium">{viewingEmployee.first_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.lastName')}:</span>
                        <span className="text-sm font-medium">{viewingEmployee.last_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.email')}:</span>
                        <span className="text-sm font-medium">{user?.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.phone')}:</span>
                        <span className="text-sm font-medium">{viewingEmployee.phone || t('common.notProvided')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.cedula')}:</span>
                        <span className="text-sm font-medium">{viewingEmployee.cedula || t('common.notProvided')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">{t('company.workInfo')}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.position')}:</span>
                        <span className="text-sm font-medium">{viewingEmployee.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.department')}:</span>
                        <span className="text-sm font-medium">{viewingEmployee.department || t('common.notProvided')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.monthlySalary')}:</span>
                        <span className="text-sm font-medium">${viewingEmployee.monthly_salary}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.employmentType')}:</span>
                        <span className="text-sm font-medium">{viewingEmployee.employment_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.weeklyHours')}:</span>
                        <span className="text-sm font-medium">{viewingEmployee.weekly_hours}h</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold">{t('company.status')}</h4>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{t('company.activeStatus')}:</span>
                      <Badge className={viewingEmployee.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {viewingEmployee.is_active ? t('company.active') : t('common.inactive')}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{t('company.verifiedStatus')}:</span>
                      <Badge className={viewingEmployee.is_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                        {viewingEmployee.is_verified ? t('company.verified') : t('company.pending')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                {t('common.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Permission management */}
        <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {permissionEmployee?.is_active ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                <span>{permissionEmployee?.is_active ? t('company.revokeAccess') : t('company.grantAccess')}</span>
              </DialogTitle>
              <DialogDescription>
                {permissionEmployee ? (
                  permissionEmployee.is_active
                    ? t('company.revokeAccessDesc').replace('{name}', `${permissionEmployee.first_name} ${permissionEmployee.last_name}`)
                    : t('company.grantAccessDesc').replace('{name}', `${permissionEmployee.first_name} ${permissionEmployee.last_name}`)
                ) : ''}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)} className="flex-1 sm:flex-none">
                {t('common.cancel')}
              </Button>
              <Button
                variant={permissionEmployee?.is_active ? "destructive" : "default"}
                onClick={() => permissionEmployee && handleToggleEmployeeAccess(permissionEmployee)}
                className="flex-1 sm:flex-none"
                disabled={isLoading}
              >
                {isLoading ? t('common.loading') : (permissionEmployee?.is_active ? t('company.revokeAccess') : t('company.grantAccess'))}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('company.advancesThisMonth')}</CardTitle>
              <DollarSign className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${isLoadingAdvances ? '...' : companyData.monthlyAdvances.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoadingAdvances ? '...' : `${monthlyChangePercent > 0 ? '+' : ''}${monthlyChangePercent.toFixed(1)}%`} {t('company.vsLastMonth')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('company.pendingApproval')}</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingAdvances ? '...' : companyData.pendingAdvances}
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoadingAdvances ? '...' : (companyData.pendingAdvances === 1 ? t('company.pendingApprovalOne') : t('company.pendingApprovalMany'))}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('company.weeklyBilling')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${isLoadingAdvances ? '...' : companyData.weeklyBilling.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('company.nextBill')} {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('company.billing.registrationFees')}</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${isLoadingEmployeeFees ? '...' : companyData.totalEmployeeRegistrationFees.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoadingEmployees ? '...' : `${employees.filter(emp => emp.is_active).length} ${t('company.billing.registeredEmployees')}`}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="advances" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="advances" className="relative">
              {t('company.advances')}
              {companyData.pendingAdvances > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {companyData.pendingAdvances}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="employees" className="relative">
              {t('company.employees')}
              {totalPendingItems > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {totalPendingItems}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports">{t('company.reports')}</TabsTrigger>
            <TabsTrigger value="billing">{t('company.billing')}</TabsTrigger>
          </TabsList>

          <TabsContent value="advances" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CardTitle>{t('company.recentAdvances')}</CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {filteredAdvances.length} {t('company.requests')}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm text-muted-foreground">{t('common.show')}:</Label>
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
                </div>
                
                {/* Date Filters */}
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">{t('common.from')}:</Label>
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
                <div className="space-y-4">
                  {isLoadingAdvances ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-3 animate-spin" />
                      <p className="text-muted-foreground">{t('common.loading')}</p>
                    </div>
                  ) : filteredAdvances.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        {activeAdvances.length === 0 
                          ? t('common.noData')
                          : t('company.reports.filtersDesc')
                        }
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activeAdvances.length === 0 
                          ? t('common.noData')
                          : t('company.reports.filtersDesc')
                        }
                      </p>
                    </div>
                  ) : (
                    paginatedAdvances.map((advance) => {
                      const employeeName = `${advance.employees.first_name} ${advance.employees.last_name}`;
                      const advanceDate = new Date(advance.created_at);
                      const isToday = advanceDate.toDateString() === new Date().toDateString();
                      const formattedDate = isToday 
                        ? `${t('employee.today')}, ${advanceDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
                        : advanceDate.toLocaleDateString(undefined, {
                            day: 'numeric', 
                            month: 'long', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                      
                      return (
                    <div key={advance.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                                {employeeName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                              <div className="font-medium">{employeeName}</div>
                              <div className="text-sm text-muted-foreground">{formattedDate}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div>
                              <div className="font-semibold">${advance.requested_amount.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">{t('company.request')}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Action buttons on the left */}
                        <div className="flex space-x-2">
                            {/* Show reject button for pending and approved advances */}
                            {(advance.status === 'pending' || advance.status === 'approved') && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleRejectClick(advance)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                {t('company.reject')}
                              </Button>
                            )}
                            
                                {/* Show approve button only for pending advances (cannot re-approve rejected/cancelled) */}
                                {advance.status === 'pending' && (
                              <Button 
                                size="sm" 
                                variant="premium"
                                onClick={() => handleApproveClick(advance)}
                              >
                                {t('company.approve')}
                              </Button>
                            )}
                          </div>
                          
                          {/* Status badge on the right */}
                          <div className="ml-auto">
                          {advance.status === 'pending' && (
                                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">{t('employee.pending')}</Badge>
                          )}
                          {advance.status === 'approved' && (
                            <Badge className="bg-blue-100 text-blue-800">{t('company.approved') ?? 'Aprobado'}</Badge>
                          )}
                          {advance.status === 'completed' && (
                            <Badge className="bg-green-100 text-green-800">{t('employee.completed')}</Badge>
                          )}
                            {advance.status === 'processing' && (
                                  <Badge className="bg-orange-100 text-orange-800">{t('common.processing')}</Badge>
                            )}
                            {advance.status === 'cancelled' && (
                                  <Badge variant="outline" className="text-muted-foreground">{t('common.cancelled')}</Badge>
                            )}
                            {advance.status === 'failed' && (
                                  <Badge variant="destructive">{t('common.failed')}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                </div>
                      );
                    })
                  )}
                </div>

                {/* Pagination Controls */}
                {filteredAdvances.length > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-muted/30">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>
                        {t('common.showing')} {startIndex + 1} - {Math.min(endIndex, filteredAdvances.length)} {t('common.of')} {filteredAdvances.length} {t('company.requests')}
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
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            {/* Nested Tabs for Employees Section */}
            <Tabs defaultValue="employee-management" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="employee-management" className="relative">
                  {t('company.employeeManagement')}
                  {pendingEmployees > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {pendingEmployees}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="change-requests" className="relative">
                  {t('employee.changeRequests')}
                  {pendingChangeRequests > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {pendingChangeRequests}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="employee-management" className="space-y-6">
                {/* Employee Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-none shadow-elegant">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('company.batchCounters.totalEmployees')}</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalEmployees}</div>
                      <p className="text-xs text-muted-foreground">
                        {t('company.batchCounters.count')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-elegant">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('company.batchCounters.pendingEmployees')}</CardTitle>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">{pendingEmployees}</div>
                      <p className="text-xs text-muted-foreground">
                        {t('company.batchCounters.pendingEmployeesDesc')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-elegant">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('company.batchCounters.activeEmployees')}</CardTitle>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{employees.filter(emp => emp.is_active).length}</div>
                      <p className="text-xs text-muted-foreground">
                        {t('company.batchCounters.activeEmployeesDesc')}
                      </p>
                    </CardContent>
                  </Card>
                </div>

            <Card className="border-none shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('company.employeeManagement')}</CardTitle>
                    <CardDescription>
                      {t('company.managePayroll')}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={t('company.searchEmployee')}
                            className="pl-10 w-64"
                            value={employeeSearch}
                            onChange={(e) => setEmployeeSearch(e.target.value)}
                          />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={refreshEmployees}
                      disabled={isLoadingEmployees}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingEmployees ? 'animate-spin' : ''}`} />
                          {t('company.billing.refresh')}
                    </Button>
                    <Dialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen}>
                      <DialogTrigger asChild>
                    <Button variant="hero">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('company.addEmployee')}
                    </Button>
                      </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            <Users className="h-5 w-5" />
                                <span>{t('company.addEmployeeTitle')}</span>
                          </DialogTitle>
                          <DialogDescription>
                                {t('company.addEmployeeDesc')}
                          </DialogDescription>
                        </DialogHeader>
                            <div className="space-y-4">
                              <Button
                                variant="outline"
                                className="w-full h-20 flex flex-col items-center justify-center space-y-2"
                                onClick={() => {
                                  setIsAddEmployeeDialogOpen(false);
                                  setShowSimpleForm(true);
                                }}
                              >
                                <Users className="h-6 w-6" />
                                <span>{t('company.addSingleEmployee')}</span>
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full h-20 flex flex-col items-center justify-center space-y-2"
                                onClick={() => {
                                  setIsAddEmployeeDialogOpen(false);
                                  setShowCsvUploadModal(true);
                                }}
                              >
                                <FileSpreadsheet className="h-6 w-6" />
                                <span>{t('company.csvUpload.title')}</span>
                              </Button>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsAddEmployeeDialogOpen(false)}>
                                {t('common.cancel')}
                              </Button>
                            </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingEmployees ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-muted-foreground">{t('company.billing.loadingPayments')}</p>
                    </div>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">{t('company.noEmployees')}</p>
                        <p className="text-sm text-muted-foreground mt-2">{t('company.addFirstEmployeeHint')}</p>
                  </div>
                ) : (
                <div className="space-y-4">
                        {paginatedEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                              {employee.first_name[0]}{employee.last_name[0]}
                          </span>
                        </div>
                        <div>
                            <div className="font-medium">{employee.first_name} {employee.last_name}</div>
                            <div className="text-sm text-muted-foreground">{employee.cedula || user?.email || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                            <div className="font-medium">${employee.monthly_salary}{t('company.month')}</div>
                            <div className="text-sm text-muted-foreground">
                                  {employee.is_verified ? t('company.billing.employeeVerified') : t('employee.pending')}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {employee.is_active ? (
                            <Badge className="bg-green-100 text-green-800">{t('company.active')}</Badge>
                            ) : (
                            <Badge variant="secondary">{t('common.pending')}</Badge>
                          )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openViewEmployee(employee)}
                                  title={t('company.viewEmployee')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditEmployee(employee)}
                                  title={t('common.edit')}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPermissionEmployee(employee)}
                                  title={employee.is_active ? t('company.revokeAccess') : t('company.grantAccess')}
                                >
                                  {employee.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => openDeleteEmployee(employee)}
                                  title={t('common.delete')}
                            >
                                  <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                        <Pagination
                          className="pt-4 border-t"
                          currentPage={employeeCurrentPage}
                          totalItems={filteredEmployees.length}
                          itemsPerPage={employeeItemsPerPage}
                          onPageChange={(p) => setEmployeeCurrentPage(Math.max(1, Math.min(p, employeeTotalPages)))}
                          onItemsPerPageChange={(n) => { setEmployeeItemsPerPage(n); setEmployeeCurrentPage(1); }}
                        />
                </div>
                )}
              </CardContent>
            </Card>
              </TabsContent>

              <TabsContent value="change-requests" className="space-y-6">
                {/* Change Requests Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-none shadow-elegant">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('company.batchCounters.totalRequests')}</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalChangeRequests}</div>
                      <p className="text-xs text-muted-foreground">
                        {t('company.batchCounters.count')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-elegant">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('company.batchCounters.pendingRequests')}</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{pendingChangeRequests}</div>
                      <p className="text-xs text-muted-foreground">
                        {t('company.batchCounters.batch')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-elegant">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Approved</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {changeRequests.filter(req => req.status === 'approved').length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('company.batchCounters.count')}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-none shadow-elegant">
                  <CardHeader>
                    <div className="flex items-center justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            setIsLoadingChangeRequests(true);
                            const result = await changeRequestService.getChangeRequests({
                              company_id: company?.id
                            });
                            if (result.success && result.data) {
                              setChangeRequests(result.data);
                            }
                          } catch (error) {
                            console.error('Error loading change requests:', error);
                          } finally {
                            setIsLoadingChangeRequests(false);
                          }
                        }}
                        disabled={isLoadingChangeRequests}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingChangeRequests ? 'animate-spin' : ''}`} />
                        {t('company.billing.refresh')}
                      </Button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex-1 min-w-64">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search change requests..."
                            className="pl-10"
                            value={changeRequestSearch}
                            onChange={(e) => setChangeRequestSearch(e.target.value)}
                          />
                        </div>
                      </div>

                      <Select value={changeRequestStatus} onValueChange={setChangeRequestStatus}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={changeRequestCategory} onValueChange={setChangeRequestCategory}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="profile">Profile</SelectItem>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="contact">Contact</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {isLoadingChangeRequests ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-muted-foreground">Loading change requests...</p>
                        </div>
                      </div>
                    ) : changeRequests.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No change requests found</h3>
                        <p className="text-muted-foreground">Employees haven't submitted any change requests yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Pagination at the top */}
                        {filteredChangeRequests.length > 0 && (
                          <Pagination
                            className="pb-4"
                            currentPage={changeRequestPage}
                            totalItems={filteredChangeRequests.length}
                            itemsPerPage={changeRequestItemsPerPage}
                            onPageChange={(p) => setChangeRequestPage(Math.max(1, Math.min(p, changeRequestTotalPages)))}
                            onItemsPerPageChange={(n) => { setChangeRequestItemsPerPage(n); setChangeRequestPage(1); }}
                          />
                        )}
                        {paginatedChangeRequests.map((request) => (
                          <div key={request.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Badge
                                    variant={request.status === 'pending' ? 'secondary' :
                                      request.status === 'approved' ? 'default' : 'destructive'}
                                    className={
                                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        request.status === 'approved' ? 'bg-green-100 text-green-800' : ''
                                    }
                                  >
                                    {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                    {request.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {request.status === 'rejected' && <X className="h-3 w-3 mr-1" />}
                                    {request.status!.charAt(0).toUpperCase() + request.status!.slice(1)}
                                  </Badge>
                                  <Badge variant="outline">{request.category}</Badge>
                                  {request.priority === 'high' && (
                                    <Badge variant="destructive">High Priority</Badge>
                                  )}
                                </div>

                                <div>
                                  <div className="font-medium">
                                    {request.field_name.replace('_', ' ').toUpperCase()} Change Profile Request
                                  </div>
                                  {(() => {
                                    const employee = employees.find(emp => emp.id === request.employee_id);
                                    return (
                                      <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                                        <div className="flex items-center space-x-2">
                                          <div className="h-8 w-8 bg-gradient-secondary rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs font-medium">
                                              {employee ? `${employee.first_name[0]}${employee.last_name[0]}` : '??'}
                                            </span>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">
                                              {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {user?.email || 'Not available'}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">Current Value:</span> {request.current_value || 'Not set'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">Requested Value:</span> {request.requested_value || 'Not provided'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">Reason:</span> {request.reason}
                                  </p>
                                  {request.details && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      <span className="font-medium">Details:</span> {request.details}
                                    </p>
                                  )}
                                </div>

                                <div className="text-xs text-muted-foreground">
                                  Submitted: {new Date(request.created_at!).toLocaleDateString()}
                                  {request.reviewed_at && (
                                    <span className="ml-4">
                                      Reviewed: {new Date(request.reviewed_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>

                                {request.reviewer_notes && (
                                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                                    <strong>Admin Notes:</strong> {request.reviewer_notes}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                {request.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => {
                                        setChangeRequestToAction(request);
                                        setShowApproveChangeRequestModal(true);
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>

                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        setChangeRequestToAction(request);
                                        setShowRejectChangeRequestModal(true);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                        }
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Report Filters */}
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>{t('company.reports.filters')}</span>
                </CardTitle>
                <CardDescription>
                  {t('company.reports.filtersDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('company.periodLabel')}</Label>
                    <Select value={reportPeriod} onValueChange={setReportPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('company.selectPeriod')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="thisMonth">{t('company.thisMonth')}</SelectItem>
                        <SelectItem value="lastMonth">{t('company.lastMonth')}</SelectItem>
                        <SelectItem value="last3Months">{t('company.last3Months')}</SelectItem>
                        <SelectItem value="last6Months">{t('company.last6Months')}</SelectItem>
                        <SelectItem value="thisYear">{t('company.thisYear')}</SelectItem>
                        {/** custom period option removed as requested */}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('company.reportTypeLabel')}</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('company.selectType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="advances">{t('company.reports.type.advances')}</SelectItem>
                        <SelectItem value="fees">{t('company.reports.type.fees')}</SelectItem>
                        <SelectItem value="employees">{t('company.reports.type.employees')}</SelectItem>
                        <SelectItem value="comprehensive">{t('company.reports.type.comprehensive')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('company.formatLabel')}</Label>
                    <Select value={reportFormat} onValueChange={setReportFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('company.selectFormat')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={generateReport} 
                      disabled={isGeneratingReport}
                      className="w-full"
                    >
                      {isGeneratingReport ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {t('company.reports.generate')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Summary */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-none shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('company.reports.totalAdvances')}</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${reportData.totalAdvances.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reportData.totalAdvanceCount} {t('company.requests')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('company.reports.commissions')}</CardTitle>
                  <TrendingUp className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${reportData.totalFees.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reportData.averageFeeRate.toFixed(1)}% {t('company.average')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('company.reports.activeEmployees')}</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {employees.filter(emp => emp.is_active).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reportData.employeeParticipationRate.toFixed(1)}% {t('company.participation')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('company.reports.avgPerEmployee')}</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${reportData.averagePerEmployee.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('company.perActiveEmployee')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Reports */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>{t('company.reports.advancesReport')}</span>
                  </CardTitle>
                  <CardDescription>
                    {t('company.reports.advancesReportDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('company.reports.totalRequests')}</span>
                      <span className="font-medium">{reportData.totalAdvanceCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('company.reports.approvedRequests')}</span>
                      <span className="font-medium text-green-600">{reportData.approvedAdvances}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('company.reports.pendingRequests')}</span>
                      <span className="font-medium text-orange-600">{reportData.pendingAdvances}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('company.reports.rejectedRequests')}</span>
                      <span className="font-medium text-red-600">{reportData.rejectedAdvances}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('company.reports.totalAmount')}</span>
                      <span className="font-medium text-primary">${reportData.totalAdvances.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('company.reports.avgAmount')}</span>
                      <span className="font-medium">${reportData.averageAdvanceAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleExportClick('advances')}
                    disabled={isGeneratingReport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('company.reports.exportAdvances')}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>{t('company.reports.usageAnalysis')}</span>
                  </CardTitle>
                  <CardDescription>
                    {t('company.reports.usageAnalysisDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('company.participationRate')}:</span>
                      <span className="font-medium">{reportData.employeeParticipationRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('company.mostActiveEmployees')}:</span>
                      <span className="font-medium">{reportData.mostActiveEmployees}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('company.mostActiveDay')}:</span>
                      <span className="font-medium">{reportData.mostActiveDay}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('company.peakHour')}:</span>
                      <span className="font-medium">{reportData.peakHour}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('company.monthlyGrowth')}:</span>
                      <span className={`font-medium ${reportData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {reportData.monthlyGrowth >= 0 ? '+' : ''}{reportData.monthlyGrowth.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleExportClick('analytics')}
                    disabled={isGeneratingReport}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {t('company.reports.exportAnalysis')}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Reports History */}
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>{t('company.recentReports')}</span>
                </CardTitle>
                <CardDescription>
                  {t('company.reports.historyDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentReports.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">{t('company.reports.noReports')}</p>
                    </div>
                  ) : (
                    recentReports.map((report, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">{report.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {report.type} • {report.period} • {report.format.toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              {safeFormatDate(report.createdAt, 'dd/MM/yyyy HH:mm')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {report.size}
                            </div>
                          </div>
                          {report.url ? (
                            <a href={report.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                            </a>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => generateReportWithParams(report.type, report.period, report.format, { addToRecent: false, uploadToStorage: false })}>
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            {/* Billing Summary */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-none shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('company.billing.totalOutstanding')}</CardTitle>
                  <FileText className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${billingData.totalOutstanding.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('company.billing.dueDate')} {billingData.nextDueDate}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('company.billing.monthlyAdvances')}</CardTitle>
                  <TrendingUp className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${billingData.currentMonthAdvances.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {employees.filter(emp => emp.is_active).length} {t('company.activeEmployeesCount')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('company.billing.registrationFees')}</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${billingData.currentMonthRegistrationFees.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {employeeFees.length} {t('company.billing.registeredEmployees')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('company.billing.lastPayment')}</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {safeFormatDate(billingData.lastPaymentDate, 'dd/MM')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {safeFormatDate(billingData.lastPaymentDate, 'yyyy')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Billing Details */}
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                    <span>{t('company.billing.billingDetails')}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={refreshCompanyData}
                    className="h-8"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('company.billing.refresh')}
                  </Button>
                </CardTitle>
                <CardDescription>
                  {t('company.billing.billingDetailsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">{t('company.billing.advanceCommissions')}</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t('company.billing.processedAdvances')}:</span>
                        <span className="font-medium">{billingData.currentPeriodAdvancesCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t('company.billing.totalAdvancesAmount')}:</span>
                        <span className="font-medium">${billingData.currentPeriodTotalAdvances.toFixed(2)}</span>
                      </div>
                      {!billingData.isFirstPeriod && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t('company.billing.averageCommission')}:</span>
                          <span className="font-medium">
                            {billingData.currentPeriodAdvancesCount > 0
                              ? ((billingData.currentPeriodCommissionFees / billingData.currentPeriodTotalAdvances) * 100).toFixed(1)
                              : '0.0'
                            }%
                          </span>
                      </div>
                      )}
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm font-medium">{t('company.billing.totalBilling')}:</span>
                        <span className="font-bold text-lg">${billingData.totalOutstanding.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {!billingData.isFirstPeriod && (
                  <div className="space-y-4">
                      <h4 className="font-semibold">
                        {t('company.billing.employeeFees')}
                      </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t('company.billing.registeredEmployees')}:</span>
                          <span className="font-medium">{activeEmployeesCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{t('company.billing.feePerEmployeeMonth')}</span>
                          <span className="font-medium">$1.00/month</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{t('company.billing.monthlyFee')}:</span>
                          <span className="font-medium">${(activeEmployeesCount * 1.00).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm font-medium">{t('company.billing.totalFees')}:</span>
                          <span className="font-bold text-lg">${(activeEmployeesCount * 1.00).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  )}
                </div>

                <div className="bg-gradient-hero p-6 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-muted-foreground">{t('company.billing.totalToPay')}</div>
                      <div className="text-3xl font-bold">${billingData.totalOutstanding.toFixed(2)}</div>
                      <div className="text-sm">{t('company.billing.dueDate')} {billingData.nextDueDate}</div>
                      {!isBillingDate() && (
                        <div className="text-xs text-yellow-600 mt-1">
                          {t('company.billing.paymentRestrictionWarning')}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => generateInvoice({
                          invoiceNumber: currentBillingPeriod.invoiceNumber,
                          period: currentBillingPeriod.description,
                          dueDate: billingData.nextDueDate,
                          advanceFees: billingData.currentMonthAdvances,
                          registrationFees: billingData.currentMonthRegistrationFees,
                          amount: billingData.totalOutstanding
                        })}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {t('company.billing.downloadInvoice')}
                      </Button>
                      <Button 
                        variant="premium"
                        disabled={billingData.totalOutstanding <= 0 || !isBillingDate()}
                        onClick={() => {
                          if (billingData.totalOutstanding <= 0) return;
                          if (!isBillingDate()) {
                            toast({
                              title: t('company.billing.paymentNotAvailable'),
                              description: t('company.billing.paymentRestrictionWarning'),
                              variant: "destructive"
                            });
                            return;
                          }
                          setShowPaymentModal(true);
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        {t('company.billing.payNow')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>{t('company.billing.paymentHistory')}</span>
                </CardTitle>
                <CardDescription>
                  {t('company.billing.recentInvoices')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Pagination Controls (Top) */}
                  {billingData.paymentHistory.length > 0 && (() => {
                    const totalPages = Math.max(1, Math.ceil(billingData.paymentHistory.length / paymentsPerPage));
                    // If only one page, keep size selector but hide number/chevrons
                    const showNav = totalPages > 1;
                    const count = Math.min(3, totalPages);
                    const half = Math.floor(count / 2);
                    const start = Math.max(1, Math.min(paymentPage - half, totalPages - count + 1));
                    const pages = Array.from({ length: count }, (_, i) => start + i);
                    return (
                      <div className="flex items-center justify-between pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{t('common.show')}:</span>
                          <Select value={String(paymentsPerPage)} onValueChange={(v) => { setPaymentsPerPage(Number(v)); setPaymentPage(1); }}>
                            <SelectTrigger className="w-[90px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {showNav && (
                          <div className="flex items-center space-x-2">
                            <Button
                              aria-label="Previous page"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg"
                              onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
                              disabled={paymentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {pages.map((p) => (
                              <Button
                                key={p}
                                aria-label={`Page ${p}`}
                                variant={p === paymentPage ? 'default' : 'outline'}
                                size="sm"
                                className={`h-8 w-8 p-0 rounded-lg ${p === paymentPage ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}`}
                                onClick={() => setPaymentPage(p)}
                              >
                                {p}
                              </Button>
                            ))}
                            <Button
                              aria-label="Next page"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg"
                              onClick={() => setPaymentPage((p) => Math.min(totalPages, p + 1))}
                              disabled={paymentPage >= totalPages}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {billingData.paymentHistory
                    .slice((paymentPage - 1) * paymentsPerPage, paymentPage * paymentsPerPage)
                    .map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-muted-foreground">{invoice.period}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="font-bold text-xl">${invoice.amount.toFixed(2)}</div>
                          <Badge 
                              className={`mt-1 ${invoice.status === 'paid'
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-orange-100 text-orange-700 border-orange-200'
                            }`}
                            variant="outline"
                          >
                            {invoice.status === 'paid' ? t('company.billing.paid') : t('company.billing.pending')}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => generateInvoice(invoice)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.status === 'pending' && (
                            <Button 
                              variant="default" 
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => setShowPaymentModal(true)}
                            >
                              {t('company.billing.pay')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>{t('company.billing.paymentMethodsTitle')}</span>
                </CardTitle>
                <CardDescription>
                  {t('company.billing.paymentMethodsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">{t('company.billing.billingInfo')}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.billing.company')}</span>
                        <span className="text-sm font-medium">{company?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.billing.rifLabel')}</span>
                        <span className="text-sm font-medium">{company?.rif || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.billing.billingPeriod')}</span>
                        <span className="text-sm font-medium">
                          {billingData.billingPeriod.period === 'first'
                            ? t('company.billing.firstPeriod')
                            : t('company.billing.secondPeriod')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.billing.paymentMethodLabelFull')}</span>
                        <span className="text-sm font-medium">{t('company.billing.bankTransfer')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">{t('company.billing.upcomingPayments')}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.billing.nextInvoice')}</span>
                        <span className="text-sm font-medium">{billingData.nextDueDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.billing.estimatedAmountShort')}</span>
                        <span className="text-sm font-medium">${billingData.totalOutstanding.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('company.billing.daysRemainingShort')}</span>
                        <span className="text-sm font-medium">
                          {getDaysRemaining(billingData.nextDueDate)} {t('company.billing.daysUnit')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>{t('common.edit')} {t('common.employee')}</span>
            </DialogTitle>
            <DialogDescription>
              Modifica la información del empleado {editingEmployee?.first_name} {editingEmployee?.last_name}.
            </DialogDescription>


          </DialogHeader>
          <EmployeeInfoForm 
            key={editingEmployee?.id || 'new'}
            onSave={handleUpdateEmployee}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setEditingEmployee(null);
            }}
            isLoading={isLoading}
            {...(editingEmployee ? {
              initialData: (() => {
                console.log("CompanyDashboard editingEmployee:", editingEmployee);
                const mappedData = mapEmployeeToFormData(editingEmployee);
                console.log("CompanyDashboard passing initialData to EmployeeInfoForm:", mappedData);
                return mappedData;
              })()
            } : {})}
          />
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t('company.approveAdvanceTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('company.approveAdvanceDescPrefix')} {" "}
              <span className="font-semibold">
                ${advanceToAction?.requested_amount.toFixed(2)}
              </span>{" "}
              {t('common.for') || 'for'} {" "}
              <span className="font-semibold">
                {advanceToAction?.employees ? `${advanceToAction.employees.first_name} ${advanceToAction.employees.last_name}` : (t('common.employee') || 'employee')}
              </span>.
              <br />
              <br />
              {t('company.approveAdvanceDescF')}
              <br />
              <span className="text-muted-foreground">{t('company.approveAdvanceNoteApproved')}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={cancelApproveAction}
              className="flex-1 sm:flex-none"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={confirmApproveAdvance}
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('company.approve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-destructive" />
              {t('company.reject')}
            </DialogTitle>
            <DialogDescription>
              {t('company.rejectAdvanceDescPrefix') || 'Are you sure you want to reject this advance of'} {" "}
              <span className="font-semibold">
                ${advanceToAction?.requested_amount.toFixed(2)}
              </span>{" "}
              {t('common.for') || 'for'} {" "}
              <span className="font-semibold">
                {advanceToAction?.employees ? `${advanceToAction.employees.first_name} ${advanceToAction.employees.last_name}` : (t('common.employee') || 'employee')}
              </span>?
              <br />
              <br />
              <span className="text-destructive font-medium">
                {t('common.actionCannotBeUndone') || 'This action cannot be undone.'}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={cancelRejectAction}
              className="flex-1 sm:flex-none"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRejectAdvance}
              className="flex-1 sm:flex-none"
            >
              <X className="h-4 w-4 mr-2" />
              {t('company.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={(open) => {
        setShowPaymentModal(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>{t('company.billing.processPayment')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('company.billing.completePaymentData')} ${billingData.totalOutstanding.toFixed(2)}
              <br />
              <span className="text-xs text-muted-foreground">
                {t('company.billing.modalState')} {showPaymentModal ? t('company.billing.open') : t('company.billing.close')} | 
                {t('company.billing.realTotal')} ${calculateRealTotalOutstanding().toFixed(2)} | 
                {t('company.billing.advancesAmount')} ${billingData.currentMonthAdvances.toFixed(2)} | 
                {t('company.billing.feesAmount')} ${billingData.currentMonthRegistrationFees.toFixed(2)}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-method">{t('company.billing.paymentMethod')}</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder={t('company.billing.enterPaymentMethod')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">{t('company.billing.bankTransfer')}</SelectItem>
                  <SelectItem value="pagomovil">{t('company.billing.pagoMovil')}</SelectItem>
                  <SelectItem value="credit_card">{t('company.billing.creditCard')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-details">{t('company.billing.paymentDetails')}</Label>
              <Input
                id="payment-details"
                placeholder={t('company.billing.enterPaymentDetails')}
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
              />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t('company.billing.advances')}</span>
                  <span className="font-bold">${billingData.currentMonthAdvances.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t('company.billing.registrationFeesLabel')}</span>
                  <span className="font-bold">${billingData.currentMonthRegistrationFees.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="font-medium">{t('company.billing.totalToPay')}</span>
                  <span className="text-xl font-bold">${calculateRealTotalOutstanding().toFixed(2)}</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {t('company.billing.dueDate')} {billingData.nextDueDate}
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPaymentModal(false)}
              disabled={isProcessingPayment}
            >
              {t('company.billing.cancel')}
            </Button>
            <Button 
              onClick={processPayment}
              disabled={billingData.totalOutstanding <= 0 || !paymentDetails.trim() || isProcessingPayment}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessingPayment ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('company.billing.processing')}
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  {t('company.billing.processPayment')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Individual Employee Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>{t('company.addEmployeeTitle')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('company.addEmployeeDesc')}
            </DialogDescription>
          </DialogHeader>
          <EmployeeInfoForm
            onSave={handleEmployeeSave}
            onCancel={() => setIsEditDialogOpen(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* CSV Upload Modal */}
      <Dialog open={showCsvUploadModal} onOpenChange={setShowCsvUploadModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5" />
              <span>{t('company.csvUpload.title')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('company.csvUpload.description')}
            </DialogDescription>
          </DialogHeader>

          {csvUploadStep === 'upload' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('company.csvUpload.selectFile')}</h3>
                <p className="text-muted-foreground mb-4">{t('company.csvUpload.dragDrop')}</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <Button asChild>
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {t('company.csvUpload.selectFile')}
                  </label>
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{t('company.csvUpload.requiredFields')}</h4>
                  <p className="text-sm text-muted-foreground">email, firstname, lastname</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">{t('company.csvUpload.supportedFields')}</h4>
                  <p className="text-sm text-muted-foreground">
                    firstname, lastname, email, phone, salary, hours, year, bank, account, type, cedula, address, city, state, postal, dependents, emergency_contact, emergency_phone, position
                  </p>
                </div>
              </div>
            </div>
          )}

          {csvUploadStep === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t('company.csvUpload.preview')}</h3>
                <Button variant="outline" onClick={() => setCsvUploadStep('upload')}>
                  {t('company.csvUpload.back')}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{t('company.csvUpload.previewDesc')}</p>

              {/* Selection Controls */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm" onClick={selectAllCsvRows}>
                    <Check className="h-4 w-4 mr-2" />
                    {t('company.csvUpload.selectAll')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllCsvRows}>
                    <X className="h-4 w-4 mr-2" />
                    {t('company.csvUpload.deselectAll')}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedCsvRows.size > 0 ? (
                    `${selectedCsvRows.size} of ${csvData.length} selected`
                  ) : (
                    t('company.csvUpload.noRowsSelected')
                  )}
                </div>
              </div>

              {/* Data Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left w-12">
                          <Checkbox
                            checked={selectedCsvRows.size === csvData.length && csvData.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                selectAllCsvRows();
                              } else {
                                deselectAllCsvRows();
                              }
                            }}
                          />
                        </th>
                        <th className="p-2 text-left">Row</th>
                        <th className="p-2 text-left">First Name</th>
                        <th className="p-2 text-left">Last Name</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Phone</th>
                        <th className="p-2 text-left">Salary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCsvPaginatedData().map((row, index) => {
                        const actualIndex = (csvCurrentPage - 1) * csvItemsPerPage + index;
                        return (
                          <tr key={actualIndex} className="border-t hover:bg-muted/50">
                            <td className="p-2">
                              <Checkbox
                                checked={selectedCsvRows.has(actualIndex)}
                                onCheckedChange={() => toggleCsvRowSelection(actualIndex)}
                              />
                            </td>
                            <td className="p-2">{row.rowNumber}</td>
                            <td className="p-2">{row.firstname || row.first_name || row['first name'] || '-'}</td>
                            <td className="p-2">{row.lastname || row.last_name || row['last name'] || '-'}</td>
                            <td className="p-2">{row.email || '-'}</td>
                            <td className="p-2">{row.phone || row.phone_number || row['phone number'] || '-'}</td>
                            <td className="p-2">{row.salary || row.monthly_salary || row['monthly salary'] || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {getCsvTotalPages() > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((csvCurrentPage - 1) * csvItemsPerPage) + 1} to {Math.min(csvCurrentPage * csvItemsPerPage, csvData.length)} of {csvData.length} rows
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCsvCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={csvCurrentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {csvCurrentPage} of {getCsvTotalPages()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCsvCurrentPage(prev => Math.min(getCsvTotalPages(), prev + 1))}
                      disabled={csvCurrentPage === getCsvTotalPages()}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setCsvUploadStep('upload')}>
                  {t('company.csvUpload.back')}
                </Button>
                <Button
                  onClick={importCsvEmployees}
                  disabled={isProcessingCsv || selectedCsvRows.size === 0}
                >
                  {isProcessingCsv ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {t('company.csvUpload.processing')}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {t('company.csvUpload.import')} ({selectedCsvRows.size})
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={resetCsvUpload}>
              {t('company.csvUpload.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simple Employee Form Dialog */}
      <Dialog open={showSimpleForm} onOpenChange={setShowSimpleForm}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>{t('company.simpleEmployeeForm.title')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('company.simpleEmployeeForm.description')}
            </DialogDescription>
          </DialogHeader>
          <SimpleEmployeeForm
            onSave={handleSimpleEmployeeSave}
            onCancel={() => setShowSimpleForm(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Export Format Selection Dialog */}
      <Dialog open={showFormatDialog} onOpenChange={setShowFormatDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Export Format</DialogTitle>
            <DialogDescription>
              Choose the format for your {pendingExportType} report export.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="excel"
                  name="exportFormat"
                  value="excel"
                  checked={selectedExportFormat === 'excel'}
                  onChange={(e) => setSelectedExportFormat(e.target.value as 'excel' | 'csv' | 'pdf')}
                  className="h-4 w-4 text-primary"
                />
                <Label htmlFor="excel" className="flex items-center space-x-2 cursor-pointer">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span>Excel (.xlsx) - Best for data analysis</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="csv"
                  name="exportFormat"
                  value="csv"
                  checked={selectedExportFormat === 'csv'}
                  onChange={(e) => setSelectedExportFormat(e.target.value as 'excel' | 'csv' | 'pdf')}
                  className="h-4 w-4 text-primary"
                />
                <Label htmlFor="csv" className="flex items-center space-x-2 cursor-pointer">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>CSV (.csv) - Universal compatibility</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="pdf"
                  name="exportFormat"
                  value="pdf"
                  checked={selectedExportFormat === 'pdf'}
                  onChange={(e) => setSelectedExportFormat(e.target.value as 'excel' | 'csv' | 'pdf')}
                  className="h-4 w-4 text-primary"
                />
                <Label htmlFor="pdf" className="flex items-center space-x-2 cursor-pointer">
                  <FileText className="h-4 w-4 text-red-600" />
                  <span>PDF (.pdf) - Professional presentation</span>
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormatDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFormatSelection} disabled={isGeneratingReport}>
              {isGeneratingReport ? 'Exporting...' : `Export as ${selectedExportFormat.toUpperCase()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Change Request Confirmation Modal */}
      <Dialog open={showApproveChangeRequestModal} onOpenChange={setShowApproveChangeRequestModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approve Change Request
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this change request?
            </DialogDescription>
            {changeRequestToAction && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <div><strong>Field:</strong> {changeRequestToAction.field_name}</div>
                <div><strong>Current:</strong> {changeRequestToAction.current_value}</div>
                <div><strong>Requested:</strong> {changeRequestToAction.requested_value}</div>
                <div><strong>Reason:</strong> {changeRequestToAction.reason}</div>
              </div>
            )}
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowApproveChangeRequestModal(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApproveChangeRequest}
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Change Request Confirmation Modal */}
      <Dialog open={showRejectChangeRequestModal} onOpenChange={setShowRejectChangeRequestModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-destructive" />
              Reject Change Request
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this change request?
            </DialogDescription>
            {changeRequestToAction && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <div><strong>Field:</strong> {changeRequestToAction.field_name}</div>
                <div><strong>Current:</strong> {changeRequestToAction.current_value}</div>
                <div><strong>Requested:</strong> {changeRequestToAction.requested_value}</div>
                <div><strong>Reason:</strong> {changeRequestToAction.reason}</div>
              </div>
            )}
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowRejectChangeRequestModal(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRejectChangeRequest}
              className="flex-1 sm:flex-none"
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
};

export default CompanyDashboard;

