import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmployeeInfoForm } from "@/components/EmployeeInfoForm";
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
      
      // Insert employee data into employees table
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .insert([{
          auth_user_id: null, // Will be set when employee activates account
          company_id: companyData.id,
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
      
      // TODO: Send activation code via email/SMS
      // await supabase.functions.invoke('send-activation-code', { 
      //   email: employeeInfo.email, 
      //   activationCode: activationCode,
      //   employeeName: `${employeeInfo.firstName} ${employeeInfo.lastName}`
      // });
      
      toast({
        title: "Empleado agregado exitosamente",
        description: `Se ha enviado un código de activación (${activationCode}) a ${employeeInfo.email}`,
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{companyData.name}</h1>
                <p className="text-sm text-muted-foreground">{t('company.panel')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" asChild>
                <Link to="/company/configuration">
                  <Settings className="h-4 w-4 mr-2" />
                  {t('company.configuration')}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">{t('dashboard.logout')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>{t('company.advanceReport')}</span>
                  </CardTitle>
                  <CardDescription>
                    {t('company.downloadReport')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{t('company.period')} Enero 2024</div>
                    <div className="text-sm text-muted-foreground">
                      {t('company.includesAll')}
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    {t('company.downloadCSV')}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>{t('company.usageAnalysis')}</span>
                  </CardTitle>
                  <CardDescription>
                    {t('company.usageStats')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{t('company.monthlyAverage')} $294</div>
                    <div className="text-sm text-muted-foreground">
                      78% {t('company.employeesUse')}
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    {t('company.viewFullReport')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle>{t('company.billingPayments')}</CardTitle>
                <CardDescription>
                  {t('company.manageBills')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gradient-hero p-6 rounded-lg">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">{t('company.nextInvoice')}</div>
                      <div className="text-2xl font-bold">${companyData.weeklyBilling}</div>
                      <div className="text-sm">{t('company.due')} 15 Enero, 2024</div>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-6 rounded-lg">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">{t('company.monthlyCommissions')}</div>
                      <div className="text-2xl font-bold">${companyData.monthlyFees}</div>
                      <div className="text-sm">{companyData.activeEmployees} {t('company.activeEmployeesCount')}</div>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-6 rounded-lg">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">{t('company.totalYear')}</div>
                      <div className="text-2xl font-bold">$126,340</div>
                      <div className="text-sm">+15% {t('company.vsPreviousYear')}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">{t('company.recentInvoices')}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{t('company.invoice')} #2024-001</div>
                        <div className="text-sm text-muted-foreground">1-7 Enero, 2024</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-semibold">$11,890</div>
                          <Badge className="bg-green-100 text-green-800">{t('company.paid')}</Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{t('company.invoice')} #2024-002</div>
                        <div className="text-sm text-muted-foreground">8-14 Enero, 2024</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-semibold">$12,430</div>
                          <Badge variant="secondary">{t('common.pending')}</Badge>
                        </div>
                        <Button variant="premium" size="sm">
                          Pagar Ahora
                        </Button>
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