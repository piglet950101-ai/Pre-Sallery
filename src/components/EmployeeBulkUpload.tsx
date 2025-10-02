import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
// import { Switch } from '@/components/ui/switch'; // Not used in current implementation
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Users,
  DollarSign,
  User,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';

interface EmployeeData {
  rowNumber: number;
  name: string;
  cedula: string;
  monthly_salary: number;
  is_active: boolean;
  email?: string;
  phone?: string;
  position?: string;
}

interface EmployeeBulkUploadProps {
  onUploadComplete?: () => void;
}

export const EmployeeBulkUpload: React.FC<EmployeeBulkUploadProps> = ({ onUploadComplete }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<EmployeeData[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Cedula validation function
  const validateCedula = (cedula: string): boolean => {
    const cedulaPattern = /^[EV]\d{6,8}$/;
    return cedulaPattern.test(cedula);
  };

  // Handle CSV file upload
  const handleCsvFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
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

  // Parse CSV file
  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: t('common.error'),
          description: t('company.csvUpload.emptyFile'),
          variant: "destructive"
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const data: EmployeeData[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = { rowNumber: i };
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Map CSV columns to employee fields
        const employeeData: EmployeeData = {
          rowNumber: i,
          name: row.name || row.nombre || row['full name'] || '',
          cedula: row.cedula || row.id || row['id number'] || '',
          monthly_salary: parseFloat(row.salary || row.monthly_salary || row['monthly salary'] || '0') || 0,
          is_active: (row.active || row.is_active || row['is active'] || 'true').toLowerCase() === 'true',
          email: row.email || '',
          phone: row.phone || row.phone_number || row['phone number'] || '',
          position: row.position || row.job_title || row['job title'] || row.title || 'Employee'
        };

        data.push(employeeData);
      }

      setCsvData(data);
      setShowPreview(true);
      
      // Select all rows by default
      setSelectedRows(new Set(data.map((_, index) => index)));
    };
    reader.readAsText(file);
  };

  // Handle row selection
  const toggleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  // Select all rows
  const selectAllRows = () => {
    setSelectedRows(new Set(csvData.map((_, index) => index)));
  };

  // Deselect all rows
  const deselectAllRows = () => {
    setSelectedRows(new Set());
  };

  // Import selected employees
  const importEmployees = async () => {
    if (!csvData.length || selectedRows.size === 0) return;
    
    setIsProcessing(true);
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
      const selectedRowsData = csvData.filter((_, index) => selectedRows.has(index));
      
      for (const row of selectedRowsData) {
        try {
          // Validate required fields
          if (!row.name || !row.cedula || row.monthly_salary <= 0) {
            errors.push(`Row ${row.rowNumber}: Missing required fields (name, cedula, monthly_salary)`);
            errorCount++;
            continue;
          }

          // Validate cedula format
          if (!validateCedula(row.cedula)) {
            errors.push(`Row ${row.rowNumber}: Invalid cedula format. Must be E or V followed by 6-8 digits`);
            errorCount++;
            continue;
          }

          // Check for duplicate cedula
          const { data: existingByCedula } = await supabase
            .from("employees")
            .select("id")
            .eq("company_id", companyData.id)
            .eq("cedula", row.cedula)
            .limit(1);

          if (existingByCedula && existingByCedula.length > 0) {
            errors.push(`Row ${row.rowNumber}: Cedula ${row.cedula} already exists`);
            errorCount++;
            continue;
          }

          // Generate activation code
          const generateActivationCode = () => {
            return Math.random().toString(36).substring(2, 8).toUpperCase();
          };

          // Prepare employee data
          const employeeData = {
            first_name: row.name.split(' ')[0] || '',
            last_name: row.name.split(' ').slice(1).join(' ') || '',
            email: row.email || `${row.cedula.toLowerCase()}@company.com`,
            phone: row.phone || '',
            cedula: row.cedula,
            monthly_salary: row.monthly_salary,
            is_active: row.is_active,
            position: row.position,
            company_id: companyData.id,
            activation_code: generateActivationCode(),
            is_verified: false,
            created_at: new Date().toISOString()
          };

          // Insert employee
          const { error: insertError } = await supabase
            .from("employees")
            .insert([employeeData]);

          if (insertError) {
            errors.push(`Row ${row.rowNumber}: ${insertError.message}`);
            errorCount++;
          } else {
            successCount++;
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
          description: `Successfully imported ${successCount} out of ${selectedRowsData.length} selected employees`,
        });
        
        // Reset form
        setCsvFile(null);
        setCsvData([]);
        setSelectedRows(new Set());
        setShowPreview(false);
        
        // Call completion callback
        if (onUploadComplete) {
          onUploadComplete();
        }
      }

      if (errorCount > 0) {
        toast({
          title: t('company.csvUpload.importErrors'),
          description: errors.slice(0, 5).join(', ') + (errors.length > 5 ? '...' : ''),
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      console.error('Error importing employees:', error);
      toast({
        title: t('common.error'),
        description: error?.message || 'Failed to import employees',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const headers = ['name', 'cedula', 'monthly_salary', 'is_active', 'email', 'phone', 'position'];
    const sampleData = [
      ['Juan Pérez', 'V12345678', '800', 'true', 'juan.perez@company.com', '+58 212 123-4567', 'Developer'],
      ['María González', 'E87654321', '750', 'true', 'maria.gonzalez@company.com', '+58 212 234-5678', 'Designer'],
      ['Carlos Rodríguez', 'V11223344', '900', 'false', 'carlos.rodriguez@company.com', '+58 212 345-6789', 'Manager']
    ];
    
    const csvContent = [headers, ...sampleData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: t('company.csvUpload.templateDownloaded'),
      description: t('company.csvUpload.templateDownloadedDesc'),
    });
  };

  const getStatusBadge = (employee: EmployeeData) => {
    if (!employee.name || !employee.cedula || employee.monthly_salary <= 0) {
      return <Badge variant="destructive">Missing Required Fields</Badge>;
    }
    if (!validateCedula(employee.cedula)) {
      return <Badge variant="destructive">Invalid Cedula</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
  };

  const getStatusIcon = (employee: EmployeeData) => {
    if (!employee.name || !employee.cedula || employee.monthly_salary <= 0) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    if (!validateCedula(employee.cedula)) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  return (
    <Card className="border-none shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-primary" />
          <span>{t('company.employeeBulkUpload.title')}</span>
        </CardTitle>
        <CardDescription>
          {t('company.employeeBulkUpload.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Download */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium text-primary">{t('company.csvUpload.template')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('company.csvUpload.templateDesc')}
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              {t('company.csvUpload.download')}
            </Button>
          </div>
        </div>

        {/* File Upload */}
        {!showPreview && (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
            <div className="text-center space-y-4">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <div className="font-medium">{t('company.csvUpload.dragDrop')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('company.csvUpload.clickToSelect')}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="csv-file">
                  <Button variant="outline" className="cursor-pointer">
                    {t('company.csvUpload.selectFile')}
                  </Button>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileUpload}
                    className="hidden"
                  />
                </Label>
                {csvFile && (
                  <div className="text-sm text-muted-foreground">
                    {t('company.csvUpload.fileSelected')}: {csvFile.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview and Selection */}
        {showPreview && csvData.length > 0 && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-muted-foreground">
                  {t('company.csvUpload.totalRows')}: {csvData.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('company.csvUpload.selectedRows')}: {selectedRows.size}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={selectAllRows}>
                  <Eye className="h-4 w-4 mr-1" />
                  {t('company.csvUpload.selectAll')}
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllRows}>
                  <EyeOff className="h-4 w-4 mr-1" />
                  {t('company.csvUpload.deselectAll')}
                </Button>
              </div>
            </div>

            {/* Employee List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {csvData.map((employee, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(index)}
                        onChange={() => toggleRowSelection(index)}
                        className="rounded"
                      />
                      <div className="h-8 w-8 bg-gradient-primary rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.cedula} • ${employee.monthly_salary}/month
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(employee)}
                      {getStatusBadge(employee)}
                      <Badge variant={employee.is_active ? "default" : "secondary"}>
                        {employee.is_active ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </div>
                  </div>
                  
                  {(employee.email || employee.phone || employee.position) && (
                    <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                      {employee.email && (
                        <div>
                          <div className="font-medium">Email</div>
                          <div>{employee.email}</div>
                        </div>
                      )}
                      {employee.phone && (
                        <div>
                          <div className="font-medium">Phone</div>
                          <div>{employee.phone}</div>
                        </div>
                      )}
                      {employee.position && (
                        <div>
                          <div className="font-medium">Position</div>
                          <div>{employee.position}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPreview(false);
                  setCsvData([]);
                  setSelectedRows(new Set());
                }}
              >
                <X className="h-4 w-4 mr-2" />
                {t('company.csvUpload.uploadNew')}
              </Button>
              <Button 
                onClick={importEmployees}
                disabled={selectedRows.size === 0 || isProcessing}
                className="min-w-32"
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t('company.csvUpload.processing')}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{t('company.csvUpload.importSelected')} ({selectedRows.size})</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h5 className="font-medium mb-2">{t('company.csvUpload.requiredFormat')}:</h5>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>• <strong>name:</strong> {t('company.csvUpload.nameDesc')}</div>
            <div>• <strong>cedula:</strong> {t('company.csvUpload.cedulaDesc')}</div>
            <div>• <strong>monthly_salary:</strong> {t('company.csvUpload.salaryDesc')}</div>
            <div>• <strong>is_active:</strong> {t('company.csvUpload.activeDesc')}</div>
            <div>• <strong>email:</strong> {t('company.csvUpload.emailDesc')}</div>
            <div>• <strong>phone:</strong> {t('company.csvUpload.phoneDesc')}</div>
            <div>• <strong>position:</strong> {t('company.csvUpload.positionDesc')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
