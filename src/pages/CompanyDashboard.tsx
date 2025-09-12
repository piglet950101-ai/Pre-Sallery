import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  RefreshCw
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

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
  // Mock data (will be replaced with real data later)
  const companyData = {
    name: "Empresa Ejemplo C.A.",
    rif: "J-12345678-9",
    activeEmployees: employees.filter(emp => emp.is_active).length,
    totalAdvances: 45860,
    pendingAdvances: 8,
    monthlyFees: 156,
    weeklyBilling: 12430
  };

  const recentAdvances = [
    { id: 1, employee: "María González", amount: 200, status: "approved", date: "Hoy, 10:30 AM" },
    { id: 2, employee: "Carlos Rodríguez", amount: 150, status: "pending", date: "Hoy, 09:15 AM" },
    { id: 3, employee: "Ana Martínez", amount: 300, status: "completed", date: "Ayer, 14:20 PM" },
    { id: 4, employee: "Luis Pérez", amount: 180, status: "completed", date: "Ayer, 11:45 AM" },
  ];

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
        
        // Get company ID from companies table
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();
        
        if (companyError || !companyData) {
          throw new Error("No se encontró la información de la empresa");
        }
        
        companyId = companyData.id;
        
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
    
    // Cleanup subscription on unmount
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
              <div className="text-2xl font-bold text-primary">{companyData.activeEmployees}</div>
              <p className="text-xs text-muted-foreground">
                ${companyData.monthlyFees} {t('company.monthlyFees')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('company.advancesThisMonth')}</CardTitle>
              <DollarSign className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${companyData.totalAdvances}</div>
              <p className="text-xs text-muted-foreground">
                +12% {t('company.vsLastMonth')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('common.pending')}</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companyData.pendingAdvances}</div>
              <p className="text-xs text-muted-foreground">
                {t('company.pendingApproval')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('company.weeklyBilling')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${companyData.weeklyBilling}</div>
              <p className="text-xs text-muted-foreground">
                {t('company.nextBill')} 15 Jan
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
                  <div>
                    <CardTitle>{t('company.recentAdvances')}</CardTitle>
                    <CardDescription>
                      {t('company.manageAdvances')}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      {t('company.filter')}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {t('employee.export')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAdvances.map((advance) => (
                    <div key={advance.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {advance.employee.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{advance.employee}</div>
                          <div className="text-sm text-muted-foreground">{advance.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-semibold">${advance.amount}</div>
                          <div className="text-sm text-muted-foreground">{t('company.request')}</div>
                        </div>
                        <div className="flex space-x-2">
                          {advance.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline">{t('company.reject')}</Button>
                              <Button size="sm" variant="premium">{t('company.approve')}</Button>
                            </>
                          )}
                          {advance.status === 'approved' && (
                            <Badge className="bg-blue-100 text-blue-800">{t('company.approved')}</Badge>
                          )}
                          {advance.status === 'completed' && (
                            <Badge className="bg-green-100 text-green-800">{t('employee.completed')}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
    </div>
  );
};

export default CompanyDashboard;