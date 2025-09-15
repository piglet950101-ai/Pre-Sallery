import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmployeeInfoForm } from "@/components/EmployeeInfoForm";
import Header from "@/components/Header";
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
  CheckCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import * as XLSX from 'xlsx';
import { format, startOfDay, endOfDay } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [advances, setAdvances] = useState<any[]>([]);
  const [isLoadingAdvances, setIsLoadingAdvances] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [filteredAdvances, setFilteredAdvances] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [advanceToAction, setAdvanceToAction] = useState<any>(null);
  const [employeeFees, setEmployeeFees] = useState<any[]>([]);
  const [isLoadingEmployeeFees, setIsLoadingEmployeeFees] = useState(false);
  
  // Report states
  const [reportPeriod, setReportPeriod] = useState('thisMonth');
  const [reportType, setReportType] = useState('comprehensive');
  const [reportFormat, setReportFormat] = useState('excel');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  
  // Billing states
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState('current');
  // Export confirmation modal state
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  const [pendingExportType, setPendingExportType] = useState<string | null>(null);
  // Delete employee modal state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // Filter out cancelled advances
  const activeAdvances = advances.filter(advance => advance.status !== 'cancelled');

  // Company data (will be calculated from real data, excluding cancelled advances)
  const companyData = {
    name: company?.name || "Cargando...",
    rif: company?.rif || "Cargando...",
    activeEmployees: employees.filter(emp => emp.is_active).length,
    totalAdvances: activeAdvances.reduce((sum, advance) => sum + advance.requested_amount, 0),
    pendingAdvances: activeAdvances.filter(advance => advance.status === 'pending').length,
    monthlyFees: activeAdvances
      .filter(advance => {
        const advanceDate = new Date(advance.created_at);
        const now = new Date();
        return advanceDate.getMonth() === now.getMonth() && 
               advanceDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, advance) => sum + advance.fee_amount, 0),
    totalEmployeeRegistrationFees: employeeFees
      .reduce((sum, fee) => sum + fee.fee_amount, 0),
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

  // Report data calculations
  const reportData = {
    totalAdvances: activeAdvances.reduce((sum, advance) => sum + advance.requested_amount, 0),
    totalAdvanceCount: activeAdvances.length,
    totalFees: activeAdvances.reduce((sum, advance) => sum + advance.fee_amount, 0),
    averageFeeRate: activeAdvances.length > 0 
      ? (activeAdvances.reduce((sum, advance) => sum + (advance.fee_amount / advance.requested_amount * 100), 0) / activeAdvances.length)
      : 0,
    activeEmployees: employees.filter(emp => emp.is_active).length,
    employeeParticipationRate: employees.length > 0 
      ? (employees.filter(emp => emp.is_active && activeAdvances.some(adv => adv.employee_id === emp.id)).length / employees.length) * 100
      : 0,
    averagePerEmployee: employees.filter(emp => emp.is_active).length > 0
      ? activeAdvances.reduce((sum, advance) => sum + advance.requested_amount, 0) / employees.filter(emp => emp.is_active).length
      : 0,
    approvedAdvances: activeAdvances.filter(adv => adv.status === 'completed' || adv.status === 'approved').length,
    pendingAdvances: activeAdvances.filter(adv => adv.status === 'pending').length,
    rejectedAdvances: activeAdvances.filter(adv => adv.status === 'failed').length,
    averageAdvanceAmount: activeAdvances.length > 0
      ? activeAdvances.reduce((sum, advance) => sum + advance.requested_amount, 0) / activeAdvances.length
      : 0,
    mostActiveEmployees: employees.filter(emp => emp.is_active).length > 0 ? employees.filter(emp => emp.is_active).length : 0,
    mostActiveDay: 'Lunes', // This would be calculated from actual data
    peakHour: '10:00 AM', // This would be calculated from actual data
    monthlyGrowth: monthlyChangePercent
  };

  // Billing data calculations
  const billingData = {
    currentMonthFees: companyData.monthlyFees,
    currentMonthAdvances: companyData.monthlyAdvances,
    currentMonthRegistrationFees: companyData.totalEmployeeRegistrationFees,
    totalOutstanding: companyData.monthlyFees + companyData.totalEmployeeRegistrationFees,
    lastPaymentDate: '2024-01-15', // This would come from actual payment data
    nextDueDate: '2024-02-15', // This would be calculated
    paymentHistory: [
      {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        amount: 1250.00,
        status: 'paid',
        dueDate: '2024-01-15',
        paidDate: '2024-01-14',
        period: '1-15 Enero, 2024'
      },
      {
        id: '2',
        invoiceNumber: 'INV-2024-002',
        amount: 1180.00,
        status: 'pending',
        dueDate: '2024-02-01',
        paidDate: null,
        period: '16-31 Enero, 2024'
      }
    ]
  };

  // Fetch employees from Supabase and set up real-time subscription
  useEffect(() => {
    let companyId: string | null = null;
    let channel: any = null;
    
    const fetchEmployees = async () => {
      try {
        setIsLoadingEmployees(true);
        
        // Get current company user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("Usuario no autenticado");
        }
        
        // Get company data from companies table
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("auth_user_id", user.id)
          .single();
        
        if (companyError || !companyData) {
          throw new Error("No se encontró la información de la empresa");
        }
        
        companyId = companyData.id;
        setCompany(companyData);
        
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
        
        // Fetch advances for this company
        const { data: advancesData, error: advancesError } = await supabase
          .from("advance_transactions")
          .select(`
            *,
            employees!inner(
              first_name,
              last_name,
              email
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
                console.log('Employee update received:', payload);
                
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
                console.log('Advance update received:', payload);
                
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
        .single();
      
      if (companyError || !companyData) {
        throw new Error("No se encontró la información de la empresa");
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
        title: "Lista actualizada",
        description: "La lista de empleados ha sido actualizada",
      });
    } catch (error: any) {
      console.error("Error refreshing employees:", error);
      toast({
        title: "Error",
        description: error?.message ?? "No se pudieron actualizar los empleados",
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
      
      // Get current company user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      
      // Get company data from companies table
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();
      
      if (companyError || !companyData) {
        throw new Error("No se encontró la información de la empresa");
      }
      
      // Fetch employee fees for this company
      const { data: feesData, error: feesError } = await supabase
        .from("employee_fees")
        .select(`
          *,
          employees!inner(
            first_name,
            last_name,
            email
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
        .single();
      
      if (companyError || !companyData) {
        throw new Error("No se encontró la información de la empresa");
      }

      // Normalize and validate email
      const normalizedEmail = String(employeeInfo.email || "").trim().toLowerCase();
      if (!normalizedEmail || !normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
        toast({
          title: "Email inválido",
          description: "Ingresa una dirección de correo válida",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Check for duplicate email within this company before inserting
      const { data: existingByEmail, error: dupCheckError } = await supabase
        .from("employees")
        .select("id")
        .eq("company_id", companyData.id)
        .ilike("email", normalizedEmail)
        .limit(1);

      if (dupCheckError && dupCheckError.code !== 'PGRST116') {
        throw new Error(`Error verificando email: ${dupCheckError.message}`);
      }

      if (Array.isArray(existingByEmail) && existingByEmail.length > 0) {
        toast({
          title: "Correo duplicado",
          description: "Este correo ya está registrado para un empleado de la empresa.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Insert employee data into employees table
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .insert([{
          auth_user_id: null, // Will be set when employee activates account
          company_id: companyData.id,
          first_name: employeeInfo.firstName,
          last_name: employeeInfo.lastName,
          email: normalizedEmail,
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

      // Create employee fee record ($1 one-time registration fee)
      const currentDate = new Date();
      const dueDate = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
      
      const { error: feeError } = await supabase
        .from("employee_fees")
        .insert([{
          company_id: companyData.id,
          employee_id: employeeData.id,
          fee_amount: 1.00,
          fee_type: 'employee_registration_fee',
          status: 'pending',
          due_date: dueDate.toISOString().split('T')[0],
          notes: `One-time registration fee for ${employeeInfo.firstName} ${employeeInfo.lastName}`
        }]);

      if (feeError) {
        console.error("Error creating employee fee:", feeError);
        // Don't throw error here, just log it - employee was created successfully
      }
      
      // Refresh fees after adding new employee fee
      await fetchEmployeeFees();

      // TODO: Send activation code via email/SMS
      // await supabase.functions.invoke('send-activation-code', { 
      //   email: employeeInfo.email, 
      //   activationCode: activationCode,
      //   employeeName: `${employeeInfo.firstName} ${employeeInfo.lastName}`
      // });
      
      toast({
        title: "Empleado agregado exitosamente",
        description: `Se ha enviado un código de activación (${activationCode}) a ${employeeInfo.email}. Se ha agregado una tarifa de registro de $1 USD por este empleado.`,
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEmployee = async (employee: Employee) => {
    try {
      // Fetch the most up-to-date employee data
      const { data: updatedEmployee, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", employee.id)
        .single();
      
      if (error) {
        console.error("Error fetching employee data:", error);
        // Fallback to the employee data we already have
        setEditingEmployee(employee);
      } else {
        setEditingEmployee(updatedEmployee);
      }
      
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Error in handleEditEmployee:", error);
      // Fallback to the employee data we already have
      setEditingEmployee(employee);
      setIsEditDialogOpen(true);
    }
  };

  const openDeleteEmployee = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    try {
      setIsLoading(true);
      // Soft delete: mark employee inactive, or hard delete if desired
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", employeeToDelete.id);
      if (error) throw error;

      // Remove from local state
      setEmployees(prev => prev.filter(e => e.id !== employeeToDelete.id));

      toast({
        title: "Empleado eliminado",
        description: `${employeeToDelete.first_name} ${employeeToDelete.last_name} fue eliminado correctamente`,
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
        throw new Error("No se encontró el empleado a editar");
      }
      
      // Update employee data in Supabase
      const { data: updatedEmployee, error: updateError } = await supabase
        .from("employees")
        .update({
          first_name: employeeInfo.firstName,
          last_name: employeeInfo.lastName,
          email: employeeInfo.email,
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
        .select()
        .single();
      
      if (updateError) {
        throw new Error(`Error al actualizar empleado: ${updateError.message}`);
      }
      
      toast({
        title: "Empleado actualizado exitosamente",
        description: `La información de ${employeeInfo.firstName} ${employeeInfo.lastName} ha sido actualizada`,
      });
      
      // Refresh employee list
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("id")
          .eq("auth_user_id", user.id)
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
      console.log("Approving advance:", advanceToAction.id);
      
      const { data, error } = await supabase
        .from("advance_transactions")
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq("id", advanceToAction.id)
        .select();

      console.log("Approve result:", { data, error });

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
      console.log("Rejecting advance:", advanceToAction.id);
      
      const { data, error } = await supabase
        .from("advance_transactions")
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq("id", advanceToAction.id)
        .select();

      console.log("Reject result:", { data, error });

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
  const exportToExcel = () => {
    if (filteredAdvances.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay adelantos para exportar en el rango seleccionado",
        variant: "destructive"
      });
      return;
    }

    const exportData = filteredAdvances.map(advance => ({
      'Fecha': format(new Date(advance.created_at), 'dd/MM/yyyy HH:mm'),
      'Empleado': `${advance.employees.first_name} ${advance.employees.last_name}`,
      'Email': advance.employees.email,
      'Monto Solicitado': `$${advance.requested_amount.toFixed(2)}`,
      'Comisión': `$${advance.fee_amount.toFixed(2)}`,
      'Monto Neto': `$${advance.net_amount.toFixed(2)}`,
      'Estado': advance.status === 'completed' ? 'Completado' : 
                advance.status === 'pending' ? 'Pendiente' :
                advance.status === 'processing' ? 'Procesando' :
                advance.status === 'approved' ? 'Aprobado' :
                advance.status === 'failed' ? 'Fallido' : advance.status,
      'Método de Pago': advance.payment_method === 'pagomovil' ? 'PagoMóvil' : 'Transferencia Bancaria',
      'Detalles de Pago': advance.payment_details,
      'Lote': advance.batch_id || 'N/A',
      'Fecha de Procesamiento': advance.processed_at ? format(new Date(advance.processed_at), 'dd/MM/yyyy HH:mm') : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Adelantos de Empleados');

    const fileName = `adelantos_empleados_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Exportación exitosa",
      description: `Se ha exportado ${filteredAdvances.length} adelantos a ${fileName}`,
    });
  };

  // Generate comprehensive report
  const generateReport = async () => {
    try {
      setIsGeneratingReport(true);
      
      const reportName = `Reporte_${reportType}_${reportPeriod}_${format(new Date(), 'yyyy-MM-dd')}`;
      
      // Create report data based on type
      let reportData = [];
      
      switch (reportType) {
        case 'advances':
          reportData = activeAdvances.map(advance => ({
            'Fecha': format(new Date(advance.created_at), 'dd/MM/yyyy HH:mm'),
            'Empleado': `${advance.employees.first_name} ${advance.employees.last_name}`,
            'Email': advance.employees.email,
            'Monto Solicitado': advance.requested_amount,
            'Comisión': advance.fee_amount,
            'Monto Neto': advance.net_amount,
            'Estado': advance.status === 'completed' ? 'Completado' : 
                      advance.status === 'pending' ? 'Pendiente' :
                      advance.status === 'processing' ? 'Procesando' :
                      advance.status === 'approved' ? 'Aprobado' :
                      advance.status === 'failed' ? 'Fallido' : advance.status,
            'Método de Pago': advance.payment_method === 'pagomovil' ? 'PagoMóvil' : 'Transferencia Bancaria',
            'Detalles de Pago': advance.payment_details,
            'Lote': advance.batch_id || 'N/A'
          }));
          break;
          
        case 'fees':
          reportData = activeAdvances.map(advance => ({
            'Fecha': format(new Date(advance.created_at), 'dd/MM/yyyy'),
            'Empleado': `${advance.employees.first_name} ${advance.employees.last_name}`,
            'Monto Adelanto': advance.requested_amount,
            'Comisión': advance.fee_amount,
            'Porcentaje Comisión': ((advance.fee_amount / advance.requested_amount) * 100).toFixed(2) + '%',
            'Estado': advance.status,
            'Fecha Procesamiento': advance.processed_at ? format(new Date(advance.processed_at), 'dd/MM/yyyy') : 'N/A'
          }));
          break;
          
        case 'employees':
          reportData = employees.map(employee => ({
            'Nombre': `${employee.first_name} ${employee.last_name}`,
            'Email': employee.email,
            'Cédula': employee.cedula || 'N/A',
            'Posición': employee.position,
            'Departamento': employee.department || 'N/A',
            'Salario Mensual': employee.monthly_salary,
            'Estado': employee.is_active ? 'Activo' : 'Inactivo',
            'Verificado': employee.is_verified ? 'Sí' : 'No',
            'Fecha Registro': format(new Date(employee.created_at), 'dd/MM/yyyy'),
            'Adelantos Solicitados': activeAdvances.filter(adv => adv.employee_id === employee.id).length,
            'Total Adelantos': activeAdvances.filter(adv => adv.employee_id === employee.id)
              .reduce((sum, adv) => sum + adv.requested_amount, 0)
          }));
          break;
          
        case 'comprehensive':
          reportData = activeAdvances.map(advance => ({
            'Fecha': format(new Date(advance.created_at), 'dd/MM/yyyy HH:mm'),
            'Empleado': `${advance.employees.first_name} ${advance.employees.last_name}`,
            'Email': advance.employees.email,
            'Cédula': advance.employees.cedula || 'N/A',
            'Posición': advance.employees.position || 'N/A',
            'Monto Solicitado': advance.requested_amount,
            'Comisión': advance.fee_amount,
            'Monto Neto': advance.net_amount,
            'Estado': advance.status === 'completed' ? 'Completado' : 
                      advance.status === 'pending' ? 'Pendiente' :
                      advance.status === 'processing' ? 'Procesando' :
                      advance.status === 'approved' ? 'Aprobado' :
                      advance.status === 'failed' ? 'Fallido' : advance.status,
            'Método de Pago': advance.payment_method === 'pagomovil' ? 'PagoMóvil' : 'Transferencia Bancaria',
            'Detalles de Pago': advance.payment_details,
            'Lote': advance.batch_id || 'N/A',
            'Fecha de Procesamiento': advance.processed_at ? format(new Date(advance.processed_at), 'dd/MM/yyyy HH:mm') : 'N/A'
          }));
          break;
      }
      
      if (reportData.length === 0) {
        toast({
          title: "No hay datos",
          description: "No hay datos para generar el reporte en el período seleccionado",
          variant: "destructive"
        });
        return;
      }
      
      // Generate file based on format
      let fileName = '';
      let fileSize = '';
      
      if (reportFormat === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(reportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
        
        fileName = `${reportName}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        fileSize = `${Math.round(JSON.stringify(reportData).length / 1024)} KB`;
      } else if (reportFormat === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(reportData));
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        fileName = `${reportName}.csv`;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        fileSize = `${Math.round(csv.length / 1024)} KB`;
      } else if (reportFormat === 'pdf') {
        // Generate PDF using jsPDF
        const pdf = generatePDFReport(reportData, reportType, reportName);
        fileName = `${reportName}.pdf`;
        pdf.save(fileName);
        fileSize = `${Math.round(JSON.stringify(reportData).length / 1024)} KB`;
        
        toast({
          title: "PDF generado exitosamente",
          description: `Se ha generado el reporte PDF ${fileName}`,
        });
      }
      
      // Add to recent reports
      const newReport = {
        name: reportName,
        type: reportType,
        period: reportPeriod,
        format: reportFormat,
        createdAt: new Date().toISOString(),
        size: fileSize
      };
      
      setRecentReports(prev => [newReport, ...prev.slice(0, 9)]); // Keep only last 10
      
      toast({
        title: "Reporte generado exitosamente",
        description: `Se ha generado el reporte ${fileName} con ${reportData.length} registros`,
      });
      
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: error?.message ?? "No se pudo generar el reporte",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Export specific report type
  const exportReport = (type: string) => {
    setPendingExportType(type);
    setIsExportConfirmOpen(true);
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

  // Export a PDF mirroring the on-screen "Análisis de Uso" summary section
  const generateAnalyticsSectionPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const marginX = 20;
    let y = 20;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('Análisis de Uso', marginX, y);
    y += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Estadísticas de participación y tendencias', marginX, y);
    y += 6;
    pdf.text(`Fecha de exportación: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, marginX, y);
    y += 8;

    const analytics = {
      participation: `${reportData.employeeParticipationRate.toFixed(1)}%`,
      mostActiveEmployees: String(reportData.mostActiveEmployees),
      mostActiveDay: reportData.mostActiveDay,
      peakHour: reportData.peakHour,
      monthlyGrowth: `${reportData.monthlyGrowth >= 0 ? '+' : ''}${reportData.monthlyGrowth.toFixed(1)}%`,
    };

    const rows: Array<[string, string]> = [
      ['Tasa de participación:', analytics.participation],
      ['Empleados más activos:', analytics.mostActiveEmployees],
      ['Día más activo:', analytics.mostActiveDay],
      ['Horario pico:', analytics.peakHour],
      ['Crecimiento mensual:', analytics.monthlyGrowth],
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

  const confirmExport = () => {
    if (!pendingExportType) {
      setIsExportConfirmOpen(false);
      return;
    }
    // For advances button: export a PDF summary matching the on-screen section format
    if (pendingExportType === 'advances') {
      setIsExportConfirmOpen(false);
      const fileName = `Reporte_Adelantos_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      const pdf = generateAdvancesSectionPDF();
      pdf.save(fileName);
      setPendingExportType(null);
      return;
    }
    if (pendingExportType === 'analytics') {
      setIsExportConfirmOpen(false);
      const fileName = `Analisis_de_Uso_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      const pdf = generateAnalyticsSectionPDF();
      pdf.save(fileName);
      setPendingExportType(null);
      return;
    }
    setReportType(pendingExportType);
    setIsExportConfirmOpen(false);
    generateReport();
    setPendingExportType(null);
  };

  const cancelExport = () => {
    setIsExportConfirmOpen(false);
    setPendingExportType(null);
  };

  // Generate PDF report using jsPDF
  const generatePDFReport = (data: any[], type: string, reportName: string) => {
    const currentDate = new Date();
    const companyName = company?.name || 'Empresa';
    const companyRif = company?.rif || 'N/A';
    
    // Create new PDF document - auto switch to landscape for many columns
    const isWide = data && data.length > 0 && Object.keys(data[0]).length > 8;
    const pdf = new jsPDF(isWide ? 'l' : 'p', 'mm', 'a4');
    
    // Simple header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Reporte de ${type}`, 20, 20);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${companyName} - RIF: ${companyRif}`, 20, 28);
    pdf.text(`Generado: ${format(currentDate, 'dd/MM/yyyy HH:mm')}`, 20, 34);
    
    // Summary: include for analytics and other types, but not for 'advances'
    if (type !== 'advances') {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumen', 20, 45);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total de registros: ${data.length}`, 20, 52);
      pdf.text(`Período: ${reportPeriod}`, 20, 58);

      // Add basic stats if we have data
      if (data.length > 0) {
        const totalAmount = data.reduce((sum, row) => {
          const amount = parseFloat(String(row['Monto Solicitado'] || row['Monto Adelanto'] || 0));
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

        const avgAmount = totalAmount / data.length;

        pdf.text(`Monto total: $${totalAmount.toFixed(2)}`, 20, 64);
        pdf.text(`Promedio: $${avgAmount.toFixed(2)}`, 20, 70);
      }
    }
    
    // Add data table if there's data
    if (data.length > 0) {
      try {
        // Prepare table data
        const headers = Object.keys(data[0]);
        const tableData = data.map(row => 
          headers.map(header => String(row[header] || ''))
        );
        
        // Add table using autoTable with responsive design
        if (pdf.autoTable) {
          // Calculate optimal column widths based on content
          const calculateColumnWidths = (headers: string[], data: any[][]) => {
            const pageWidth = pdf.internal.pageSize.width - 40; // 20mm margins on each side
            const minWidth = 15; // Minimum column width
            const maxWidth = pageWidth / headers.length * 2; // Maximum column width
            
            return headers.map((header, index) => {
              // Calculate content width for this column
              const headerWidth = header.length * 1.5; // Approximate character width
              const maxDataWidth = Math.max(...data.map(row => String(row[index] || '').length)) * 1.2;
              const contentWidth = Math.max(headerWidth, maxDataWidth);
              
              // Clamp between min and max width
              return Math.max(minWidth, Math.min(maxWidth, contentWidth));
            });
          };
          
          const columnWidths = calculateColumnWidths(headers, tableData);
          
          pdf.autoTable({
            head: [headers],
            body: tableData,
            startY: type !== 'advances' ? 80 : 50,
            styles: {
              fontSize: 8,
              cellPadding: 3,
              lineColor: [0, 0, 0],
              lineWidth: 0.1,
              textColor: [0, 0, 0],
              font: 'helvetica',
              halign: 'left',
              valign: 'middle',
            },
            headStyles: {
              fillColor: [240, 240, 240],
              textColor: [0, 0, 0],
              fontStyle: 'bold',
              fontSize: 9,
              halign: 'center',
            },
            alternateRowStyles: {
              fillColor: [250, 250, 250],
            },
            columnStyles: headers.reduce((acc, header, index) => {
              acc[index] = { 
                cellWidth: columnWidths[index],
                halign: 'left',
                overflow: 'linebreak',
                cellPadding: 2
              };
              return acc;
            }, {} as any),
            margin: { left: 20, right: 20, top: 5 },
            tableWidth: 'wrap',
            showHead: 'everyPage',
            pageBreak: 'auto',
            rowPageBreak: 'avoid',
            didDrawPage: function (data) {
              // Simple page number
              const pageCount = pdf.getNumberOfPages();
              pdf.setFontSize(8);
              pdf.setTextColor(100, 100, 100);
              pdf.text(`Página ${pdf.getCurrentPageInfo().pageNumber} de ${pageCount}`, 
                pdf.internal.pageSize.width - 30, 
                pdf.internal.pageSize.height - 10);
            }
          });
        } else {
          // Fallback: simple text table if autoTable is not available
          pdf.setFontSize(8);
          let yPosition = 80;
          const usableWidth = pdf.internal.pageSize.width - 40; // 20mm side margins

          // Add headers (wrapped to page width)
          const headers = Object.keys(data[0]);
          const headerText = headers.join(' | ');
          const wrappedHeader = pdf.splitTextToSize(headerText, usableWidth);
          pdf.text(wrappedHeader, 20, yPosition);
          yPosition += wrappedHeader.length * 6 + 2;

          // Add data rows (limit to first 100, wrapped)
          const maxRows = Math.min(data.length, 100);
          for (let i = 0; i < maxRows; i++) {
            const rowText = headers.map(header => String(data[i][header] || '')).join(' | ');
            const wrappedRow = pdf.splitTextToSize(rowText, usableWidth);
            pdf.text(wrappedRow, 20, yPosition);
            yPosition += wrappedRow.length * 6;

            // New page if needed
            if (yPosition > pdf.internal.pageSize.height - 20) {
              pdf.addPage();
              yPosition = 20;
            }
          }

          if (data.length > maxRows) {
            pdf.text(`... y ${data.length - maxRows} registros más`, 20, yPosition);
          }
        }
      } catch (error) {
        console.error('Error generating PDF table:', error);
        pdf.setFontSize(10);
        pdf.text('Error al generar la tabla. Mostrando datos básicos...', 20, 80);
        
        // Simple fallback
        pdf.setFontSize(8);
        let yPosition = 90;
        data.slice(0, 20).forEach((row, index) => {
          const rowText = Object.values(row).join(' | ');
          pdf.text(rowText, 20, yPosition);
          yPosition += 6;
        });
      }
    } else {
      pdf.setFontSize(10);
      pdf.text('No hay datos disponibles para el período seleccionado.', 20, 80);
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

  // Generate invoice
  const generateInvoice = async (invoiceData: any) => {
    try {
      // This would typically call a backend service to generate a proper invoice
      const invoiceContent = `
        FACTURA #${invoiceData.invoiceNumber}
        
        Empresa: ${company?.name || 'N/A'}
        RIF: ${company?.rif || 'N/A'}
        Período: ${invoiceData.period}
        Fecha de Vencimiento: ${invoiceData.dueDate}
        
        DETALLES:
        - Comisiones por adelantos: $${invoiceData.advanceFees.toFixed(2)}
        - Tarifas de registro: $${invoiceData.registrationFees.toFixed(2)}
        
        TOTAL: $${invoiceData.amount.toFixed(2)}
      `;
      
      const blob = new Blob([invoiceContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura_${invoiceData.invoiceNumber}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Factura generada",
        description: `Se ha generado la factura ${invoiceData.invoiceNumber}`,
      });
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la factura",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Delete employee confirmation */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Eliminar empleado</DialogTitle>
              <DialogDescription>
                ¿Seguro que deseas eliminar a {employeeToDelete ? `${employeeToDelete.first_name} ${employeeToDelete.last_name}` : 'este empleado'}? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 sm:flex-none">
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDeleteEmployee} className="flex-1 sm:flex-none">
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Export confirmation modal */}
        <Dialog open={isExportConfirmOpen} onOpenChange={setIsExportConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar exportación</DialogTitle>
              <DialogDescription>
                ¿Deseas exportar {pendingExportType === 'analytics' ? 'el análisis' : 'el reporte de adelantos'} en el formato seleccionado?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button variant="outline" onClick={cancelExport} className="flex-1 sm:flex-none">
                Cancelar
              </Button>
              <Button onClick={confirmExport} className="flex-1 sm:flex-none">
                Aceptar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('company.activeEmployees')}</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {isLoadingEmployees ? '...' : companyData.activeEmployees}
              </div>
              <p className="text-xs text-muted-foreground">
                ${isLoadingAdvances ? '...' : companyData.monthlyFees.toFixed(2)} {t('company.monthlyFees')}
              </p>
            </CardContent>
          </Card>

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
                {isLoadingAdvances ? '...' : (companyData.pendingAdvances === 1 ? 'Adelanto esperando aprobación' : 'Adelantos esperando aprobación')}
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
                {t('company.nextBill')} {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarifas de Registro</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${isLoadingEmployeeFees ? '...' : companyData.totalEmployeeRegistrationFees.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoadingEmployeeFees ? '...' : `${employeeFees.length} empleados registrados`}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="advances" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="advances">{t('company.advances')}</TabsTrigger>
            <TabsTrigger value="employees">{t('company.employees')}</TabsTrigger>
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
                      {filteredAdvances.length} adelantos
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm text-muted-foreground">Mostrar:</Label>
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
                      Exportar XLS
                    </Button>
                  </div>
                </div>
                
                {/* Date Filters */}
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">Desde:</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-[140px] justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Seleccionar"}
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
                    <Label className="text-sm font-medium">Hasta:</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-[140px] justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "dd/MM/yyyy") : "Seleccionar"}
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
                      Limpiar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingAdvances ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-3 animate-spin" />
                      <p className="text-muted-foreground">Cargando adelantos...</p>
                    </div>
                  ) : filteredAdvances.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        {activeAdvances.length === 0 
                          ? "No hay solicitudes de adelanto" 
                          : "No hay adelantos en el rango seleccionado"
                        }
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activeAdvances.length === 0 
                          ? "Las solicitudes de tus empleados aparecerán aquí" 
                          : "Ajusta el rango de fechas para ver más resultados"
                        }
                      </p>
                    </div>
                  ) : (
                    paginatedAdvances.map((advance) => {
                      const employeeName = `${advance.employees.first_name} ${advance.employees.last_name}`;
                      const advanceDate = new Date(advance.created_at);
                      const isToday = advanceDate.toDateString() === new Date().toDateString();
                      const formattedDate = isToday 
                        ? `Hoy, ${advanceDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                        : advanceDate.toLocaleDateString('es-ES', { 
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
                            
                            {/* Show approve button for pending and failed advances */}
                            {(advance.status === 'pending' || advance.status === 'failed') && (
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
                              <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Pendiente</Badge>
                          )}
                          {advance.status === 'approved' && (
                            // <Badge className="text-blue-800"></Badge>
                            <span className="text-green-900 font-bold border-l-2 border-green-900  w-[100px] inline-block text-center"> {t('company.approved')}</span>
                          
                          )}
                          {advance.status === 'completed' && (
                            <Badge className="bg-green-100 text-green-800">{t('employee.completed')}</Badge>
                          )}
                            {advance.status === 'processing' && (
                              <Badge className="bg-orange-100 text-orange-800">Procesando</Badge>
                            )}
                            {advance.status === 'cancelled' && (
                              <Badge variant="outline" className="text-muted-foreground">Cancelado</Badge>
                            )}
                            {advance.status === 'failed' && (
                              // <Badge variant="destructive">Fallido</Badge>
                              <span className="text-red-900 w-[100px] border-l-2 border-green-900 inline-block text-center"> Fallido</span>
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
                        Mostrando {startIndex + 1} - {Math.min(endIndex, filteredAdvances.length)} de {filteredAdvances.length} adelantos
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
                      <Input placeholder={t('company.searchEmployee')} className="pl-10 w-64" />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={refreshEmployees}
                      disabled={isLoadingEmployees}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingEmployees ? 'animate-spin' : ''}`} />
                      Actualizar
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                    <Button variant="hero">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('company.addEmployee')}
                    </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            <Users className="h-5 w-5" />
                            <span>Agregar Nuevo Empleado</span>
                          </DialogTitle>
                          <DialogDescription>
                            Completa la información del empleado para enviar un código de activación.
                          </DialogDescription>
                        </DialogHeader>
                        <EmployeeInfoForm 
                          onSave={handleEmployeeSave}
                          onCancel={() => setIsDialogOpen(false)}
                          isLoading={isLoading}
                          checkEmailDuplicate={async (email: string) => {
                            try {
                              // Get current user and company
                              const { data: { user } } = await supabase.auth.getUser();
                              if (!user) return false;
                              const { data: companyData } = await supabase
                                .from("companies")
                                .select("id")
                                .eq("auth_user_id", user.id)
                                .single();
                              if (!companyData) return false;
                              const { data: existing } = await supabase
                                .from("employees")
                                .select("id")
                                .eq("company_id", companyData.id)
                                .ilike("email", email)
                                .limit(1);
                              return Array.isArray(existing) && existing.length > 0;
                            } catch {
                              return false;
                            }
                          }}
                        />
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
                      <p className="text-muted-foreground">Cargando empleados...</p>
                    </div>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay empleados registrados</p>
                    <p className="text-sm text-muted-foreground mt-2">Agrega tu primer empleado usando el botón "Agregar Empleado"</p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {employees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                              {employee.first_name[0]}{employee.last_name[0]}
                          </span>
                        </div>
                        <div>
                            <div className="font-medium">{employee.first_name} {employee.last_name}</div>
                            <div className="text-sm text-muted-foreground">{employee.cedula || employee.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                            <div className="font-medium">${employee.monthly_salary}{t('company.month')}</div>
                            <div className="text-sm text-muted-foreground">
                              {employee.is_verified ? 'Verificado' : 'Pendiente de verificación'}
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
                              onClick={() => handleEditEmployee(employee)}
                            >
                              {t('common.edit')}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => openDeleteEmployee(employee)}
                            >
                              Eliminar
                            </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Report Filters */}
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Filtros de Reporte</span>
                </CardTitle>
                <CardDescription>
                  Selecciona el período y tipo de reporte que deseas generar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Período</Label>
                    <Select value={reportPeriod} onValueChange={setReportPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="thisMonth">Este Mes</SelectItem>
                        <SelectItem value="lastMonth">Mes Pasado</SelectItem>
                        <SelectItem value="last3Months">Últimos 3 Meses</SelectItem>
                        <SelectItem value="last6Months">Últimos 6 Meses</SelectItem>
                        <SelectItem value="thisYear">Este Año</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de Reporte</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="advances">Adelantos</SelectItem>
                        <SelectItem value="fees">Comisiones y Tarifas</SelectItem>
                        <SelectItem value="employees">Empleados</SelectItem>
                        <SelectItem value="comprehensive">Reporte Completo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Formato</Label>
                    <Select value={reportFormat} onValueChange={setReportFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar formato" />
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
                      Generar Reporte
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Summary */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-none shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Adelantos</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${reportData.totalAdvances.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reportData.totalAdvanceCount} solicitudes
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comisiones</CardTitle>
                  <TrendingUp className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${reportData.totalFees.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reportData.averageFeeRate.toFixed(1)}% promedio
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportData.activeEmployees}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reportData.employeeParticipationRate.toFixed(1)}% participación
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Promedio por Empleado</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${reportData.averagePerEmployee.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    por empleado activo
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
                    <span>Reporte de Adelantos</span>
                  </CardTitle>
                  <CardDescription>
                    Análisis detallado de solicitudes de adelanto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total de solicitudes:</span>
                      <span className="font-medium">{reportData.totalAdvanceCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Solicitudes aprobadas:</span>
                      <span className="font-medium text-green-600">{reportData.approvedAdvances}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Solicitudes pendientes:</span>
                      <span className="font-medium text-orange-600">{reportData.pendingAdvances}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Solicitudes rechazadas:</span>
                      <span className="font-medium text-red-600">{reportData.rejectedAdvances}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monto promedio:</span>
                      <span className="font-medium">${reportData.averageAdvanceAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => exportReport('advances')}
                    disabled={isGeneratingReport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Reporte de Adelantos
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Análisis de Uso</span>
                  </CardTitle>
                  <CardDescription>
                    Estadísticas de participación y tendencias
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tasa de participación:</span>
                      <span className="font-medium">{reportData.employeeParticipationRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Empleados más activos:</span>
                      <span className="font-medium">{reportData.mostActiveEmployees}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Día más activo:</span>
                      <span className="font-medium">{reportData.mostActiveDay}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Horario pico:</span>
                      <span className="font-medium">{reportData.peakHour}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Crecimiento mensual:</span>
                      <span className={`font-medium ${reportData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {reportData.monthlyGrowth >= 0 ? '+' : ''}{reportData.monthlyGrowth.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => exportReport('analytics')}
                    disabled={isGeneratingReport}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar Análisis
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Reports History */}
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Reportes Recientes</span>
                </CardTitle>
                <CardDescription>
                  Historial de reportes generados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentReports.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No hay reportes generados aún</p>
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
                              {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {report.size}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
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
                  <CardTitle className="text-sm font-medium">Factura Actual</CardTitle>
                  <FileText className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${billingData.totalOutstanding.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vence: {billingData.nextDueDate}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comisiones del Mes</CardTitle>
                  <TrendingUp className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${billingData.currentMonthFees.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {companyData.activeEmployees} empleados activos
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tarifas de Registro</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${billingData.currentMonthRegistrationFees.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {employeeFees.length} empleados registrados
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Último Pago</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {format(new Date(billingData.lastPaymentDate), 'dd/MM')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(billingData.lastPaymentDate), 'yyyy')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Billing Details */}
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Detalles de Facturación</span>
                </CardTitle>
                <CardDescription>
                  Desglose de comisiones y tarifas del período actual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Comisiones por Adelantos</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Adelantos procesados:</span>
                        <span className="font-medium">{reportData.approvedAdvances}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Monto total adelantos:</span>
                        <span className="font-medium">${billingData.currentMonthAdvances.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Comisión promedio:</span>
                        <span className="font-medium">{reportData.averageFeeRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm font-medium">Total comisiones:</span>
                        <span className="font-bold text-lg">${billingData.currentMonthFees.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Tarifas de Registro</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Empleados registrados:</span>
                        <span className="font-medium">{employeeFees.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Tarifa por empleado:</span>
                        <span className="font-medium">$1.00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Empleados activos:</span>
                        <span className="font-medium">{companyData.activeEmployees}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm font-medium">Total tarifas:</span>
                        <span className="font-bold text-lg">${billingData.currentMonthRegistrationFees.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-hero p-6 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Total a Pagar</div>
                      <div className="text-3xl font-bold">${billingData.totalOutstanding.toFixed(2)}</div>
                      <div className="text-sm">Vence: {billingData.nextDueDate}</div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => generateInvoice({
                          invoiceNumber: 'INV-2024-003',
                          period: 'Enero 2024',
                          dueDate: billingData.nextDueDate,
                          advanceFees: billingData.currentMonthFees,
                          registrationFees: billingData.currentMonthRegistrationFees,
                          amount: billingData.totalOutstanding
                        })}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar Factura
                      </Button>
                      <Button variant="premium">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Pagar Ahora
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
                  <span>Historial de Pagos</span>
                </CardTitle>
                <CardDescription>
                  Facturas y pagos recientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {billingData.paymentHistory.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-muted-foreground">{invoice.period}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-semibold">${invoice.amount.toFixed(2)}</div>
                          <Badge 
                            className={invoice.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                            }
                          >
                            {invoice.status === 'paid' ? 'Pagado' : 'Pendiente'}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => generateInvoice(invoice)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.status === 'pending' && (
                            <Button variant="premium" size="sm">
                              Pagar
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
                  <span>Métodos de Pago</span>
                </CardTitle>
                <CardDescription>
                  Configuración de pagos y facturación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Información de Facturación</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Empresa:</span>
                        <span className="text-sm font-medium">{company?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">RIF:</span>
                        <span className="text-sm font-medium">{company?.rif || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Período de facturación:</span>
                        <span className="text-sm font-medium">Quincenal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Método de pago:</span>
                        <span className="text-sm font-medium">Transferencia bancaria</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Próximos Pagos</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Próxima factura:</span>
                        <span className="text-sm font-medium">{billingData.nextDueDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Monto estimado:</span>
                        <span className="text-sm font-medium">${billingData.totalOutstanding.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Días restantes:</span>
                        <span className="text-sm font-medium">
                          {Math.ceil((new Date(billingData.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días
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
              <span>Editar Empleado</span>
            </DialogTitle>
            <DialogDescription>
              Modifica la información del empleado {editingEmployee?.first_name} {editingEmployee?.last_name}.
            </DialogDescription>
          </DialogHeader>
          <EmployeeInfoForm 
            onSave={handleUpdateEmployee}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setEditingEmployee(null);
            }}
            isLoading={isLoading}
            {...(editingEmployee ? {
              initialData: {
                firstName: editingEmployee.first_name,
                lastName: editingEmployee.last_name,
                email: editingEmployee.email,
                phone: editingEmployee.phone || '',
                cedula: editingEmployee.cedula || '',
                birthDate: editingEmployee.birth_date ? new Date(editingEmployee.birth_date) : null,
                yearOfEmployment: editingEmployee.year_of_employment,
                position: editingEmployee.position,
                department: editingEmployee.department || '',
                employmentStartDate: editingEmployee.employment_start_date ? new Date(editingEmployee.employment_start_date) : null,
                employmentType: editingEmployee.employment_type,
                weeklyHours: editingEmployee.weekly_hours,
                monthlySalary: editingEmployee.monthly_salary,
                livingExpenses: editingEmployee.living_expenses,
                dependents: editingEmployee.dependents,
                emergencyContact: editingEmployee.emergency_contact,
                emergencyPhone: editingEmployee.emergency_phone,
                address: editingEmployee.address,
                city: editingEmployee.city,
                state: editingEmployee.state,
                postalCode: editingEmployee.postal_code || '',
                bankName: editingEmployee.bank_name,
                accountNumber: editingEmployee.account_number,
                accountType: editingEmployee.account_type,
                notes: editingEmployee.notes || ''
              }
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
              Aprobar Adelanto
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres aprobar este adelanto de{" "}
              <span className="font-semibold">
                ${advanceToAction?.requested_amount.toFixed(2)}
              </span>{" "}
              para{" "}
              <span className="font-semibold">
                {advanceToAction?.employees ? `${advanceToAction.employees.first_name} ${advanceToAction.employees.last_name}` : 'el empleado'}
              </span>?
              <br />
              <br />
              Esta acción cambiará el estado del adelanto a "Aprobado".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={cancelApproveAction}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmApproveAdvance}
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Sí, aprobar
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
              Rechazar Adelanto
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres rechazar este adelanto de{" "}
              <span className="font-semibold">
                ${advanceToAction?.requested_amount.toFixed(2)}
              </span>{" "}
              para{" "}
              <span className="font-semibold">
                {advanceToAction?.employees ? `${advanceToAction.employees.first_name} ${advanceToAction.employees.last_name}` : 'el empleado'}
              </span>?
              <br />
              <br />
              <span className="text-destructive font-medium">
                Esta acción cambiará el estado del adelanto a "Fallido" y no se puede deshacer.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={cancelRejectAction}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRejectAdvance}
              className="flex-1 sm:flex-none"
            >
              <X className="h-4 w-4 mr-2" />
              Sí, rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyDashboard;