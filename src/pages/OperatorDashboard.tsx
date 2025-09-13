import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Download, 
  Filter,
  Search,
  Calendar,
  Banknote,
  CheckSquare,
  Square,
  Check,
  Eye,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const OperatorDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>("pending");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAdvances, setPendingAdvances] = useState<any[]>([]);
  const [processedBatches, setProcessedBatches] = useState<any[]>([]);
  const [isLoadingAdvances, setIsLoadingAdvances] = useState(true);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [selectedAdvances, setSelectedAdvances] = useState<Set<string>>(new Set());
  const [showBatchDetail, setShowBatchDetail] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [batchAdvances, setBatchAdvances] = useState<any[]>([]);
  const [isLoadingBatchAdvances, setIsLoadingBatchAdvances] = useState(false);
  
  // Pagination state
  const [pendingPage, setPendingPage] = useState(1);
  const [batchesPage, setBatchesPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Dynamic items per page

  // Calculate totals from real data
  const totalPendingAmount = pendingAdvances.reduce((sum, advance) => sum + (advance.requested_amount || 0), 0);
  const totalPendingFees = pendingAdvances.reduce((sum, advance) => sum + (advance.fee_amount || 0), 0);

  // Calculate totals for selected advances only
  const selectedAdvancesList = pendingAdvances.filter(advance => selectedAdvances.has(advance.id));
  const selectedAmount = selectedAdvancesList.reduce((sum, advance) => sum + (advance.requested_amount || 0), 0);
  const selectedFees = selectedAdvancesList.reduce((sum, advance) => sum + (advance.fee_amount || 0), 0);

  // Selection handlers
  const toggleAdvanceSelection = (advanceId: string) => {
    setSelectedAdvances(prev => {
      const newSet = new Set(prev);
      if (newSet.has(advanceId)) {
        newSet.delete(advanceId);
      } else {
        newSet.add(advanceId);
      }
      return newSet;
    });
  };

  const selectAllAdvances = () => {
    setSelectedAdvances(new Set(pendingAdvances.map(advance => advance.id)));
  };

  const deselectAllAdvances = () => {
    setSelectedAdvances(new Set());
  };

  const isAllSelected = selectedAdvances.size === pendingAdvances.length && pendingAdvances.length > 0;
  const isPartiallySelected = selectedAdvances.size > 0 && selectedAdvances.size < pendingAdvances.length;

  // Pagination calculations
  const totalPendingPages = Math.ceil(pendingAdvances.length / itemsPerPage);
  const totalBatchesPages = Math.ceil(processedBatches.length / itemsPerPage);
  
  const paginatedPendingAdvances = pendingAdvances.slice(
    (pendingPage - 1) * itemsPerPage,
    pendingPage * itemsPerPage
  );
  
  const paginatedProcessedBatches = processedBatches.slice(
    (batchesPage - 1) * itemsPerPage,
    batchesPage * itemsPerPage
  );

  // Pagination handlers
  const handlePendingPageChange = (page: number) => {
    setPendingPage(page);
  };

  const handleBatchesPageChange = (page: number) => {
    setBatchesPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    const newValue = parseInt(newItemsPerPage);
    setItemsPerPage(newValue);
    // Reset to first page when changing items per page
    setPendingPage(1);
    setBatchesPage(1);
  };

  // Pagination component
  const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    itemsPerPage,
    onItemsPerPageChange,
    className = "" 
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    onItemsPerPageChange: (value: string) => void;
    className?: string;
  }) => {
    // Always show pagination if there are items, even if only 1 page
    if (totalPages < 1) return null;

    const getVisiblePages = () => {
      // If only 1 page, just show that page
      if (totalPages === 1) {
        return [1];
      }

      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Mostrar:</span>
            <Select value={itemsPerPage.toString()} onValueChange={onItemsPerPageChange}>
              <SelectTrigger className="w-20 h-8">
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
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {getVisiblePages().map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className="w-8 h-8 p-0"
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Handle batch detail
  const handleBatchClick = async (batch: any) => {
    setSelectedBatch(batch);
    setShowBatchDetail(true);
    await fetchBatchAdvances(batch.id);
  };

  const fetchBatchAdvances = async (batchId: string) => {
    try {
      setIsLoadingBatchAdvances(true);
      
      const { data, error } = await supabase
        .from("advance_transactions")
        .select(`
          *,
          employees (
            first_name,
            last_name,
            email
          ),
          companies (
            name
          )
        `)
        .eq("batch_id", batchId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(`Error al cargar adelantos del lote: ${error.message}`);
      }

      setBatchAdvances(data || []);
    } catch (error: any) {
      console.error("Error fetching batch advances:", error);
      toast({
        title: "Error",
        description: error?.message ?? "No se pudieron cargar los adelantos del lote",
        variant: "destructive"
      });
    } finally {
      setIsLoadingBatchAdvances(false);
    }
  };

  // Fetch pending advances (approved advances ready for processing)
  const fetchPendingAdvances = async () => {
    try {
      setIsLoadingAdvances(true);
      console.log("Fetching pending advances...");
      
      const { data, error } = await supabase
        .from("advance_transactions")
        .select(`
          *,
          employees (
            first_name,
            last_name,
            email
          ),
          companies (
            name
          )
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: true });

      console.log("Pending advances query result:", { data, error });

      if (error) {
        console.error("Supabase error:", error);
        if (error.message.includes("Could not find the table")) {
          toast({
            title: "Tabla no encontrada",
            description: "La tabla 'advance_transactions' no existe. Ejecuta el script SQL para crearla.",
            variant: "destructive"
          });
        } else {
          throw new Error(`Error al cargar adelantos pendientes: ${error.message}`);
        }
        return;
      }

      console.log("Setting pending advances:", data);
      setPendingAdvances(data || []);
    } catch (error: any) {
      console.error("Error fetching pending advances:", error);
      toast({
        title: "Error",
        description: error?.message ?? "No se pudieron cargar los adelantos pendientes",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAdvances(false);
    }
  };

  // Fetch processed batches
  const fetchProcessedBatches = async () => {
    try {
      setIsLoadingBatches(true);
      console.log("Fetching processed batches...");
      
      const { data, error } = await supabase
        .from("processing_batches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      console.log("Processed batches query result:", { data, error });

      if (error) {
        console.error("Supabase error:", error);
        if (error.message.includes("Could not find the table")) {
          toast({
            title: "Tabla no encontrada",
            description: "La tabla 'processing_batches' no existe. Ejecuta el script SQL para crearla.",
            variant: "destructive"
          });
        } else {
          throw new Error(`Error al cargar lotes procesados: ${error.message}`);
        }
        return;
      }

      console.log("Setting processed batches:", data);
      setProcessedBatches(data || []);
    } catch (error: any) {
      console.error("Error fetching processed batches:", error);
      toast({
        title: "Error",
        description: error?.message ?? "No se pudieron cargar los lotes procesados",
        variant: "destructive"
      });
    } finally {
      setIsLoadingBatches(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchPendingAdvances();
    fetchProcessedBatches();
  }, []);

  const processBatch = async () => {
    if (selectedAdvances.size === 0) {
      toast({
        title: "No hay adelantos seleccionados",
        description: "Selecciona al menos un adelanto para procesar",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create a new processing batch
      const { data: batchData, error: batchError } = await supabase
        .from("processing_batches")
        .insert({
          batch_name: `Lote ${new Date().toISOString().slice(0, 10)} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
          total_amount: selectedAmount,
          total_fees: selectedFees,
          advance_count: selectedAdvances.size,
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) {
        throw new Error(`Error al crear lote: ${batchError.message}`);
      }

      // Update selected advances to processing status
      const advanceIds = Array.from(selectedAdvances);
      const { error: updateError } = await supabase
        .from("advance_transactions")
        .update({ 
          status: 'processing',
          batch_id: batchData.id,
          updated_at: new Date().toISOString()
        })
        .in('id', advanceIds);

      if (updateError) {
        throw new Error(`Error al actualizar adelantos: ${updateError.message}`);
      }

      // Update batch status to completed
      const { error: completeError } = await supabase
        .from("processing_batches")
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', batchData.id);

      if (completeError) {
        throw new Error(`Error al completar lote: ${completeError.message}`);
      }

      // Update all advances in the batch to completed status
      const { error: completeAdvancesError } = await supabase
        .from("advance_transactions")
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', advanceIds);

      if (completeAdvancesError) {
        throw new Error(`Error al completar adelantos: ${completeAdvancesError.message}`);
      }

      toast({
        title: "Lote procesado",
        description: `${selectedAdvances.size} adelantos procesados exitosamente`,
      });

      // Clear selections and refresh data
      setSelectedAdvances(new Set());
      await fetchPendingAdvances();
      await fetchProcessedBatches();

    } catch (error: any) {
      console.error("Error processing batch:", error);
      toast({
        title: "Error",
        description: error?.message ?? "No se pudo procesar el lote",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadConfirmation = async () => {
    toast({
      title: "Confirmación subida",
      description: "Los comprobantes de transferencia han sido registrados",
    });
  };

  // Debug user info
  useEffect(() => {
    if (user) {
      console.log("Current user:", user);
      console.log("User metadata:", user.user_metadata);
      console.log("App metadata:", user.app_metadata);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      {/* Debug Info */}
      {user && (
        <div className="bg-yellow-100 border border-yellow-300 p-2 text-xs">
          <strong>Debug:</strong> User: {user.email} | 
          Role: {(user.user_metadata as any)?.role || (user.app_metadata as any)?.role || 'none'} |
          ID: {user.id} |
          User Metadata: {JSON.stringify(user.user_metadata)} |
          App Metadata: {JSON.stringify(user.app_metadata)}
        </div>
      )}
      
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Panel de Operaciones</h1>
                <p className="text-sm text-muted-foreground">Procesamiento manual de adelantos</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Próximo lote: 3:00 PM</span>
              </Badge>
              <Button variant="outline" asChild>
                <a href="/">Cerrar Sesión</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Adelantos Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{pendingAdvances.length}</div>
              <p className="text-xs text-muted-foreground">
                ${totalPendingAmount.toFixed(2)} USD total
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comisiones</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">${totalPendingFees.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                5% por transacción
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lotes Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {isLoadingBatches ? '...' : processedBatches.filter(batch => {
                  if (!batch || !batch.created_at) return false;
                  const today = new Date();
                  const batchDate = new Date(batch.created_at);
                  return batchDate.toDateString() === today.toDateString();
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                11:00 AM y 3:00 PM
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Procesado</CardTitle>
              <Banknote className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">
                ${isLoadingBatches ? '...' : processedBatches.slice(0, 3).reduce((sum, batch) => sum + (batch.total_amount || 0), 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Últimos 3 lotes
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Adelantos Pendientes</TabsTrigger>
            <TabsTrigger value="batches">Lotes Procesados</TabsTrigger>
            <TabsTrigger value="confirmations">Confirmaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Adelantos Pendientes</CardTitle>
                    <CardDescription>
                      Selecciona los adelantos para procesar en el próximo lote
                    </CardDescription>
                    {selectedAdvances.size > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {selectedAdvances.size} de {pendingAdvances.length} seleccionados • 
                        Total: ${selectedAmount.toFixed(2)} • 
                        Comisiones: ${selectedFees.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtrar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                    <Button 
                      variant="hero" 
                      onClick={processBatch}
                      disabled={isProcessing || selectedAdvances.size === 0}
                    >
                      {isProcessing ? "Procesando..." : `Procesar Lote (${selectedAdvances.size})`}
                    </Button>
                  </div>
                </div>
                {pendingAdvances.length > 0 && (
                  <div className="flex items-center space-x-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isAllSelected ? deselectAllAdvances : selectAllAdvances}
                    >
                      {isAllSelected ? (
                        <>
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Deseleccionar Todo
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Seleccionar Todo
                        </>
                      )}
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      {selectedAdvances.size} de {pendingAdvances.length} adelantos seleccionados
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingAdvances ? (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3 animate-spin" />
                      <p className="text-muted-foreground">Cargando adelantos pendientes...</p>
                    </div>
                  ) : pendingAdvances.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
                      <p className="text-muted-foreground">No hay adelantos pendientes</p>
                      <p className="text-sm text-muted-foreground mt-1">Todos los adelantos han sido procesados</p>
                    </div>
                  ) : (
                    paginatedPendingAdvances.map((advance) => {
                      const employeeName = advance.employees 
                        ? `${advance.employees.first_name || ''} ${advance.employees.last_name || ''}`.trim()
                        : 'Empleado desconocido';
                      const companyName = advance.companies?.name || 'Empresa desconocida';
                      const advanceDate = new Date(advance.created_at);
                      const formattedTime = advanceDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                      
                      const isSelected = selectedAdvances.has(advance.id);
                      
                      return (
                        <div key={advance.id} className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/5 border-primary/20' : ''}`}>
                      <div className="flex items-center space-x-4">
                            <button
                              onClick={() => toggleAdvanceSelection(advance.id)}
                              className={`flex items-center justify-center w-5 h-5 border-2 rounded transition-colors ${
                                isSelected 
                                  ? 'bg-primary border-primary' 
                                  : 'border-muted-foreground bg-transparent'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </button>
                            <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {employeeName.split(' ').map(n => n[0]).join('')}
                              </span>
                        </div>
                        <div>
                              <div className="font-medium">{employeeName}</div>
                              <div className="text-sm text-muted-foreground">{companyName}</div>
                              <div className="text-xs text-muted-foreground">
                                {advance.payment_method === 'pagomovil' ? 'PagoMóvil' : 'Transferencia'}: {advance.payment_details}
                              </div>
                        </div>
                      </div>
                          <div className="flex items-center space-x-6">
                        <div className="text-right">
                              <div className="font-semibold">${advance.requested_amount.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                                Comisión: ${advance.fee_amount.toFixed(2)}
                          </div>
                              <div className="text-sm text-primary font-medium">
                                Neto: ${advance.net_amount.toFixed(2)}
                      </div>
                    </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">{formattedTime}</div>
                              <Badge variant="secondary">Aprobado</Badge>
                      </div>
                    </div>
                  </div>
                      );
                    })
                  )}
                </div>
                
                {/* Pagination for Pending Advances */}
                {pendingAdvances.length > 0 && (
                  <div className="pt-4 border-t">
                    <Pagination
                      currentPage={pendingPage}
                      totalPages={totalPendingPages}
                      onPageChange={handlePendingPageChange}
                      itemsPerPage={itemsPerPage}
                      onItemsPerPageChange={handleItemsPerPageChange}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batches" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle>Lotes Procesados</CardTitle>
                <CardDescription>
                  Historial de lotes procesados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingBatches ? (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3 animate-spin" />
                      <p className="text-muted-foreground">Cargando lotes procesados...</p>
                    </div>
                  ) : processedBatches.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                      <p className="text-muted-foreground">No hay lotes procesados</p>
                      <p className="text-sm text-muted-foreground mt-1">Los lotes procesados aparecerán aquí</p>
                    </div>
                  ) : (
                    paginatedProcessedBatches.map((batch) => {
                      const batchDate = batch.created_at ? new Date(batch.created_at) : new Date();
                      const formattedDate = batchDate.toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'short' 
                      });
                      const formattedTime = batchDate.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });
                      
                      return (
                        <div 
                          key={batch.id} 
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleBatchClick(batch)}
                        >
                      <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                              <div className="font-medium">{batch.batch_name || 'Lote sin nombre'}</div>
                              <div className="text-sm text-muted-foreground">
                                {formattedDate} - {formattedTime}
                              </div>
                        </div>
                      </div>
                          <div className="flex items-center space-x-6">
                        <div className="text-right">
                              <div className="font-semibold">{batch.advance_count || 0} adelantos</div>
                              <div className="text-sm text-muted-foreground">
                                Total: ${(batch.total_amount || 0).toFixed(2)}
                              </div>
                        </div>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-green-100 text-green-800">
                                {batch.status === 'completed' ? 'Completado' : batch.status || 'Desconocido'}
                              </Badge>
                              <Button variant="outline" size="sm" onClick={(e) => {
                                e.stopPropagation();
                                handleBatchClick(batch);
                              }}>
                                <Eye className="h-4 w-4 mr-1" />
                                Ver Detalles
                              </Button>
                            </div>
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>
                
                {/* Pagination for Processed Batches */}
                {processedBatches.length > 0 && (
                  <div className="pt-4 border-t">
                    <Pagination
                      currentPage={batchesPage}
                      totalPages={totalBatchesPages}
                      onPageChange={handleBatchesPageChange}
                      itemsPerPage={itemsPerPage}
                      onItemsPerPageChange={handleItemsPerPageChange}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="confirmations" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Confirmar Transferencias</CardTitle>
                    <CardDescription>
                      Subir comprobantes de transferencias realizadas
                    </CardDescription>
                  </div>
                  <Button variant="hero" onClick={uploadConfirmation}>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Comprobantes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Subir Comprobantes</h3>
                    <p className="text-muted-foreground mb-4">
                      Sube los comprobantes de las transferencias realizadas para confirmar los pagos
                    </p>
                    <Button variant="outline">
                      Seleccionar Archivos
                    </Button>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Instrucciones:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Sube comprobantes de PagoMóvil o transferencias bancarias</li>
                      <li>• Los archivos deben estar en formato PDF o imagen</li>
                      <li>• Cada comprobante debe corresponder a un adelanto específico</li>
                      <li>• El sistema marcará automáticamente los adelantos como completados</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Batch Detail Modal */}
        <Dialog open={showBatchDetail} onOpenChange={setShowBatchDetail}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Detalles del Lote</span>
              </DialogTitle>
              <DialogDescription>
                {selectedBatch?.batch_name || 'Lote sin nombre'} - {selectedBatch?.created_at ? new Date(selectedBatch.created_at).toLocaleString('es-ES') : ''}
              </DialogDescription>
            </DialogHeader>
            
            {selectedBatch && (
              <div className="space-y-6">
                {/* Batch Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{selectedBatch.advance_count || 0}</div>
                    <div className="text-sm text-muted-foreground">Adelantos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">${(selectedBatch.total_amount || 0).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Bruto</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">${(selectedBatch.total_fees || 0).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Comisiones</div>
                  </div>
                </div>

                {/* Advances List */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Adelantos del Lote</h3>
                  {isLoadingBatchAdvances ? (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3 animate-spin" />
                      <p className="text-muted-foreground">Cargando adelantos...</p>
                    </div>
                  ) : batchAdvances.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                      <p className="text-muted-foreground">No se encontraron adelantos para este lote</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {batchAdvances.map((advance) => {
                        const employeeName = advance.employees 
                          ? `${advance.employees.first_name || ''} ${advance.employees.last_name || ''}`.trim()
                          : 'Empleado desconocido';
                        const companyName = advance.companies?.name || 'Empresa desconocida';
                        const advanceDate = new Date(advance.created_at);
                        const formattedTime = advanceDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                        
                        return (
                          <div key={advance.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 bg-gradient-primary rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-medium">
                                  {employeeName.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-sm">{employeeName}</div>
                                <div className="text-xs text-muted-foreground">{companyName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {advance.payment_method === 'pagomovil' ? 'PagoMóvil' : 'Transferencia'}: {advance.payment_details}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <div className="font-semibold text-sm">${advance.requested_amount.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">
                                  Comisión: ${advance.fee_amount.toFixed(2)}
                                </div>
                                <div className="text-xs text-primary font-medium">
                                  Neto: ${advance.net_amount.toFixed(2)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">{formattedTime}</div>
                                <Badge variant="secondary" className="text-xs">
                                  {advance.status === 'completed' ? 'Completado' : advance.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OperatorDashboard;