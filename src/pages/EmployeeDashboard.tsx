import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { AdvanceRequestForm } from "@/components/AdvanceRequestForm";
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
  ChevronRight
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
  is_active: boolean;
  is_verified: boolean;
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
  const { t } = useLanguage();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [advanceToCancel, setAdvanceToCancel] = useState<AdvanceRequest | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [filteredAdvanceRequests, setFilteredAdvanceRequests] = useState<AdvanceRequest[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Calculate derived data
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const workedDays = Math.min(22, daysInMonth); // Assuming 22 working days per month
  const totalDays = daysInMonth;
  
  const monthlySalary = employee?.monthly_salary || 0;
  const earnedAmount = Math.round(((monthlySalary / totalDays) * workedDays) * 100) / 100;
  
  // Calculate used amount from all non-cancelled advances (completed, pending, processing, approved)
  const usedAmount = Math.round(advanceRequests
    .filter(req => req.status !== 'cancelled' && req.status !== 'failed')
    .reduce((sum, req) => sum + req.requested_amount, 0) * 100) / 100;
  
  // Available amount is 80% of earned amount minus already used advances
  const maxAvailableAmount = Math.round((earnedAmount * 0.8) * 100) / 100;
  const availableAmount = Math.max(0, maxAvailableAmount - usedAmount);
  const pendingAdvances = advanceRequests.filter(req => 
    req.status === 'pending' || req.status === 'processing'
  ).length;

  const progressPercentage = (workedDays / totalDays) * 100;

  // Fetch employee data and advance requests
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("Usuario no autenticado");
        }

        // Get employee data
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select("*")
          .eq("auth_user_id", user.id)
          .single();

        if (employeeError) {
          throw new Error(`Error al cargar datos del empleado: ${employeeError.message}`);
        }

        setEmployee(employeeData);

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
  }, [toast]);

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
        throw new Error(`Error al cancelar el adelanto: ${updateError.message}`);
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
      [t('common.paymentMethod')]: request.payment_method === 'pagomovil' ? 'PagoMóvil' : 'Bank Transfer',
      [t('common.paymentDetails')]: request.payment_details,
      [t('common.batch')]: request.batch_id || 'N/A',
      [t('common.processedAt')]: request.processed_at ? format(new Date(request.processed_at), 'dd/MM/yyyy HH:mm') : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-8 space-y-8">
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

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('employee.monthlySalary')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${monthlySalary.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {t('employee.daysWorked').replace('{worked}', workedDays.toString()).replace('{total}', totalDays.toString())}
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
                      <span>{workedDays} / {totalDays} {t('employee.days')}</span>
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

                {/* Request Form */}
                <AdvanceRequestForm 
                  employeeData={{
                    name: employeeName,
                    monthlySalary,
                    earnedAmount,
                    availableAmount,
                    usedAmount,
                    workedDays,
                    totalDays
                  }}
                  onAdvanceSubmitted={refreshData}
                  existingAdvanceRequests={advanceRequests}
                />
              </CardContent>
            </Card>

            <Card className="border-none shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary" />
                  <span>{t('employee.advanceHistory')}</span>
                    <Badge variant="secondary" className="ml-2">
                      {filteredAdvanceRequests.length} solicitudes
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
                    <Label className="text-sm font-medium">Desde:</Label>
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
                      const isCompleted = request.status === 'completed';
                      const isPending = request.status === 'pending' || request.status === 'processing';
                      const isApproved = request.status === 'approved';
                      
                      const getStatusBadge = () => {
                        switch (request.status) {
                          case 'completed':
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
                        } else {
                          return "bg-red-100";
                        }
                      };

                      const getPaymentMethodText = () => {
                        return request.payment_method === 'pagomovil' ? 'PagoMóvil' : 'Bank Transfer';
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
                                    ? `${t('employee.today')}, ${requestDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                                    : requestDate.toLocaleDateString('es-ES', { 
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
                                <span className="text-primary font-medium">${request.net_amount.toFixed(2)}</span> neto
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
                                <span>Lote: {request.batch_id}</span>
                              )}
                              {request.processed_at && (
                                <span>
                                  Procesado: {new Date(request.processed_at).toLocaleDateString('es-ES', {
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
                      <div className="font-medium">PagoMóvil</div>
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
                    {new Date(currentYear, currentMonth + 1, 0).toLocaleDateString('es-ES', { 
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
              {t('employee.keep')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelAdvance}
              className="flex-1 sm:flex-none"
            >
              <X className="h-4 w-4 mr-2" />
              {t('employee.yesCancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default EmployeeDashboard;