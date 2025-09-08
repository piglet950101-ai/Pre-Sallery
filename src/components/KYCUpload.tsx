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
}

export const KYCUpload = ({ userType, existingDocs = [] }: KYCUploadProps) => {
  const [documents, setDocuments] = useState<KYCDocument[]>(existingDocs);
  const [uploading, setUploading] = useState<string | null>(null);
  const { toast } = useToast();

  const requiredDocs = userType === 'employee' 
    ? [
        { type: 'cedula_front', label: 'Cédula (Frontal)', required: true },
        { type: 'cedula_back', label: 'Cédula (Posterior)', required: true },
        { type: 'bank_statement', label: 'Estado de Cuenta', required: false },
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
    setUploading(docType);
    
    // Simulate upload
    setTimeout(() => {
      const newDoc: KYCDocument = {
        id: `doc_${Date.now()}`,
        type: docType as any,
        name: file.name,
        status: 'pending',
        uploadedAt: new Date(),
        size: file.size,
      };

      setDocuments(prev => [...prev.filter(d => d.type !== docType), newDoc]);
      setUploading(null);
      
      toast({
        title: "Documento subido",
        description: "El documento será revisado en las próximas 24 horas",
      });
    }, 2000);
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

  return (
    <Card className="border-none shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <span>Documentos KYC</span>
        </CardTitle>
        <CardDescription>
          {userType === 'employee' 
            ? 'Sube tus documentos de identidad para verificar tu cuenta'
            : 'Sube los documentos empresariales requeridos para la verificación'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso de verificación</span>
            <span className="font-medium">{getCompletionPercentage().toFixed(0)}% completado</span>
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
                      <div className="font-medium">{docConfig.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {docConfig.required ? 'Requerido' : 'Opcional'} • JPG, PNG, PDF • Max 5MB
                      </div>
                    </div>
                  </div>
                  {existingDoc && getStatusIcon(existingDoc.status)}
                </div>

                {existingDoc ? (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-3">
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
                      </div>
                    </div>
                    
                    {existingDoc.status === 'rejected' && (
                      <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                        Documento rechazado. Por favor, sube una nueva versión.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    {isUploading ? (
                      <div className="text-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <div className="text-sm text-muted-foreground">Subiendo documento...</div>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                        <div>
                          <div className="text-sm font-medium">Arrastra tu archivo aquí</div>
                          <div className="text-xs text-muted-foreground">o haz clic para seleccionar</div>
                        </div>
                        <Label htmlFor={`file-${docConfig.type}`}>
                          <Button variant="outline" size="sm" className="cursor-pointer">
                            Seleccionar Archivo
                          </Button>
                          <Input
                            id={`file-${docConfig.type}`}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(e, docConfig.type)}
                            className="hidden"
                          />
                        </Label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-primary mb-1">Consejos para mejores resultados:</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Asegúrate de que los documentos estén bien iluminados y legibles</li>
                <li>• Evita reflejos o sombras que puedan ocultar información</li>
                <li>• Los documentos serán revisados en un plazo de 24 horas</li>
                {userType === 'employee' && <li>• La cédula debe estar vigente y en buen estado</li>}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};