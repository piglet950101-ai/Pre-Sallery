import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, AlertCircle, FileText, Building2, Calendar, DollarSign } from 'lucide-react';

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
  period?: string;
  advances_amount?: number;
  employee_fees?: number;
  commission_fees?: number;
}

interface InvoiceDetailModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsPaid: () => void;
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onMarkAsPaid
}) => {
  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'sent':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      case 'draft':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'sent':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'draft':
        return <FileText className="h-5 w-5 text-gray-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getStatusIcon(invoice.status)}
            Invoice Details - {invoice.invoice_number}
            <Badge variant={getStatusBadgeVariant(invoice.status)}>
              {invoice.status.toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View detailed information about this invoice including company details, payment information, and breakdown.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                  <p className="text-lg font-semibold">{invoice.company_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">RIF</label>
                  <p className="text-lg font-semibold">{invoice.company_rif}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                  <p className="text-lg font-semibold">{invoice.invoice_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className="text-lg font-semibold text-green-600">${invoice.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                  <p className="text-lg">{new Date(invoice.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                  <p className="text-lg">{new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>
                {invoice.period && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Billing Period</label>
                    <p className="text-lg font-semibold">{invoice.period}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information (if paid) */}
          {invoice.status === 'paid' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Paid Date</label>
                    <p className="text-lg font-semibold">
                      {invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Reference</label>
                    <p className="text-lg font-semibold">{invoice.payment_reference || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Confirmed by</label>
                    <p className="text-lg font-semibold">{invoice.operator_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Proof</label>
                    {invoice.payment_proof_url ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(invoice.payment_proof_url, '_blank')}
                      >
                        View Proof
                      </Button>
                    ) : (
                      <p className="text-lg">No proof uploaded</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Invoice Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Advances Amount</span>
                  <span className="font-semibold">${(invoice.advances_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Commission Fees</span>
                  <span className="font-semibold">${(invoice.commission_fees || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Employee Fees</span>
                  <span className="font-semibold">${(invoice.employee_fees || 0).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount</span>
                  <span>${invoice.amount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {invoice.status === 'sent' && (
              <Button onClick={onMarkAsPaid} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Paid
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailModal;
