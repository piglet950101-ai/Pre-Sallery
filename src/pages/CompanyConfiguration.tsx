import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  DollarSign,
  Building2,
  Users,
  Shield,
  Save,
  AlertCircle,
  CheckCircle,
  Settings,
  Edit,
  X,
  Upload,
  FileText
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const CompanyConfiguration = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  
  // Edit state for each section
  const [editingSections, setEditingSections] = useState<Set<string>>(new Set());

  // Company data
  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    rif: "",
    phone: "",
    address: ""
  });
  
  // Original company data for comparison
  const [originalCompanyInfo, setOriginalCompanyInfo] = useState({
    name: "",
    rif: "",
    phone: "",
    address: ""
  });

  // RIF image state
  const [rifImage, setRifImage] = useState<File | null>(null);
  const [currentRifImageUrl, setCurrentRifImageUrl] = useState<string | null>(null);
  const [isUploadingRif, setIsUploadingRif] = useState(false);
  const [removeRifImage, setRemoveRifImage] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);



  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleSaveClick = () => {
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    setIsConfirmDialogOpen(false);
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast({
        title: t('config.settingsSaved'),
        description: t('config.settingsSavedDesc'),
      });
      setIsLoading(false);
    }, 1500);
  };

  const handleEditSection = (section: string) => {
    setEditingSections(prev => new Set(prev).add(section));
  };

  const handleSaveSection = async (section: string) => {
    if (section === 'company') {
      await saveCompanyData();
    } else {
      // For other sections, just simulate save
      setIsLoading(true);
      setTimeout(() => {
        setEditingSections(prev => {
          const newSet = new Set(prev);
          newSet.delete(section);
          return newSet;
        });
        toast({
          title: t('config.sectionSaved'),
          description: t('config.sectionSavedDesc').replace('{section}', t(`config.tabs.${section}`)),
        });
        setIsLoading(false);
      }, 1500);
    }
  };

  const saveCompanyData = async () => {
    if (!user) return;
    
    // Check if there are any changes compared to original data
    const hasChanges = companyInfo.name !== originalCompanyInfo.name ||
                      companyInfo.rif !== originalCompanyInfo.rif ||
                      companyInfo.phone !== originalCompanyInfo.phone ||
                      companyInfo.address !== originalCompanyInfo.address ||
                      rifImage !== null || // Include RIF image changes
                      removeRifImage; // Include RIF removal
    
    if (!hasChanges) {
      toast({
        title: t('config.noChanges'),
        description: t('config.noChangesDesc'),
        variant: "default"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      let rifImageUrl = currentRifImageUrl; // Keep current URL if no new image
      
      // Handle RIF image removal
      if (removeRifImage) {
        rifImageUrl = null;
      }
      
      // Upload new RIF image if provided
      if (rifImage) {
        const fileExt = rifImage.name.split('.').pop()?.toLowerCase() || 'jpg';
        const objectKey = `rif/${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('company-docs')
          .upload(objectKey, rifImage, { upsert: true, contentType: rifImage.type });
        
        if (uploadErr) {
          console.error('RIF upload error:', uploadErr);
          toast({
            title: t('common.error'),
            description: 'Error al subir el documento RIF',
            variant: "destructive"
          });
          return;
        } else {
          const { data: pubUrl } = supabase.storage.from('company-docs').getPublicUrl(objectKey);
          rifImageUrl = pubUrl.publicUrl;
        }
      }

      // Update company data directly using auth_user_id
      const updateData: any = {
        name: companyInfo.name,
        rif: companyInfo.rif,
        phone: companyInfo.phone,
        address: companyInfo.address
      };

      // Only include rif_image_url if we have a new URL
      if (rifImageUrl !== currentRifImageUrl) {
        updateData.rif_image_url = rifImageUrl;
      }

      const { data: updateResult, error: updateError } = await supabase
        .from('companies')
        .update(updateData)
        .eq('auth_user_id', user.id)
        .select();

      if (updateError) {
        console.error('Error updating company data:', updateError);
        toast({
          title: t('common.error'),
          description: `Failed to update company data: ${updateError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Update original data to current data
      setOriginalCompanyInfo({
        name: companyInfo.name,
        rif: companyInfo.rif,
        phone: companyInfo.phone,
        address: companyInfo.address
      });

      // Update current RIF image URL if changed
      if (rifImageUrl !== currentRifImageUrl) {
        setCurrentRifImageUrl(rifImageUrl);
      }

      // Clear the RIF image file and remove flag
      setRemoveRifImage(false);
      initializeUploadForm(); // Initialize the upload form

      // Remove from editing state and show success
      setEditingSections(prev => {
        const newSet = new Set(prev);
        newSet.delete('company');
        return newSet;
      });

      toast({
        title: t('config.sectionSaved'),
        description: t('config.sectionSavedDesc').replace('{section}', t('config.tabs.company')),
      });
    } catch (error) {
      console.error('Error saving company data:', error);
      toast({
        title: t('common.error'),
        description: 'An unexpected error occurred while saving company data',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = (section: string) => {
    setEditingSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(section);
      return newSet;
    });
    
    // Reset RIF image states when canceling company edit
    if (section === 'company') {
      setRemoveRifImage(false);
      initializeUploadForm(); // Initialize the upload form
    }
  };

  const isEditing = (section: string) => editingSections.has(section);

  // Password change functions
  const handlePasswordChange = async () => {
    if (!user) return;

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('employee.profile.passwordRequired'),
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('employee.profile.passwordMismatch'),
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: t('common.error'),
        description: t('employee.profile.passwordTooShort'),
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // Store current session to restore after password verification
      const { data: { session } } = await supabase.auth.getSession();
      
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwordData.currentPassword
      });

      if (signInError) {
        toast({
          title: t('common.error'),
          description: t('employee.profile.passwordIncorrect'),
          variant: "destructive"
        });
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        console.error('Error updating password:', updateError);
        toast({
          title: t('common.error'),
          description: 'Failed to update password',
          variant: "destructive"
        });
        return;
      }

      // Restore original session to prevent re-rendering
      if (session) {
        await supabase.auth.setSession(session);
      }

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast({
        title: t('employee.profile.passwordUpdated'),
        description: 'Your password has been updated successfully',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: t('common.error'),
        description: 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(false);
  };

  // Handle file input click to reset before selection
  const handleFileInputClick = (event: React.MouseEvent<HTMLInputElement>) => {
    console.log('File input clicked - clearing value');
    // Clear the value before opening file picker
    event.currentTarget.value = '';
  };

  // Handle label click to ensure file input is reset
  const handleLabelClick = (event: React.MouseEvent<HTMLLabelElement>) => {
    console.log('Label clicked - clearing file input');
    // Clear the file input value when label is clicked
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      console.log('File input value cleared via label click');
    }
  };

  // RIF image upload handler
  const handleRifImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== onChange EVENT TRIGGERED ===');
    console.log('Event target:', event.target);
    console.log('Files:', event.target.files);
    console.log('Files length:', event.target.files?.length);
    
    
    const file = event.target.files?.[0];
    
    console.log('File selected:', file?.name, file?.size, file?.type);
    
    if (!file) {
      console.log('No file selected - exiting');
      return;
    }


    // Reset remove flag when uploading new file
    setRemoveRifImage(false);

    // Clear the input value to allow re-selecting the same file
    event.target.value = '';
    
    // Force file input to re-render by changing key
    setFileInputKey(prev => prev + 1);

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        title: t('common.error'),
        description: 'Solo se permiten imágenes y archivos PDF.',
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t('common.error'),
        description: 'El archivo es demasiado grande. Máximo 10MB.',
        variant: "destructive"
      });
      return;
    }

    // Validate RIF expiration date using the validation function
    try {
      console.log('Starting RIF validation for:', file.name);
      setIsUploadingRif(true);
      toast({
        title: t('common.loading'),
        description: 'Validando documento RIF...',
      });

      // Convert file to base64 for validation
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Content = reader.result as string;
          const base64Data = base64Content.split(',')[1]; // Remove data:image/jpeg;base64, prefix

          const { data, error } = await supabase.functions.invoke('validate-rif-expiration', {
            body: {
              file_content: base64Data,
              file_type: file.type,
              document_text: null,
              document_url: null
            }
          });

          if (error) {
            console.error('RIF validation error:', error);
            throw error;
          }

          if (data.is_expired) {
            console.log('RIF document is expired');
            toast({
              title: 'Documento RIF vencido',
              description: 'El documento RIF ha vencido. Por favor, sube un documento válido.',
              variant: "destructive"
            });
            return;
          }

          console.log('RIF validation successful');
          toast({
            title: t('common.success'),
            description: data.message,
          });

          // Set the file after validation passes
          setRifImage(file);

        } catch (error: any) {
          console.error('RIF validation error:', error);
          toast({
            title: 'Error de validación',
            description: 'Error al validar el documento RIF. Asegúrate de que el documento sea claro y legible.',
            variant: "destructive"
          });
        } finally {
          setIsUploadingRif(false);
        }
      };

      reader.readAsDataURL(file);

    } catch (error: any) {
      console.error('RIF validation error:', error);
      toast({
        title: 'Error de validación',
        description: 'Error al validar el documento RIF.',
        variant: "destructive"
      });
      setIsUploadingRif(false);
    }
  };

  // Initialize upload form
  const initializeUploadForm = () => {
    console.log('=== INITIALIZING UPLOAD FORM ===');
    setRifImage(null);
    setIsUploadingRif(false);
    // Clear the file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      console.log('File input value cleared in initialization');
    } else {
      console.log('File input ref is null during initialization');
    }
    setFileInputKey(prev => {
      const newKey = prev + 1;
      console.log('File input key updated to:', newKey);
      return newKey;
    });
    console.log('Upload form initialization complete');
  };

  // Handle removing RIF image
  const handleRemoveRifImage = () => {
    setRemoveRifImage(true);
    initializeUploadForm(); // Initialize the upload form
    toast({
      title: 'Documento RIF marcado para eliminar',
      description: 'El documento RIF será eliminado al guardar los cambios. Puedes subir un nuevo documento.',
    });
  };

  // Fetch company data
  const fetchCompanyData = async () => {
    if (!user) return;
    
    setIsLoadingCompany(true);
    try {
      // Direct lookup using auth_user_id in companies table
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (companyError) {
        console.error('Error fetching company data:', companyError);
        toast({
          title: t('common.error'),
          description: 'Failed to fetch company data. Please contact support.',
          variant: "destructive"
        });
        return;
      }

      if (!company) {
        console.error('No company found for user');
        toast({
          title: t('common.error'),
          description: 'No company associated with this user. Please contact support.',
          variant: "destructive"
        });
        return;
      }

      // Check if company is approved
      if (!company.is_approved) {
        console.warn('Company is not approved. Redirecting to login.');
        await supabase.auth.signOut();
        window.location.href = '/login';
        return;
      }

      const companyData = {
        name: company.name || "",
        rif: company.rif || "",
        phone: company.phone || "",
        address: company.address || ""
      };
      setCompanyInfo(companyData);
      setOriginalCompanyInfo(companyData); // Store original data for comparison
      setCurrentRifImageUrl(company.rif_image_url || null); // Store current RIF image URL
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast({
        title: t('common.error'),
        description: 'An unexpected error occurred while loading company data',
        variant: "destructive"
      });
    } finally {
      setIsLoadingCompany(false);
    }
  };

  // Fetch company data on component mount
  useEffect(() => {
    fetchCompanyData();
  }, [user]);

  const renderSectionActions = (section: string) => {
    if (isEditing(section)) {
      return (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleCancelEdit(section)}
          >
            <X className="h-4 w-4 mr-2" />
            {t('config.cancel')}
          </Button>
          <Button 
            size="sm" 
            onClick={() => handleSaveSection(section)}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('config.saving')}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>{t('config.saveChanges')}</span>
              </div>
            )}
          </Button>
        </div>
      );
    }

    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleEditSection(section)}
        className="text-muted-foreground hover:text-primary"
        disabled={section === 'company' && isLoadingCompany}
      >
        {section === 'company' && isLoadingCompany ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
        ) : (
          <Edit className="h-4 w-4 mr-2" />
        )}
        {section === 'company' && isLoadingCompany ? t('common.loading') : t('config.edit')}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/company" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t('config.backToDashboard')}</span>
                </Link>
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{t('config.title')}</h1>
                  <p className="text-sm text-muted-foreground">{t('config.subtitle')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="company">{t('config.tabs.company')}</TabsTrigger>
            <TabsTrigger value="security">{t('config.tabs.security')}</TabsTrigger>
          </TabsList>

          {/* Company Information */}
          <TabsContent value="company" className="space-y-6">
            <Card className="border-none shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span>{t('config.company.title')}</span>
                    </CardTitle>
                    <CardDescription>
                      {t('config.company.subtitle')}
                    </CardDescription>
                  </div>
                  {renderSectionActions('company')}
                </div>
              </CardHeader>
                     <CardContent className="space-y-6">
                       <div className="space-y-3">
                         <Label htmlFor="company-name" className="text-base">{t('config.company.businessName')}</Label>
                         <Input
                           id="company-name"
                           value={companyInfo.name}
                           onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                           disabled={!isEditing('company') || isLoadingCompany}
                           placeholder={isLoadingCompany ? t('common.loading') : t('register.companyNamePlaceholder')}
                           className="h-12 text-base"
                         />
                       </div>
                       
                       <div className="space-y-3">
                         <Label htmlFor="rif" className="text-base">{t('config.company.rif')}</Label>
                         <Input
                           id="rif"
                           value={companyInfo.rif}
                           onChange={(e) => setCompanyInfo({...companyInfo, rif: e.target.value})}
                           disabled={!isEditing('company') || isLoadingCompany}
                           placeholder={isLoadingCompany ? t('common.loading') : 'J123456789'}
                           className="h-12 text-base"
                         />
                       </div>
                       
                       <div className="space-y-3">
                         <Label htmlFor="address" className="text-base">{t('config.company.address')}</Label>
                         <Textarea
                           id="address"
                           value={companyInfo.address}
                           onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                           disabled={!isEditing('company') || isLoadingCompany}
                           placeholder={isLoadingCompany ? t('common.loading') : t('register.companyAddressPlaceholder')}
                           className="min-h-[80px] text-base"
                         />
                       </div>

                       <div className="space-y-3">
                         <Label htmlFor="email" className="text-base">{t('config.company.email')}</Label>
                         <Input
                           id="email"
                           type="email"
                           value={user?.email || ''}
                           disabled={true}
                           className="h-12 text-base bg-muted"
                         />
                         <p className="text-sm text-muted-foreground">
                           {t('config.company.emailNote') || 'Email is managed through your account settings'}
                         </p>
                       </div>

                       <div className="space-y-3">
                         <Label htmlFor="phone" className="text-base">{t('config.company.phone')}</Label>
                         <Input
                           id="phone"
                           value={companyInfo.phone}
                           onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                           disabled={!isEditing('company') || isLoadingCompany}
                           placeholder={isLoadingCompany ? t('common.loading') : t('register.companyPhonePlaceholder')}
                           className="h-12 text-base"
                         />
                       </div>

                       {/* RIF Document Upload */}
                       <div className="space-y-3">
                         <Label className="text-base">Documento RIF</Label>
                         
                         {/* Current RIF Image Display */}
                         {currentRifImageUrl && !removeRifImage && (
                           <div className="space-y-2">
                             <div className="flex items-center justify-between">
                               <p className="text-sm text-muted-foreground">Documento RIF actual:</p>
                               {isEditing('company') && (
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={handleRemoveRifImage}
                                   className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                 >
                                   <X className="h-4 w-4 mr-1" />
                                   Eliminar
                                 </Button>
                               )}
                             </div>
                             <div className="border rounded-lg p-4 bg-muted/50">
                               <img 
                                 src={currentRifImageUrl} 
                                 alt="RIF Document" 
                                 className="max-w-full h-auto max-h-64 rounded border"
                                 onError={(e) => {
                                   const target = e.target as HTMLImageElement;
                                   target.style.display = 'none';
                                   target.nextElementSibling?.classList.remove('hidden');
                                 }}
                               />
                               <div className="hidden text-sm text-muted-foreground">
                                 <FileText className="h-4 w-4 inline mr-2" />
                                 Documento RIF disponible
                               </div>
                             </div>
                           </div>
                         )}

                         {/* Show removal message */}
                         {removeRifImage && (
                           <div className="space-y-2">
                             <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded">
                               <AlertCircle className="h-4 w-4 text-red-600" />
                               <span className="text-sm text-red-800">
                                 El documento RIF será eliminado al guardar los cambios.
                               </span>
                             </div>
                             <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded">
                               <CheckCircle className="h-4 w-4 text-blue-600" />
                               <span className="text-sm text-blue-800">
                                 El formulario de carga está listo para un nuevo documento.
                               </span>
                             </div>
                           </div>
                         )}

                         {/* New RIF Image Upload */}
                         {isEditing('company') && (
                           <div className="space-y-2">
                             <div className="flex items-center justify-between">
                               <p className="text-sm text-muted-foreground">
                                 {removeRifImage ? 'Subir nuevo documento RIF:' : 
                                  currentRifImageUrl ? 'Subir nuevo documento RIF:' : 'Subir documento RIF:'}
                               </p>
                             </div>
                             <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                               <input
                                 ref={fileInputRef}
                                 key={fileInputKey}
                                 type="file"
                                 id="rif-upload"
                                 accept="image/*,.pdf"
                                 onChange={handleRifImageUpload}
                                 onClick={handleFileInputClick}
                                 disabled={isUploadingRif}
                                 className="hidden"
                               />
                               <label 
                                 htmlFor="rif-upload" 
                                 className="cursor-pointer flex flex-col items-center space-y-2"
                                 onClick={handleLabelClick}
                               >
                                 {isUploadingRif ? (
                                   <>
                                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                     <p className="text-sm text-muted-foreground">Validando documento...</p>
                                   </>
                                 ) : (
                                   <>
                                     <Upload className="h-8 w-8 text-muted-foreground" />
                                     <div>
                                       <p className="text-sm font-medium">
                                         {rifImage ? rifImage.name : 'Hacer clic para subir documento RIF'}
                                       </p>
                                       <p className="text-xs text-muted-foreground">
                                         PNG, JPG, PDF (máximo 10MB)
                                       </p>
                                     </div>
                                   </>
                                 )}
                               </label>
                             </div>
                             
                             {/* Selected file info */}
                             {rifImage && (
                               <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded">
                                 <CheckCircle className="h-4 w-4 text-green-600" />
                                 <span className="text-sm text-green-800">
                                   Documento válido: {rifImage.name}
                                 </span>
                               </div>
                             )}
                           </div>
                         )}

                         {!isEditing('company') && !currentRifImageUrl && !removeRifImage && !isLoadingCompany && (
                           <div className="text-sm text-muted-foreground">
                             <AlertCircle className="h-4 w-4 inline mr-2" />
                             No hay documento RIF subido
                           </div>
                         )}
                       </div>

                     </CardContent>
            </Card>
          </TabsContent>


                 {/* Security */}
                 <TabsContent value="security" className="space-y-6">
                   <Card className="border-none shadow-elegant">
                     <CardHeader>
                       <div className="flex items-center justify-between">
                         <div>
                           <CardTitle className="flex items-center space-x-2">
                             <Shield className="h-5 w-5 text-primary" />
                             <span>{t('config.security.title')}</span>
                           </CardTitle>
                           <CardDescription>
                             {t('config.security.subtitle')}
                           </CardDescription>
                         </div>
                       </div>
                     </CardHeader>
                     <CardContent className="space-y-6">
                       {/* Change Password Section */}
                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <div>
                             <h3 className="text-lg font-semibold">{t('config.security.changePassword')}</h3>
                             <p className="text-sm text-muted-foreground">{t('config.security.changePasswordDesc')}</p>
                           </div>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => setIsChangingPassword(!isChangingPassword)}
                           >
                             {isChangingPassword ? t('config.cancel') : t('config.security.changePassword')}
                           </Button>
                         </div>

                         {isChangingPassword && (
                           <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                             <div className="space-y-2">
                               <Label htmlFor="current-password">{t('config.security.currentPassword')}</Label>
                               <Input
                                 id="current-password"
                                 type="password"
                                 value={passwordData.currentPassword}
                                 onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                 placeholder={t('config.security.currentPasswordPlaceholder')}
                                 className="h-12"
                               />
                             </div>

                             <div className="space-y-2">
                               <Label htmlFor="new-password">{t('config.security.newPassword')}</Label>
                               <Input
                                 id="new-password"
                                 type="password"
                                 value={passwordData.newPassword}
                                 onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                 placeholder={t('config.security.newPasswordPlaceholder')}
                                 className="h-12"
                               />
                             </div>

                             <div className="space-y-2">
                               <Label htmlFor="confirm-password">{t('config.security.confirmPassword')}</Label>
                               <Input
                                 id="confirm-password"
                                 type="password"
                                 value={passwordData.confirmPassword}
                                 onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                 placeholder={t('config.security.confirmPasswordPlaceholder')}
                                 className="h-12"
                               />
                             </div>

                             <div className="flex space-x-2">
                               <Button
                                 onClick={handlePasswordChange}
                                 disabled={isUpdatingPassword}
                                 className="flex-1"
                               >
                                 {isUpdatingPassword ? (
                                   <div className="flex items-center space-x-2">
                                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                     <span>{t('config.security.updatingPassword')}</span>
                                   </div>
                                 ) : (
                                   t('config.security.updatePassword')
                                 )}
                               </Button>
                               <Button
                                 variant="outline"
                                 onClick={handleCancelPasswordChange}
                                 disabled={isUpdatingPassword}
                                 className="flex-1"
                               >
                                 {t('config.cancel')}
                               </Button>
                             </div>
                           </div>
                         )}
                       </div>

                       <Separator />

                       <div className="space-y-4">

                       </div>
                     </CardContent>
                   </Card>
                 </TabsContent>

        </Tabs>
      </div>

      {/* Save Confirmation Modal */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Save className="h-5 w-5 text-primary" />
              <span>{t('config.confirmSaveTitle')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('config.confirmSaveDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)} 
              className="flex-1 sm:flex-none"
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleConfirmSave} 
              className="flex-1 sm:flex-none"
            >
              <Save className="h-4 w-4 mr-2" />
              {t('config.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CompanyConfiguration;