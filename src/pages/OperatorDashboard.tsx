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
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileText,
  Image,
  File,
  RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

const OperatorDashboard = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
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
  
  // Confirmations state
  const [confirmations, setConfirmations] = useState<any[]>([]);
  const [isLoadingConfirmations, setIsLoadingConfirmations] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // Confirmations management state
  const [confirmationsPage, setConfirmationsPage] = useState(1);
  const [confirmationsSearch, setConfirmationsSearch] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationToDelete, setConfirmationToDelete] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  
  // Employee fees state
  const [employeeFees, setEmployeeFees] = useState<any[]>([]);
  const [isLoadingEmployeeFees, setIsLoadingEmployeeFees] = useState(false);

  // Calculate totals from real data
  const totalPendingAmount = pendingAdvances.reduce((sum, advance) => sum + (advance.requested_amount || 0), 0);
  const totalPendingFees = pendingAdvances.reduce((sum, advance) => sum + (advance.fee_amount || 0), 0);
  
  // Calculate employee registration fees
  const totalEmployeeRegistrationFees = employeeFees.reduce((sum, fee) => sum + (fee.fee_amount || 0), 0);
  const pendingEmployeeFees = employeeFees.filter(fee => fee.status === 'pending').length;
  const paidEmployeeFees = employeeFees.filter(fee => fee.status === 'paid').length;

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

  // Confirmations search and pagination
  const filteredConfirmations = confirmations.filter(confirmation => 
    confirmation.file_name?.toLowerCase().includes(confirmationsSearch.toLowerCase()) ||
    confirmation.processing_batches?.batch_name?.toLowerCase().includes(confirmationsSearch.toLowerCase()) ||
    confirmation.status?.toLowerCase().includes(confirmationsSearch.toLowerCase())
  );
  
  const totalConfirmationsPages = Math.ceil(filteredConfirmations.length / itemsPerPage);
  const paginatedConfirmations = filteredConfirmations.slice(
    (confirmationsPage - 1) * itemsPerPage,
    confirmationsPage * itemsPerPage
  );

  // Pagination handlers
  const handlePendingPageChange = (page: number) => {
    setPendingPage(page);
  };

  const handleBatchesPageChange = (page: number) => {
    setBatchesPage(page);
  };

  const handleConfirmationsPageChange = (page: number) => {
    setConfirmationsPage(page);
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
            {t('common.page')} {currentPage} {t('common.of')} {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">{t('common.show')}:</span>
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
        title: t('common.error'),
        description: error?.message ?? t('company.billing.couldNotLoadPayments'),
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
            title: t('common.error'),
            description: 'advance_transactions table missing',
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
        title: t('common.error'),
        description: error?.message ?? t('company.billing.couldNotLoadEmployees'),
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
            title: t('common.error'),
            description: 'processing_batches table missing',
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
        title: t('common.error'),
        description: error?.message ?? t('company.billing.couldNotLoadPayments'),
        variant: "destructive"
      });
    } finally {
      setIsLoadingBatches(false);
    }
  };

  // Add a flag to prevent unnecessary re-fetching
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Load data on component mount - only once
  useEffect(() => {
    if (!hasInitialLoad) {
      fetchPendingAdvances();
      fetchProcessedBatches();
      fetchConfirmations();
      fetchEmployeeFees();
      setHasInitialLoad(true);
    }
  }, [hasInitialLoad]);

  // Manual refresh function
  const refreshData = async () => {
    await Promise.all([
      fetchPendingAdvances(),
      fetchProcessedBatches(),
      fetchConfirmations(),
      fetchEmployeeFees()
    ]);
  };

  const processBatch = async () => {
    if (selectedAdvances.size === 0) {
      toast({
        title: t('common.noData'),
        description: t('operator.selectAdvancesToProcess'),
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
          batch_name: `Batch ${new Date().toISOString().slice(0, 10)} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
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
        title: t('common.success'),
        description: `${selectedAdvances.size} ${t('company.advances')} ${t('employee.completed')}`,
      });

      // Clear selections and refresh data
      setSelectedAdvances(new Set());
      await fetchPendingAdvances();
      await fetchProcessedBatches();

    } catch (error: any) {
      console.error("Error processing batch:", error);
      toast({
        title: t('common.error'),
        description: error?.message ?? 'Could not process batch',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch employee fees
  const fetchEmployeeFees = async () => {
    try {
      setIsLoadingEmployeeFees(true);
      console.log("🔍 Fetching employee fees...");
      
      const { data, error } = await supabase
        .from("employee_fees")
        .select(`
          *,
          employees!inner(
            first_name,
            last_name,
            email
          ),
          companies!inner(
            name,
            rif
          )
        `)
        .order("created_at", { ascending: false });

      console.log("📊 Employee fees fetch result:", { data, error });

      if (error) {
        if (error.message.includes("Could not find the table")) {
          console.log("❌ Employee fees table not found, showing empty state");
          setEmployeeFees([]);
          return;
        }
        console.error("❌ Database error:", error);
        throw new Error(`Error al cargar tarifas de empleados: ${error.message}`);
      }

      console.log("✅ Employee fees loaded:", data?.length || 0, "items");
      setEmployeeFees(data || []);
    } catch (error: any) {
      console.error("❌ Error fetching employee fees:", error);
      if (!error.message.includes("Could not find the table")) {
        toast({
          title: t('common.error'),
          description: error?.message ?? t('company.billing.couldNotLoadEmployees'),
          variant: "destructive"
        });
      }
      setEmployeeFees([]);
    } finally {
      setIsLoadingEmployeeFees(false);
    }
  };

  // Fetch confirmations
  const fetchConfirmations = async () => {
    try {
      setIsLoadingConfirmations(true);
      console.log("🔍 Fetching confirmations...");
      
      // Try to fetch from transfer_confirmations table
      const { data, error } = await supabase
        .from("transfer_confirmations")
        .select(`
          *,
          processing_batches (
            batch_name,
            created_at
          )
        `)
        .order("created_at", { ascending: false });

      console.log("📊 Confirmations fetch result:", { data, error });

      if (error) {
        // If table doesn't exist, show empty state instead of error
        if (error.message.includes("Could not find the table")) {
          console.log("❌ Transfer confirmations table not found, showing empty state");
          setConfirmations([]);
          return;
        }
        console.error("❌ Database error:", error);
        throw new Error(`Error al cargar confirmaciones: ${error.message}`);
      }

      console.log("✅ Confirmations loaded:", data?.length || 0, "items");
      console.log("📊 Sample confirmation data:", data?.[0]);
      setConfirmations(data || []);
    } catch (error: any) {
      console.error("❌ Error fetching confirmations:", error);
      // Don't show error toast for missing table, just log it
      if (!error.message.includes("Could not find the table")) {
        toast({
          title: t('common.error'),
          description: error?.message ?? 'Could not load confirmations',
          variant: "destructive"
        });
      }
      setConfirmations([]);
    } finally {
      setIsLoadingConfirmations(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  // Upload confirmations
  const uploadConfirmation = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: t('common.noData'),
        description: 'Select at least one file to upload',
        variant: "destructive"
      });
      return;
    }

    setUploadingFiles(true);
    
    try {
      const uploadedFiles = [];
      
      // Upload each file to Supabase Storage
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `confirmations/${fileName}`;
        
        console.log("📤 Uploading file to Supabase Storage:", filePath);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('transfer-confirmations')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("❌ Upload error:", uploadError);
          throw new Error(`Error al subir ${file.name}: ${uploadError.message}`);
        }

        console.log("✅ File uploaded successfully:", uploadData);
        
        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('transfer-confirmations')
          .getPublicUrl(filePath);

        uploadedFiles.push({
          file_name: file.name,
          file_path: filePath,
          file_url: urlData.publicUrl,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user?.id,
          status: 'uploaded'
        });
      }
      
      // Insert confirmations into database
      try {
        console.log("💾 Inserting confirmations:", uploadedFiles);

        const { data: insertData, error: insertError } = await supabase
          .from("transfer_confirmations")
          .insert(uploadedFiles)
          .select();

        if (insertError) {
          console.log("❌ Could not insert into transfer_confirmations table:", insertError.message);
          throw new Error(`Error al guardar en base de datos: ${insertError.message}`);
        } else {
          console.log("✅ Confirmations inserted successfully:", insertData);
        }
      } catch (dbError: any) {
        console.log("❌ Database error during upload:", dbError);
        throw new Error(`Error al guardar en base de datos: ${dbError.message}`);
      }
      
    toast({
      title: t('common.success'),
      description: `${selectedFiles.length} uploaded`,
    });

      setSelectedFiles([]);
      setShowUploadModal(false);
      await fetchConfirmations();
    } catch (error: any) {
      console.error("Error uploading confirmations:", error);
      toast({
        title: t('common.error'),
        description: error?.message ?? 'Could not upload files',
        variant: "destructive"
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  // Delete confirmation
  const deleteConfirmation = async (confirmationId: string) => {
    try {
      // First get the confirmation to get the file path
      const { data: confirmation, error: fetchError } = await supabase
        .from("transfer_confirmations")
        .select("file_path")
        .eq("id", confirmationId)
        .single();

      if (fetchError) {
        throw new Error(`Error al obtener confirmación: ${fetchError.message}`);
      }

      // Delete file from Supabase Storage
      if (confirmation.file_path) {
        console.log("🗑️ Deleting file from storage:", confirmation.file_path);
        const { error: storageError } = await supabase.storage
          .from('transfer-confirmations')
          .remove([confirmation.file_path]);

        if (storageError) {
          console.warn("⚠️ Could not delete file from storage:", storageError.message);
          // Continue with database deletion even if storage deletion fails
        } else {
          console.log("✅ File deleted from storage successfully");
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("transfer_confirmations")
        .delete()
        .eq("id", confirmationId);

      if (dbError) {
        throw new Error(`Error al eliminar confirmación: ${dbError.message}`);
      }

      toast({
        title: t('common.success'),
        description: 'Confirmation deleted',
      });

      await fetchConfirmations();
    } catch (error: any) {
      console.error("Error deleting confirmation:", error);
      toast({
        title: t('common.error'),
        description: error?.message ?? 'Could not delete confirmation',
        variant: "destructive"
      });
    }
  };

  // Handle delete click
  const handleDeleteClick = (confirmation: any) => {
    setConfirmationToDelete(confirmation);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (confirmationToDelete) {
      await deleteConfirmation(confirmationToDelete.id);
      setShowDeleteModal(false);
      setConfirmationToDelete(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setConfirmationToDelete(null);
  };

  // Preview file
  const handlePreviewClick = (confirmation: any) => {
    setPreviewFile(confirmation);
    setShowPreviewModal(true);
  };

  // Download file
  const handleDownloadClick = async (confirmation: any) => {
    try {
      toast({ title: t('common.success'), description: `${t('common.downloading')} ${confirmation.file_name}` });

      // Helper to trigger a download from a Blob
      const triggerBlobDownload = (blob: Blob, fileName: string) => {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      };

      // Prefer downloading from Supabase Storage to force a real file download
      let blob: Blob | null = null;

      const inferPathFromUrl = (url: string | undefined): string | null => {
        if (!url) return null;
        try {
          const u = new URL(url);
          // Public URL usually contains /object/public/<bucket>/<path>
          const marker = '/object/public/transfer-confirmations/';
          const idx = u.pathname.indexOf(marker);
          if (idx >= 0) {
            return decodeURIComponent(u.pathname.substring(idx + marker.length));
          }
          return null;
        } catch {
          return null;
        }
      };

      const filePath = confirmation.file_path || inferPathFromUrl(confirmation.file_url);

      if (filePath) {
        const { data, error } = await supabase.storage
          .from('transfer-confirmations')
          .download(filePath);
        if (!error && data) {
          blob = data as Blob;
        }
      }

      // Fallback: try to fetch the public URL directly if blob is still null
      if (!blob && confirmation.file_url) {
        const resp = await fetch(confirmation.file_url, { credentials: 'omit', mode: 'cors' });
        if (!resp.ok) throw new Error(`Network error ${resp.status}`);
        blob = await resp.blob();
      }

      if (!blob) throw new Error('File not available for download.');

      triggerBlobDownload(blob, confirmation.file_name || 'file');
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast({
        title: t('common.error'),
        description: error?.message ?? 'Could not download file',
        variant: 'destructive'
      });
    }
  };


  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (fileType?.includes('image')) return <Image className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
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
     
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Header with Refresh Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('operator.operatorPanel')}</h1>
            <p className="text-muted-foreground">{t('operator.approvedTransfers')}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshData}
            disabled={isLoadingAdvances || isLoadingBatches || isLoadingConfirmations || isLoadingEmployeeFees}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${(isLoadingAdvances || isLoadingBatches || isLoadingConfirmations || isLoadingEmployeeFees) ? 'animate-spin' : ''}`} />
            <span>{t('company.billing.refresh')}</span>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('operator.pendingAdvances')}</CardTitle>
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
              <CardTitle className="text-sm font-medium">{t('company.reports.commissions')}</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">${totalPendingFees.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {t('operator.feeRateNote')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('operator.currentBatch')}</CardTitle>
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
              <CardTitle className="text-sm font-medium">{t('company.totalYear')}</CardTitle>
              <Banknote className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">
                ${isLoadingBatches ? '...' : processedBatches.slice(0, 3).reduce((sum, batch) => sum + (batch.total_amount || 0), 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('operator.last3Batches')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('company.billing.monthlyEmployeeFees') || 'Monthly Employee Fees'}</CardTitle>
              <Users className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                ${isLoadingEmployeeFees ? '...' : totalEmployeeRegistrationFees.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoadingEmployeeFees ? '...' : `${employeeFees.length} ${t('operator.activeEmployees') || 'active employees'}`}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">{t('operator.pendingAdvances')}</TabsTrigger>
            <TabsTrigger value="batches">{t('operator.processedBatches')}</TabsTrigger>
            <TabsTrigger value="confirmations">{t('operator.confirmationsTab')}</TabsTrigger>
            <TabsTrigger value="employee-fees">{t('operator.employeeFeesTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('operator.pendingAdvancesTitle')}</CardTitle>
                    <CardDescription>
                      {t('operator.selectAdvancesToProcess')}
                    </CardDescription>
                    {selectedAdvances.size > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {selectedAdvances.size} {t('common.of')} {pendingAdvances.length} {t('operator.pendingAdvances').toLowerCase()} • 
                        Total: ${selectedAmount.toFixed(2)} • 
                        {t('company.reports.commissions')}: ${selectedFees.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      {t('operator.filter')}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {t('operator.exportCSV')}
                    </Button>
                    <Button 
                      variant="hero" 
                      onClick={processBatch}
                      disabled={isProcessing || selectedAdvances.size === 0}
                    >
                      {isProcessing ? t('operator.processingDots') : `${t('operator.processBatch')} (${selectedAdvances.size})`}
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
                          {t('operator.selectAll')}
                        </>
                      )}
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      {selectedAdvances.size} {t('common.of')} {pendingAdvances.length} {t('operator.pendingAdvances').toLowerCase()}
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingAdvances ? (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3 animate-spin" />
                      <p className="text-muted-foreground">{t('operator.loadingPending')}</p>
                    </div>
                  ) : pendingAdvances.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
                      <p className="text-muted-foreground">{t('operator.noPending')}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t('operator.allProcessed')}</p>
                    </div>
                  ) : (
                    paginatedPendingAdvances.map((advance) => {
                      const employeeName = advance.employees 
                        ? `${advance.employees.first_name || ''} ${advance.employees.last_name || ''}`.trim()
                        : t('operator.unknownEmployee');
                      const companyName = advance.companies?.name || t('operator.unknownCompany');
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
                                {advance.payment_method === 'pagomovil' ? 'PagoMóvil' : 'Bank Transfer'}: {advance.payment_details}
                              </div>
                        </div>
                      </div>
                          <div className="flex items-center space-x-6">
                        <div className="text-right">
                              <div className="font-semibold">${advance.requested_amount.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                                {t('company.reports.commissions')}: ${advance.fee_amount.toFixed(2)}
                          </div>
                              <div className="text-sm text-primary font-medium">
                                {t('common.netAmount')}: ${advance.net_amount.toFixed(2)}
                              </div>
                    </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">{formattedTime}</div>
                              <Badge variant="secondary">{t('company.approved')}</Badge>
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
                <CardTitle>{t('operator.processedBatchesTitle')}</CardTitle>
                <CardDescription>
                  {t('operator.processedBatchesDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingBatches ? (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3 animate-spin" />
                      <p className="text-muted-foreground">{t('operator.loadingBatches')}</p>
                    </div>
                  ) : processedBatches.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                      <p className="text-muted-foreground">{t('operator.noProcessedBatches')}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t('operator.processedBatchesAppear')}</p>
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
                              <div className="font-medium">{batch.batch_name || t('operator.unnamedBatch')}</div>
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
                              {batch.status === 'completed' ? t('employee.completed') : batch.status || 'Unknown'}
                            </Badge>
                              <Button variant="outline" size="sm" onClick={(e) => {
                                e.stopPropagation();
                                handleBatchClick(batch);
                              }}>
                                <FileText className="h-4 w-4 mr-1" />
                                {t('operator.viewDetails')}
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
            {/* Upload Section */}
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('operator.uploadSectionTitle')}</CardTitle>
                    <CardDescription>
                      {t('operator.uploadSectionDesc')}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="hero" 
                    onClick={() => setShowUploadModal(true)}
                    disabled={uploadingFiles}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingFiles ? t('operator.uploadingDots') : t('operator.uploadCTAButton')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{t('operator.uploadCTATitle')}</h3>
                    <p className="text-muted-foreground mb-4">
                    {t('operator.uploadCTADesc')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Confirmations List */}
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('operator.confirmationsUploadedTitle')}</CardTitle>
                    <CardDescription>
                      {t('operator.confirmationsUploadedDesc')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('operator.searchConfirmationsPlaceholder') || 'Search confirmations...'}
                        value={confirmationsSearch}
                        onChange={(e) => setConfirmationsSearch(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingConfirmations ? (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3 animate-spin" />
                      <p className="text-muted-foreground">{t('operator.loadingConfirmations')}</p>
                    </div>
                  ) : filteredConfirmations.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        {confirmationsSearch ? t('operator.noConfirmationsSearch') : t('operator.noConfirmations')}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {confirmationsSearch ? t('operator.tryOtherTerms') : t('operator.appearAfterUpload')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paginatedConfirmations.map((confirmation) => (
                        <div key={confirmation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                              {getFileIcon(confirmation.file_type)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium flex items-center space-x-2">
                                <span>{confirmation.file_name || t('operator.unnamedFile')}</span>
                                <Badge variant="outline" className="text-xs">
                                  {confirmation.file_size && confirmation.file_size > 0 
                                    ? `${(confirmation.file_size / 1024 / 1024).toFixed(1)} MB`
                                    : t('operator.unknownSize')
                                  }
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {t('common.batch')}: {confirmation.processing_batches?.batch_name || t('operator.noBatch')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {confirmation.created_at ? new Date(confirmation.created_at).toLocaleString('es-ES') : ''}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-green-100 text-green-800">
                              {confirmation.status === 'uploaded' ? 'Subido' : confirmation.status || 'Desconocido'}
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePreviewClick(confirmation)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              {t('common.view')}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownloadClick(confirmation)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              {t('common.download')}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteClick(confirmation)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                    </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>

                {/* Pagination for Confirmations */}
                {filteredConfirmations.length > 0 && (
                  <div className="pt-4 border-t">
                    <Pagination
                      currentPage={confirmationsPage}
                      totalPages={totalConfirmationsPages}
                      onPageChange={handleConfirmationsPageChange}
                      itemsPerPage={itemsPerPage}
                      onItemsPerPageChange={handleItemsPerPageChange}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employee-fees" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>{t('operator.employeeFeesTitle')}</span>
                </CardTitle>
                <CardDescription>
                  {t('operator.employeeFeesDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingEmployeeFees ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : employeeFees.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>{t('operator.noEmployeeFees')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {employeeFees.map((fee) => (
                      <div key={fee.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {fee.employees?.first_name?.[0]}{fee.employees?.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {fee.employees?.first_name} {fee.employees?.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {fee.employees?.email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t('footer.company')}: {fee.companies?.name} ({fee.companies?.rif})
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-primary">${fee.fee_amount.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground mb-1">
                            {t('operator.monthlyFee') || 'Monthly fee'}
                          </div>
                          <Badge 
                            variant={fee.status === 'paid' ? 'default' : fee.status === 'overdue' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {fee.status === 'paid' ? t('company.billing.paid') : fee.status === 'overdue' ? t('operator.overdue') : t('company.billing.pending')}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {fee.created_at ? new Date(fee.created_at).toLocaleDateString('es-ES') : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

        {/* Upload Confirmation Modal */}
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-primary" />
                <span>{t('operator.uploadCTAButton')}</span>
              </DialogTitle>
              <DialogDescription>
                Selecciona los archivos de comprobantes de transferencia
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Instructions */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Instrucciones:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Sube comprobantes de PagoMóvil o transferencias bancarias</li>
                      <li>• Los archivos deben estar en formato PDF o imagen</li>
                      <li>• Cada comprobante debe corresponder a un adelanto específico</li>
                      <li>• El sistema marcará automáticamente los adelantos como completados</li>
                    </ul>
                  </div>

              {/* File Input */}
              <div>
                <Label htmlFor="file-upload" className="text-sm font-medium mb-2 block">
                  Seleccionar archivos
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos permitidos: PDF, JPG, PNG (máx. 10MB por archivo)
                </p>
                </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Archivos seleccionados:</Label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                        <span className="truncate">{file.name}</span>
                        <span className="text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFiles([]);
                  }}
                  className="flex-1"
                  disabled={uploadingFiles}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  onClick={uploadConfirmation}
                  disabled={uploadingFiles || selectedFiles.length === 0}
                  className="flex-1"
                  variant="hero"
                >
                  {uploadingFiles ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Subiendo...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Upload className="h-4 w-4" />
                      <span>Subir Archivos</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span>{t('operator.deleteConfirmationTitle')}</span>
              </DialogTitle>
              <DialogDescription>
                {t('operator.deleteConfirmationDesc')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {confirmationToDelete && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">{confirmationToDelete.file_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Lote: {confirmationToDelete.processing_batches?.batch_name || 'Sin lote'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Subido: {confirmationToDelete.created_at ? new Date(confirmationToDelete.created_at).toLocaleString('es-ES') : ''}
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={cancelDelete}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>{t('operator.previewTitle')}</span>
              </DialogTitle>
              <DialogDescription>
                {t('operator.previewDesc')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {previewFile && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(previewFile.file_type)}
                      <div>
                        <div className="font-medium">{previewFile.file_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {(previewFile.file_size / 1024 / 1024).toFixed(1)} MB • {previewFile.file_type}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {previewFile.status === 'uploaded' ? 'Subido' : previewFile.status}
                    </Badge>
                  </div>

                  <div className="border rounded-lg p-4">
                    {previewFile.file_type?.includes('image') ? (
                      <div className="space-y-4">
                        {previewFile.file_url ? (
                          <div className="text-center">
                            <img 
                              src={previewFile.file_url} 
                              alt={previewFile.file_name}
                              className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLElement;
                                target.style.display = 'none';
                                const nextElement = target.nextElementSibling as HTMLElement;
                                if (nextElement) {
                                  nextElement.style.display = 'block';
                                }
                              }}
                            />
                            <div style={{ display: 'none' }} className="space-y-4">
                              <Image className="h-16 w-16 text-muted-foreground mx-auto" />
                              <div>
                                <div className="font-medium">{t('operator.previewUnavailable')}</div>
                                <div className="text-sm text-muted-foreground">
                                  <a 
                                    href={previewFile.file_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {t('operator.openNewTab')}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Image className="h-16 w-16 text-muted-foreground mx-auto" />
                            <div>
                              <div className="font-medium">{t('operator.previewUnavailable')}</div>
                              <div className="text-sm text-muted-foreground">
                                {t('operator.fileHasNoPublicUrl')}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {previewFile.file_url ? (
                          <div className="text-center">
                            <div className="mb-4">
                              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                              <div className="font-medium">{previewFile.file_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {(previewFile.file_size / 1024 / 1024).toFixed(1)} MB • {previewFile.file_type}
                              </div>
                            </div>
                            <div className="space-x-2">
                              <Button 
                                variant="outline" 
                                onClick={() => window.open(previewFile.file_url, '_blank')}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                {t('operator.openNewTab')}
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => handleDownloadClick(previewFile)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                {t('common.download')}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                            <div>
                              <div className="font-medium">Vista previa no disponible</div>
                              <div className="text-sm text-muted-foreground">
                                El archivo no tiene URL pública
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default OperatorDashboard;