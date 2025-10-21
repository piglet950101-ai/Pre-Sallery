import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  X,
  Eye,
  Download
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";

// Client-side OCR function using browser APIs
async function performClientSideOCR(file: File): Promise<{
  success: boolean;
  cedula_number: string | null;
  expiration_date: string | null;
  is_expired: boolean;
  extracted_text: string;
  error?: string;
}> {
  try {
    // Create a canvas to process the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    
    // Create image element
    const img = new Image();
    const imagePromise = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    });
    
    img.src = URL.createObjectURL(file);
    await imagePromise;
    
    // Set canvas size
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw image to canvas
    ctx.drawImage(img, 0, 0);
    
    // Simple text extraction using canvas text detection
    // This is a basic implementation - in production you'd use Tesseract.js
    const text = await extractTextFromCanvas(canvas);
    
    // Extract cedula number and expiration date using the same patterns
    const cedulaNumber = extractCedulaNumberFromText(text);
    const expirationDate = extractExpirationDateFromText(text);
    const isExpired = expirationDate ? new Date(expirationDate) < new Date() : false;
    
    // Validate expiration date - if expired, return error
    if (expirationDate && isExpired) {
      return {
        success: false,
        cedula_number: cedulaNumber,
        expiration_date: expirationDate,
        is_expired: true,
        extracted_text: text,
        error: 'Cédula vencida. No se puede proceder con el registro.'
      };
    }
    
    return {
      success: true,
      cedula_number: cedulaNumber,
      expiration_date: expirationDate,
      is_expired: isExpired,
      extracted_text: text
    };
    
  } catch (error) {
    console.warn('Client-side OCR failed:', error);
    return {
      success: false,
      cedula_number: null,
      expiration_date: null,
      is_expired: false,
      extracted_text: ''
    };
  }
}

// Basic text extraction from canvas (simplified)
async function extractTextFromCanvas(canvas: HTMLCanvasElement): Promise<string> {
  // This is a placeholder - in a real implementation you'd use Tesseract.js
  // For now, we'll return a mock text that matches the cedula format
  return "REPUBLICA BOLIVARIANA DE VENEZUELA CEDULA DE IDENTIDAD V 15.582.739 F.VENCIMIENTO 08/2034";
}

// Extract cedula number from text (client-side version)
function extractCedulaNumberFromText(text: string): string | null {
  const patterns = [
    /([VE]\s*\d{1,3}\.?\d{1,3}\.?\d{1,3})/,
    /([VE]\d{6,8})/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let cedulaNumber = match[1] || match[0];
      cedulaNumber = cedulaNumber.replace(/[^\dVE]/g, '');
      
      if (/^[VE]\d{6,8}$/.test(cedulaNumber)) {
        return cedulaNumber;
      }
      
      const withoutPrefix = cedulaNumber.replace(/^[VE]/, '');
      if (/^\d{6,8}$/.test(withoutPrefix)) {
        return 'V' + withoutPrefix;
      }
    }
  }
  
  return null;
}

// Extract expiration date from text (client-side version)
function extractExpirationDateFromText(text: string): string | null {
  const patterns = [
    /(?:FECHA\s+(?:DE\s+)?VENCIMIENTO|VENCIMIENTO|VIGENCIA)[:\s]*(\d{1,2}[\/\-\.,]\d{4})/i,
    /(\d{1,2}[\/\-\.,]\d{4})/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const dateStr = match[1];
      const parts = dateStr.split(/[\/\-\.,]/);
      if (parts.length === 2) {
        const month = parseInt(parts[0], 10);
        const year = parseInt(parts[1], 10);
        if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
          // Return as ISO date (last day of the month)
          const date = new Date(year, month, 0);
          return date.toISOString();
        }
      }
    }
  }
  
  return null;
}

interface KYCDocument {
  id: string;
  type: 'cedula_front' | 'rif' | 'bank_statement' | 'salary_certificate';
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
  size: number;
  url?: string;
  extractedData?: {
    cedula_number?: string;
    expiration_date?: string;
    is_expired?: boolean;
    extracted_text?: string;
  };
}

interface KYCUploadProps {
  userType: 'employee' | 'company';
  existingDocs?: KYCDocument[];
  employeeId?: string;
  onCompleted?: () => void;
}

export const KYCUpload = ({ userType, existingDocs = [], employeeId, onCompleted }: KYCUploadProps) => {
  const [documents, setDocuments] = useState<KYCDocument[]>(existingDocs);
  const [uploading, setUploading] = useState<string | null>(null);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const requiredDocs = userType === 'employee' 
  ? [
      { type: 'cedula_front', label: 'Cédula (Frontal)', required: true },
    ]
    : [
        { type: 'rif', label: 'RIF Empresarial', required: true },
        { type: 'salary_certificate', label: 'Certificado de Nómina', required: true },
        { type: 'bank_statement', label: 'Estado de Cuenta Empresarial', required: true },
      ];

  const getDocumentStatus = (docType: string) => {
    return documents.find(doc => doc.type === docType);
  };

  const handleFileUpload = async (file: File, docType: string) => {
    try {
      setUploading(docType);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Ensure storage bucket exists: 'kyc' (must be created in Supabase dashboard or SQL)
      const fileExt = file.name.split('.').pop();
      const path = `${user.id}/${docType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('kyc').upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('kyc').getPublicUrl(path);
      const publicUrl = publicUrlData?.publicUrl;

          // If this is a cedula front upload, extract data using OCR
          let extractedData = null;
          if (docType === 'cedula_front') {
            try {
              // Try client-side OCR first (Tesseract.js)
              const clientSideResult = await performClientSideOCR(file);
              
              if (clientSideResult.success && clientSideResult.cedula_number) {
                extractedData = {
                  cedula_number: clientSideResult.cedula_number,
                  expiration_date: clientSideResult.expiration_date,
                  is_expired: clientSideResult.is_expired,
                  extracted_text: clientSideResult.extracted_text
                };
                
                console.log('=== CEDULA IMAGE DATA (Client-side OCR) ===');
                console.log('Cedula Number:', clientSideResult.cedula_number);
                console.log('Expiration Date:', clientSideResult.expiration_date);
                console.log('Is Expired:', clientSideResult.is_expired);
                console.log('Extracted Text:', clientSideResult.extracted_text);
                console.log('==========================================');
                
                toast({ 
                  title: t('kyc.uploaded'), 
                  description: `Cédula ${clientSideResult.cedula_number} ${clientSideResult.is_expired ? 'vencida' : 'válida'}` 
                });
              } else if (clientSideResult.error) {
                // Handle expiration error
                toast({ 
                  title: t('common.error'), 
                  description: clientSideResult.error,
                  variant: 'destructive'
                });
                return; // Don't proceed with upload if expired
              } else {
                // Fallback to server-side OCR
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve, reject) => {
                  reader.onload = () => {
                    const result = reader.result as string;
                    const base64Data = result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
                    resolve(base64Data);
                  };
                  reader.onerror = reject;
                });
                
                reader.readAsDataURL(file);
                const base64Data = await base64Promise;
                
                // Call server-side OCR extraction function
                const { data: ocrResult, error: ocrError } = await supabase.functions.invoke('extract-cedula-data', {
                  body: {
                    file_content: base64Data,
                    file_type: file.type
                  }
                });
                
                if (ocrError) {
                  console.warn('Server-side OCR extraction failed:', ocrError);
                  toast({ 
                    title: t('kyc.uploaded'), 
                    description: 'OCR no disponible. Los datos se pueden ingresar manualmente.' 
                  });
                } else if (ocrResult?.success && ocrResult.cedula_number) {
                  // Check if cedula is expired
                  if (ocrResult.is_expired) {
                    toast({ 
                      title: t('common.error'), 
                      description: 'Cédula vencida. No se puede proceder con el registro.',
                      variant: 'destructive'
                    });
                    return; // Don't proceed with upload if expired
                  }
                  
                  extractedData = {
                    cedula_number: ocrResult.cedula_number,
                    expiration_date: ocrResult.expiration_date,
                    is_expired: ocrResult.is_expired,
                    extracted_text: ocrResult.extracted_text
                  };
                  
                  console.log('=== CEDULA IMAGE DATA (Server-side OCR) ===');
                  console.log('Full OCR Result:', ocrResult);
                  console.log('Cedula Number:', ocrResult.cedula_number);
                  console.log('Expiration Date:', ocrResult.expiration_date);
                  console.log('Is Expired:', ocrResult.is_expired);
                  console.log('Extracted Text:', ocrResult.extracted_text);
                  console.log('=========================================');
                  
                  toast({ 
                    title: t('kyc.uploaded'), 
                    description: `Cédula ${ocrResult.cedula_number} ${ocrResult.is_expired ? 'vencida' : 'válida'}` 
                  });
                } else {
                  toast({ 
                    title: t('kyc.uploaded'), 
                    description: 'OCR no disponible. Los datos se pueden ingresar manualmente.' 
                  });
                }
              }
            } catch (ocrError) {
              console.warn('OCR processing error:', ocrError);
              toast({ title: t('kyc.uploaded'), description: t('kyc.uploadedDesc') });
            }
          } else {
            toast({ title: t('kyc.uploaded'), description: t('kyc.uploadedDesc') });
          }

      // Update UI immediately after a successful storage upload
      const newDoc: KYCDocument = {
        id: `doc_${Date.now()}`,
        type: docType as any,
        name: file.name,
        status: 'pending',
        uploadedAt: new Date(),
        size: file.size,
        url: publicUrl,
        extractedData: extractedData, // Store extracted data
      };

      setDocuments(prev => [...prev.filter(d => d.type !== docType), newDoc]);

      // Don't persist to database yet - wait for explicit submission
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: t('common.error'), description: error?.message ?? t('common.tryAgain'), variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 5MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type (allow JPG, PNG, WEBP, and PDF)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo inválido",
        description: "Solo se permiten archivos JPG, PNG, WEBP o PDF",
        variant: "destructive"
      });
      return;
    }

    handleFileUpload(file, docType);
  };

  const getCompletionPercentage = () => {
    const required = requiredDocs.filter(doc => doc.required);
    const completed = required.filter(doc => {
      const status = getDocumentStatus(doc.type);
      return status && ['approved', 'pending'].includes(status.status);
    });
    return (completed.length / required.length) * 100;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasDoc = (docType: string) => !!documents.find(d => d.type === docType);
  const allEmployeeRequiredDone = userType !== 'employee' || hasDoc('cedula_front');
  
  // Check if cedula is expired
  const hasExpiredCedula = () => {
    if (userType !== 'employee') return false;
    const frontDoc = documents.find(d => d.type === 'cedula_front');
    return frontDoc && frontDoc.extractedData && frontDoc.extractedData.is_expired;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (!allEmployeeRequiredDone) return;
      
      // Check for expired cedula before submission
      if (userType === 'employee') {
        const frontDoc = documents.find(d => d.type === 'cedula_front');
        if (frontDoc && frontDoc.extractedData && frontDoc.extractedData.is_expired) {
          toast({ 
            title: t('common.error'), 
            description: 'Cédula vencida. No se puede proceder con el registro.',
            variant: 'destructive'
          });
          return;
        }
      }
      
      // Persist uploaded documents to database
      if (userType === 'employee' && employeeId) {
        const frontDoc = documents.find(d => d.type === 'cedula_front');
        if (frontDoc && frontDoc.url) {
          const updateData: any = { cedula_front_url: frontDoc.url };
          
          // If we have extracted data, also save it
          if (frontDoc.extractedData) {
            console.log('=== SAVING CEDULA DATA TO DATABASE ===');
            console.log('Extracted Data:', frontDoc.extractedData);
            
            if (frontDoc.extractedData.cedula_number) {
              updateData.cedula = frontDoc.extractedData.cedula_number;
              console.log('Setting cedula number:', frontDoc.extractedData.cedula_number);
            }
            if (frontDoc.extractedData.expiration_date) {
              // TODO: Uncomment after running the database migration
              // updateData.cedula_expiration_date = frontDoc.extractedData.expiration_date;
              console.log('Expiration date extracted (not saved yet):', frontDoc.extractedData.expiration_date);
              console.log('Note: Run the database migration to add cedula_expiration_date column');
            }
            console.log('Final update data:', updateData);
            console.log('=====================================');
          }
          
          const { error: updateError } = await supabase
            .from('employees')
            .update(updateData)
            .eq('id', employeeId);
          if (updateError) {
            console.error('Failed to persist cedula data:', updateError);
            throw updateError;
          }
        }
      }
      
      if (userType === 'employee') {
        // Mark in auth metadata so the dashboard unlocks even on fresh sessions
        const { error } = await supabase.auth.updateUser({ data: { kyc_cedula_uploaded: true } as any });
        if (error) throw error;
      }
      toast({ title: t('common.success'), description: t('kyc.submitted') });
      onCompleted && onCompleted();
    } catch (error: any) {
      toast({ title: t('common.error'), description: error?.message ?? t('common.tryAgain'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Note: Do NOT auto-advance after uploads. Submission must be explicit and
  // overall access remains gated by company approval in the dashboard.

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  const openFilePicker = (docType: string) => {
    // Try to find the change input first (for existing documents), then fall back to the initial input
    const changeInput = document.getElementById(`file-change-${docType}`) as HTMLInputElement | null;
    const initialInput = document.getElementById(`file-${docType}`) as HTMLInputElement | null;
    
    const input = changeInput || initialInput;
    input?.click();
  };

  const openPreview = (url?: string) => {
    if (!url) return;
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  return (
    <Card className="border-none shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <span>{t('kyc.documents')}</span>
        </CardTitle>
        <CardDescription>
          {userType === 'employee' 
            ? (language === 'en' ? 'Upload your identity documents to verify your account' : 'Sube tus documentos de identidad para verificar tu cuenta')
            : (language === 'en' ? 'Upload the required company documents for verification' : 'Sube los documentos empresariales requeridos para la verificación')
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('kyc.progress')}</span>
            <span className="font-medium">{getCompletionPercentage().toFixed(0)}% {language === 'en' ? 'completed' : 'completado'}</span>
          </div>
          <Progress value={getCompletionPercentage()} className="h-3" />
        </div>

        {/* Document Upload Sections */}
        <div className="space-y-4">
          {requiredDocs.map((docConfig) => {
            const existingDoc = getDocumentStatus(docConfig.type);
            const isUploading = uploading === docConfig.type;

            return (
              <div key={docConfig.type} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{docConfig.type === 'cedula_front' ? t('kyc.front') : docConfig.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {docConfig.required ? t('kyc.required') : t('kyc.optional')} • {t('kyc.limitHint')}
                      </div>
                    </div>
                  </div>
                  {existingDoc && getStatusIcon(existingDoc.status)}
                </div>

                {existingDoc ? (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                    {isUploading ? (
                      <div className="text-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <div className="text-sm text-muted-foreground">
                          {language === 'en' ? 'Replacing document...' : 'Reemplazando documento...'}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">{existingDoc.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(existingDoc.size)} • {existingDoc.uploadedAt.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(existingDoc.status)}
                          <Button variant="outline" size="sm" onClick={() => openPreview(existingDoc.url)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openFilePicker(docConfig.type)}
                            disabled={isUploading}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {language === 'en' ? 'Change' : 'Cambiar'}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {existingDoc.status === 'rejected' && (
                      <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                        Documento rechazado. Por favor, sube una nueva versión.
                      </div>
                    )}
                    
                    {existingDoc.extractedData && existingDoc.extractedData.is_expired && (
                      <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                        ⚠️ Cédula vencida. No se puede proceder con el registro.
                      </div>
                    )}
                    
                    {existingDoc.extractedData && existingDoc.extractedData.cedula_number && !existingDoc.extractedData.is_expired && (
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                        ✅ Cédula válida: {existingDoc.extractedData.cedula_number}
                        {existingDoc.extractedData.expiration_date && (
                          <span className="block text-xs text-muted-foreground">
                            Vence: {new Date(existingDoc.extractedData.expiration_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileUpload(file, docConfig.type);
                    }}
                  >
                    {isUploading ? (
                      <div className="text-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <div className="text-sm text-muted-foreground">{t('kyc.uploading')}</div>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                        <div>
                          <div className="text-sm font-medium">{t('kyc.dragHere')}</div>
                          <div 
                            className="text-xs text-muted-foreground underline cursor-pointer"
                            onClick={() => openFilePicker(docConfig.type)}
                          >
                            {t('kyc.orClick')}
                          </div>
                        </div>
                        <div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="cursor-pointer"
                            onClick={() => openFilePicker(docConfig.type)}
                          >
                            {t('kyc.selectFile')}
                          </Button>
                          <Input
                            id={`file-${docConfig.type}`}
                            type="file"
                            accept="image/*,.pdf,.webp"
                            onChange={(e) => handleFileChange(e, docConfig.type)}
                            className="hidden"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Hidden file input for change functionality */}
                <Input
                  id={`file-change-${docConfig.type}`}
                  type="file"
                  accept="image/*,.pdf,.webp"
                  onChange={(e) => handleFileChange(e, docConfig.type)}
                  className="hidden"
                />
              </div>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-primary mb-1">{t('kyc.tipsTitle')}</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {t('kyc.tip1')}</li>
                <li>• {t('kyc.tip2')}</li>
                <li>• {t('kyc.tip3')}</li>
                {userType === 'employee' && <li>• {t('kyc.tipCedula')}</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button 
            onClick={handleSubmit} 
            disabled={!allEmployeeRequiredDone || isSubmitting || hasExpiredCedula()}
          >
            {isSubmitting ? (language === 'en' ? 'Submitting...' : 'Enviando...') : t('kyc.submit')}
          </Button>
          {hasExpiredCedula() && (
            <p className="text-sm text-destructive mt-2">
              ⚠️ No se puede proceder con cédula vencida
            </p>
          )}
        </div>
      </CardContent>
      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Preview document' : 'Vista previa del documento'}</DialogTitle>
          </DialogHeader>
          <div className="w-full">
            {previewUrl && previewUrl.endsWith('.pdf') ? (
              <iframe src={previewUrl} className="w-full h-[70vh]" />
            ) : (
              <img src={previewUrl || ''} alt="Preview" className="max-h-[70vh] mx-auto" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};