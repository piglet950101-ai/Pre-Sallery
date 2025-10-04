import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Check, X, Image as ImageIcon, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentConfirmationProps {
  request: {
    id: string;
    requested_amount: number;
    net_amount: number;
    payment_method: string;
    payment_details: string;
    employee: {
      first_name: string;
      last_name: string;
      cedula?: string;
      phone?: string;
    };
    company: {
      name: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  request,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [status, setStatus] = useState<'completada' | 'rechazada' | ''>('');
  const [confirmationFile, setConfirmationFile] = useState<File | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image (JPG, PNG, WebP) or PDF file',
          variant: 'destructive'
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 5MB',
          variant: 'destructive'
        });
        return;
      }

      setConfirmationFile(file);
    }
  };

  const uploadConfirmationFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${request.id}_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('payment-confirmations')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('payment-confirmations')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const sendNotificationToEmployee = async (status: 'completada' | 'rechazada', confirmationUrl?: string) => {
    try {
      // Create notification for employee
      await supabase
        .from('notifications')
        .insert({
          type: 'payment_status',
          title: status === 'completada' ? 'Payment Completed' : 'Payment Rejected',
          message: status === 'completada' 
            ? `Your advance payment of $${(request.requested_amount * 0.95).toFixed(2)} has been processed successfully.`
            : `Your advance payment request has been rejected. Reason: ${rejectionReason}`,
          severity: status === 'completada' ? 'success' : 'error',
          metadata: {
            advance_request_id: request.id,
            amount: request.requested_amount,
            net_amount: request.requested_amount * 0.95,
            status,
            confirmation_url: confirmationUrl,
            rejection_reason: status === 'rechazada' ? rejectionReason : undefined
          }
        });

      // Also send notification to company
      const { data: employeeData } = await supabase
        .from('employees')
        .select('company_id')
        .eq('id', request.id)
        .single();

      if (employeeData?.company_id) {
        await supabase
          .from('notifications')
          .insert({
            type: 'employee_payment_status',
            title: `Employee Payment ${status === 'completada' ? 'Completed' : 'Rejected'}`,
            message: `Payment for ${request.employee.first_name} ${request.employee.last_name} has been ${status}.`,
            severity: status === 'completada' ? 'info' : 'warning',
            metadata: {
              advance_request_id: request.id,
              employee_name: `${request.employee.first_name} ${request.employee.last_name}`,
              amount: request.requested_amount,
              net_amount: request.requested_amount * 0.95,
              status,
              confirmation_url: confirmationUrl,
              rejection_reason: status === 'rechazada' ? rejectionReason : undefined
            }
          });
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      // Don't throw - notification failure shouldn't block payment processing
    }
  };

  const handleSubmit = async () => {
    if (!status) {
      toast({
        title: 'Status required',
        description: 'Please select whether the payment was completed or rejected',
        variant: 'destructive'
      });
      return;
    }

    if (status === 'completada' && !confirmationFile) {
      toast({
        title: 'Confirmation required',
        description: 'Please upload a payment confirmation image for completed payments',
        variant: 'destructive'
      });
      return;
    }

    if (status === 'rechazada' && !rejectionReason.trim()) {
      toast({
        title: 'Rejection reason required',
        description: 'Please provide a reason for rejecting the payment',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUploading(true);

      let confirmationUrl = '';
      
      // Upload confirmation file if provided
      if (confirmationFile) {
        confirmationUrl = await uploadConfirmationFile(confirmationFile);
      }

      // Get current user for processed_by field
      const { data: { user } } = await supabase.auth.getUser();

      // Update the advance transaction
      const updateData: any = {
        status,
        processed_at: new Date().toISOString(),
        processed_by: user?.id
      };

      if (confirmationUrl) {
        updateData.payment_confirmation_url = confirmationUrl;
        updateData.payment_confirmation_uploaded_at = new Date().toISOString();
        updateData.payment_confirmation_uploaded_by = user?.id;
      }

      if (status === 'rechazada') {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('advance_transactions')
        .update(updateData)
        .eq('id', request.id);

      if (error) throw error;

      // Send notifications
      await sendNotificationToEmployee(status, confirmationUrl);

      toast({
        title: 'Success',
        description: `Payment ${status === 'completada' ? 'completed' : 'rejected'} successfully`,
      });

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Error processing payment confirmation:', error);
      toast({
        title: 'Error',
        description: `Failed to process payment: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const netAmount = request.requested_amount * 0.95; // 5% fee deduction

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment Confirmation</DialogTitle>
          <DialogDescription>
            Process payment for {request.employee.first_name} {request.employee.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Details Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Employee</Label>
                  <p className="font-medium">{request.employee.first_name} {request.employee.last_name}</p>
                  {request.employee.cedula && <p className="text-muted-foreground">Cedula: {request.employee.cedula}</p>}
                </div>
                <div>
                  <Label className="text-muted-foreground">Company</Label>
                  <p className="font-medium">{request.company.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Method</Label>
                  <Badge variant={request.payment_method === 'pagomovil' ? 'default' : 'secondary'}>
                    {request.payment_method === 'pagomovil' ? 'PagoMóvil' : 'Bank Transfer'}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">{request.payment_details}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <div className="space-y-1">
                    <p className="text-sm">Requested: <span className="font-mono">${request.requested_amount.toFixed(2)}</span></p>
                    <p className="text-sm text-muted-foreground">Fee (5%): <span className="font-mono">-${(request.requested_amount * 0.05).toFixed(2)}</span></p>
                    <p className="font-medium text-green-600">Net: <span className="font-mono">${netAmount.toFixed(2)}</span></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Selection */}
          <div className="space-y-4">
            <Label>Payment Status</Label>
            <Select value={status} onValueChange={(value: 'completada' | 'rechazada') => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completada">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Completada (Payment Successful)
                  </div>
                </SelectItem>
                <SelectItem value="rechazada">
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600" />
                    Rechazada (Payment Failed)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Confirmation Upload for Completed Payments */}
          {status === 'completada' && (
            <div className="space-y-4">
              <Label>Payment Confirmation</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  {confirmationFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        {confirmationFile.type.startsWith('image/') ? (
                          <ImageIcon className="h-8 w-8 text-green-600" />
                        ) : (
                          <FileText className="h-8 w-8 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm font-medium">{confirmationFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(confirmationFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Upload Confirmation
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Upload screenshot or photo of payment confirmation
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Rejection Reason for Failed Payments */}
          {status === 'rechazada' && (
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="Please explain why the payment was rejected (e.g., account suspended, system down, insufficient funds, etc.)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isUploading || !status}
              className="min-w-[120px]"
            >
              {isUploading ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentConfirmation;
