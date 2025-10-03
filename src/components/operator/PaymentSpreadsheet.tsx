import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import PaymentConfirmation from './PaymentConfirmation';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentRequest {
  id: string;
  requested_amount: number;
  fee_amount: number;
  net_amount: number;
  payment_method: 'pagomovil' | 'bank_transfer';
  payment_details: string;
  status: string;
  created_at: string;
  employee: {
    first_name: string;
    last_name: string;
    cedula: string;
    phone: string;
    bank_name: string;
    account_number: string;
    account_type: string;
  };
  company: {
    name: string;
  };
}

const PaymentSpreadsheet: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const fetchApprovedRequests = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('advance_transactions')
        .select(`
          id,
          requested_amount,
          fee_amount,
          net_amount,
          payment_method,
          payment_details,
          status,
          created_at,
          employee:employees!inner (
            first_name,
            last_name,
            cedula,
            phone,
            bank_name,
            account_number,
            account_type
          ),
          company:companies!inner (
            name
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setPaymentRequests((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching payment requests:', error);
      toast({
        title: 'Error',
        description: `Failed to load payment requests: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedRequests();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const getBatchInfo = (date: Date) => {
    // Use America/Caracas timezone explicitly
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Caracas',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const parts = fmt.formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
    const y = get('year');
    const m = get('month');
    const d = get('day');
    const hours = Number(get('hour'));
    const minutes = Number(get('minute'));

    // Batching rules in Caracas local time
    if (hours < 10 || (hours === 10 && minutes === 0)) {
      return { label: '11:00 AM Today', sortKey: `${y}-${m}-${d}-A11` };
    }
    if ((hours === 10 && minutes >= 1) || (hours > 10 && hours < 14) || (hours === 14 && minutes === 0)) {
      return { label: '3:00 PM Today', sortKey: `${y}-${m}-${d}-B15` };
    }

    // Next day in Caracas
    const base = new Date(fmt.format(date)); // formatted date string but time part present; safer to compute next day via parts
    const next = new Date(date);
    // advance by ~1 day in Caracas terms
    next.setUTCDate(next.getUTCDate() + 1);
    const partsNext = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Caracas',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(next);
    const ny = partsNext.find(p => p.type === 'year')?.value ?? y;
    const nm = partsNext.find(p => p.type === 'month')?.value ?? m;
    const nd = partsNext.find(p => p.type === 'day')?.value ?? d;
    return { label: '11:00 AM Next Day', sortKey: `${ny}-${nm}-${nd}-A11` };
  };

  const handleExportXLSX = () => {
    const header = [
      'Employee Name',
      'Cedula',
      'Phone',
      'Payment Method',
      'Bank Name',
      'Account Number',
      'Account Type',
      'PagoMovil Phone',
      'Batch',
      'Company',
      'Requested Amount ($)',
      'Fee (5%)',
      'Net Amount ($)',
      'Net Amount (VES)',
      'Date',
      'Request ID'
    ];

    const rows = paymentRequests.map((request) => {
      const netAmountWithFee = request.requested_amount * 0.95;
      const exchangeRate = 36.5; // TODO: inject real rate
      const netAmountVES = netAmountWithFee * exchangeRate;
      const batch = getBatchInfo(new Date(request.created_at));
      const emp: any = (request as any).employee || {};
      const comp: any = (request as any).company || {};

      return [
        `${emp.first_name ?? 'N/A'} ${emp.last_name ?? ''}`.trim(),
        emp.cedula || 'N/A',
        emp.phone || 'N/A',
        request.payment_method === 'pagomovil' ? 'PagoMóvil' : 'Bank Transfer',
        request.payment_method === 'bank_transfer' ? (emp.bank_name || 'N/A') : 'N/A',
        request.payment_method === 'bank_transfer' ? (emp.account_number || 'N/A') : 'N/A',
        request.payment_method === 'bank_transfer' ? (emp.account_type || 'N/A') : 'N/A',
        request.payment_method === 'pagomovil' ? (request.payment_details || 'N/A') : 'N/A',
        batch.label,
        comp.name || 'N/A',
        request.requested_amount,
        (request.requested_amount * 0.05),
        netAmountWithFee,
        netAmountVES,
        new Intl.DateTimeFormat('en-VE', { timeZone: 'America/Caracas' }).format(new Date(request.created_at)),
        request.id,
      ];
    });

    const aoa = [header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // Set friendly column widths
    ws['!cols'] = [
      { wch: 24 }, // Employee Name
      { wch: 14 }, // Cedula
      { wch: 16 }, // Phone
      { wch: 16 }, // Method
      { wch: 22 }, // Bank Name
      { wch: 22 }, // Account Number
      { wch: 14 }, // Account Type
      { wch: 18 }, // PagoMovil Phone
      { wch: 16 }, // Batch
      { wch: 24 }, // Company
      { wch: 18 }, // Requested
      { wch: 12 }, // Fee
      { wch: 18 }, // Net USD
      { wch: 20 }, // Net VES
      { wch: 14 }, // Date
      { wch: 38 }, // Request ID
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    XLSX.writeFile(wb, `payment-requests-${new Date().toISOString().slice(0,10)}.xlsx`);

    toast({ title: 'Success', description: 'Payment spreadsheet exported (XLSX) with adjusted column widths' });
  };

  const handlePaymentAction = (request: PaymentRequest) => {
    setSelectedRequest(request);
    setShowConfirmationModal(true);
  };

  const handleConfirmationSuccess = () => {
    fetchApprovedRequests(); // Refresh the list
    setSelectedRequest(null);
    setShowConfirmationModal(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">Payment Processing Spreadsheet</CardTitle>
              <CardDescription>
                Approved advance requests ready for manual payment processing
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={fetchApprovedRequests}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={handleExportXLSX}
                disabled={paymentRequests.length === 0}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export XLSX
              </Button>
              <Button 
                onClick={handlePrint}
                disabled={paymentRequests.length === 0}
                size="sm"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paymentRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isLoading ? 'Loading...' : 'No approved payment requests found'}
            </div>
          ) : (
            <div className="print-content">
              <style>{`
                @media print {
                  .print-content {
                    font-size: 12px;
                  }
                  .print-content table {
                    width: 100%;
                    border-collapse: collapse;
                  }
                  .print-content th,
                  .print-content td {
                    border: 1px solid #000;
                    padding: 4px;
                    text-align: left;
                  }
                  .print-content th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                  }
                }
              `}</style>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Cedula</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Net (After 5% Fee)</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="print:hidden">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentRequests
                    .slice()
                    .sort((a, b) => {
                      const A = getBatchInfo(new Date(a.created_at));
                      const B = getBatchInfo(new Date(b.created_at));
                      return A.sortKey.localeCompare(B.sortKey);
                    })
                    .map((request) => {
                    const netAmountWithFee = request.requested_amount * 0.95;
                    const emp = (request as any).employee || {};
                    const comp = (request as any).company || {};
                    const batch = getBatchInfo(new Date(request.created_at));
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {emp.first_name ?? 'N/A'} {emp.last_name ?? ''}
                        </TableCell>
                        <TableCell>{emp.cedula || 'N/A'}</TableCell>
                        <TableCell>{emp.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={request.payment_method === 'pagomovil' ? 'default' : 'secondary'}>
                            {request.payment_method === 'pagomovil' ? 'PagoMóvil' : 'Bank Transfer'}
                          </Badge>
                          {request.payment_method === 'pagomovil' && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {request.payment_details}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {request.payment_method === 'bank_transfer' ? (
                            <div className="text-sm">
                              <div className="font-medium">{emp.bank_name || 'N/A'}</div>
                              <div className="text-muted-foreground">
                                {(emp.account_number || 'N/A')} ({emp.account_type || 'N/A'})
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{batch.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{comp.name || 'N/A'}</TableCell>
                        <TableCell className="font-mono">
                          ${request.requested_amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-mono font-medium text-green-600">
                          ${netAmountWithFee.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Intl.DateTimeFormat('en-VE', { timeZone: 'America/Caracas' }).format(new Date(request.created_at))}
                        </TableCell>
                        <TableCell className="print:hidden">
                          <Badge variant="outline">{request.status}</Badge>
                        </TableCell>
                        
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              <div className="mt-6 print:block hidden">
                <div className="text-sm text-muted-foreground">
                  <p><strong>Instructions for Manual Payment Processing:</strong></p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Process payments according to the specified payment method</li>
                    <li>For PagoMóvil: Use the phone number listed in Payment Method column</li>
                    <li>For Bank Transfer: Use the bank details in Bank Details column</li>
                    <li>Pay the Net Amount (after 5% fee deduction)</li>
                    <li>Take a screenshot/photo of payment confirmation</li>
                    <li>Upload payment confirmation in the system and mark as "completada"</li>
                    <li>If payment fails, mark as "rechazada" with reason</li>
                  </ol>
                  <p className="mt-4 text-xs">
                    Generated on: {new Date().toLocaleString()} | 
                    Total Requests: {paymentRequests.length} | 
                    Total Amount: ${paymentRequests.reduce((sum, req) => sum + req.requested_amount, 0).toFixed(2)} | 
                    Total Net (After Fees): ${paymentRequests.reduce((sum, req) => sum + (req.requested_amount * 0.95), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Confirmation Modal */}
      {selectedRequest && (
        <PaymentConfirmation
          request={selectedRequest}
          isOpen={showConfirmationModal}
          onClose={() => {
            setShowConfirmationModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={handleConfirmationSuccess}
        />
      )}
    </div>
  );
};

export default PaymentSpreadsheet;
