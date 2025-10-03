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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";

interface KYCDocument {
  id: string;
  type: 'cedula_front' | 'cedula_back' | 'rif' | 'bank_statement' | 'salary_certificate';
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
  size: number;
  url?: string;
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

  const requiredDocs = userType === 'employee' 
  ? [
      { type: 'cedula_front', label: 'Cédula (Frontal)', required: true },
      { type: 'cedula_back', label: 'Cédula (Posterior)', required: true },
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

      // Update UI immediately after a successful storage upload
      const newDoc: KYCDocument = {
        id: `doc_${Date.now()}`,
        type: docType as any,
        name: file.name,
        status: 'pending',
        uploadedAt: new Date(),
        size: file.size,
        url: publicUrl,
      };

      setDocuments(prev => [...prev.filter(d => d.type !== docType), newDoc]);

      // Persist to employees table when employee user (best-effort)
      if (userType === 'employee' && employeeId) {
        const column = docType === 'cedula_front' ? 'cedula_front_url' : docType === 'cedula_back' ? 'cedula_back_url' : null;
        if (column) {
          const { error: updateError } = await supabase
            .from('employees')
            .update({ [column]: publicUrl })
            .eq('id', employeeId);
          if (updateError) {
            console.error('Failed to persist URL to employees:', updateError);
          }
        }
      }

      toast({ title: t('kyc.uploaded'), description: t('kyc.uploadedDesc') });
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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo inválido",
        description: "Solo se permiten archivos JPG, PNG o PDF",
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
  const allEmployeeRequiredDone = userType !== 'employee' || (hasDoc('cedula_front') && hasDoc('cedula_back'));

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (!allEmployeeRequiredDone) return;
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
                      <div className="font-medium">{docConfig.type === 'cedula_front' ? t('kyc.front') : docConfig.type === 'cedula_back' ? t('kyc.back') : docConfig.label}</div>
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
                          <Button variant="outline" size="sm">
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
                            accept="image/*,.pdf"
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
                  accept="image/*,.pdf"
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
          <Button onClick={handleSubmit} disabled={!allEmployeeRequiredDone || isSubmitting}>
            {isSubmitting ? (language === 'en' ? 'Submitting...' : 'Enviando...') : t('kyc.submit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};