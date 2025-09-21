import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  invoice_number: string;
  company_name: string;
  company_rif: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
  paid_date?: string;
  payment_reference?: string;
  operator_name?: string;
  payment_proof_url?: string;
}

interface PaymentConfirmationModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onConfirm
}) => {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Get current operator name (you might want to get this from auth context)
  const operatorName = 'Operator Name'; // TODO: Get from auth context

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF, JPG, or PNG file',
          variant: 'destructive'
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 10MB',
          variant: 'destructive'
        });
        return;
      }

      setUploadedFile(file);
      setUploadedFileName(file.name);
    }
  };

  const uploadPaymentProof = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${invoice.invoice_number}_payment_proof_${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('operator-documents')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data } = supabase.storage
        .from('operator-documents')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      throw error;
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentReference.trim()) {
      toast({
        title: 'Payment Reference Required',
        description: 'Please enter the transfer reference number',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsProcessing(true);

      let paymentProofUrl = null;
      
      // Upload payment proof if provided
      if (uploadedFile) {
        paymentProofUrl = await uploadPaymentProof(uploadedFile);
      }

      // Update invoice status to paid
      const { error: updateError } = await supabase
        .from('company_payments')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
          payment_reference: paymentReference,
          operator_name: operatorName,
          payment_proof_url: paymentProofUrl,
          payment_notes: paymentNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      if (updateError) {
        throw new Error(`Failed to update invoice: ${updateError.message}`);
      }

      // Create audit log entry
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          resource_type: 'company_payment',
          resource_id: invoice.id,
          action: 'payment_confirmed',
          old_values: { status: 'sent' },
          new_values: { 
            status: 'paid', 
            payment_reference: paymentReference,
            operator_name: operatorName,
            paid_date: new Date().toISOString().split('T')[0]
          },
          user_id: null, // TODO: Get from auth context
          user_type: 'operator',
          category: 'payment',
          severity: 'info',
          details: `Invoice ${invoice.invoice_number} marked as paid by ${operatorName}. Reference: ${paymentReference}`,
          ip_address: null,
          user_agent: navigator.userAgent
        });

      if (auditError) {
        console.warn('Failed to create audit log:', auditError);
        // Don't fail the operation for audit log errors
      }

      toast({
        title: 'Payment Confirmed',
        description: `Invoice ${invoice.invoice_number} has been marked as paid`,
      });

      onConfirm();
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to confirm payment',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setPaymentReference('');
      setPaymentNotes('');
      setUploadedFile(null);
      setUploadedFileName('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Confirm Payment - {invoice.invoice_number}
          </DialogTitle>
          <DialogDescription>
            Mark this invoice as paid by providing payment details and uploading proof of payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Company</Label>
                  <p className="font-semibold">{invoice.company_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                  <p className="font-semibold text-green-600">${invoice.amount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="payment-reference">Transfer Reference Number *</Label>
                <Input
                  id="payment-reference"
                  placeholder="Enter transfer reference number"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="payment-notes">Notes (Optional)</Label>
                <Textarea
                  id="payment-notes"
                  placeholder="Add any additional notes about this payment"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Proof Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Proof (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <Label htmlFor="payment-proof" className="cursor-pointer">
                    <span className="text-sm font-medium">Upload Payment Proof</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, JPG, or PNG (max 10MB)
                    </p>
                  </Label>
                  <Input
                    id="payment-proof"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {uploadedFileName && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{uploadedFileName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedFile(null);
                        setUploadedFileName('');
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Confirmation Warning */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Confirm Payment Details
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Please verify that the transfer reference number matches the bank statement 
                    and the amount is correct before confirming this payment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isProcessing || !paymentReference.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentConfirmationModal;
