import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface BankTransaction {
  id: string;
  date: string;
  reference: string;
  amount: number;
  description: string;
  status: 'matched' | 'unmatched' | 'pending';
  matched_invoice?: string;
  matched_amount?: number;
  difference?: number;
}

interface ReconciliationSummary {
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  totalAmount: number;
  matchedAmount: number;
  unmatchedAmount: number;
}

const BankReconciliation: React.FC = () => {
  const { t } = useLanguage();
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<ReconciliationSummary>({
    totalTransactions: 0,
    matchedTransactions: 0,
    unmatchedTransactions: 0,
    totalAmount: 0,
    matchedAmount: 0,
    unmatchedAmount: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV file
  const parseCSV = (csvText: string): BankTransaction[] => {
    const lines = csvText.split('\n');
    const transactions: BankTransaction[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',');
      if (columns.length < 4) continue;
      
      const transaction: BankTransaction = {
        id: `bank_${Date.now()}_${i}`,
        date: columns[0]?.trim() || '',
        reference: columns[1]?.trim() || '',
        amount: parseFloat(columns[2]?.trim() || '0'),
        description: columns[3]?.trim() || '',
        status: 'pending'
      };
      
      transactions.push(transaction);
    }
    
    return transactions;
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsProcessing(true);
      const text = await file.text();
      const transactions = parseCSV(text);
      
      if (transactions.length === 0) {
        toast({
          title: 'No transactions found',
          description: 'The CSV file appears to be empty or invalid',
          variant: 'destructive'
        });
        return;
      }

      setBankTransactions(transactions);
      await matchTransactions(transactions);
      
      toast({
        title: 'File uploaded successfully',
        description: `${transactions.length} transactions imported`,
      });
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast({
        title: 'Error parsing file',
        description: 'Failed to parse the CSV file',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Match transactions with invoices
  const matchTransactions = async (transactions: BankTransaction[]) => {
    try {
      setIsLoading(true);
      
      // Fetch all pending invoices
      const { data: invoices, error } = await supabase
        .from('company_payments')
        .select('id, invoice_number, amount, status')
        .eq('status', 'sent');

      if (error) {
        throw new Error(`Error fetching invoices: ${error.message}`);
      }

      const matchedTransactions = transactions.map(transaction => {
        // Try to match by reference number (invoice number)
        const matchedInvoice = invoices?.find(invoice => 
          invoice.invoice_number === transaction.reference
        );

        if (matchedInvoice) {
          const difference = Math.abs(transaction.amount - matchedInvoice.amount);
          return {
            ...transaction,
            status: difference < 0.01 ? 'matched' : 'unmatched',
            matched_invoice: matchedInvoice.invoice_number,
            matched_amount: matchedInvoice.amount,
            difference: difference
          };
        }

        // Try to match by amount if reference doesn't match
        const amountMatchedInvoice = invoices?.find(invoice => 
          Math.abs(invoice.amount - transaction.amount) < 0.01
        );

        if (amountMatchedInvoice) {
          return {
            ...transaction,
            status: 'unmatched', // Flag for manual review
            matched_invoice: amountMatchedInvoice.invoice_number,
            matched_amount: amountMatchedInvoice.amount,
            difference: Math.abs(transaction.amount - amountMatchedInvoice.amount)
          };
        }

        return {
          ...transaction,
          status: 'unmatched'
        };
      });

      setBankTransactions(matchedTransactions);
      calculateSummary(matchedTransactions);
    } catch (error: any) {
      console.error('Error matching transactions:', error);
      toast({
        title: 'Error matching transactions',
        description: error?.message || 'Failed to match transactions',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate reconciliation summary
  const calculateSummary = (transactions: BankTransaction[]) => {
    const totalTransactions = transactions.length;
    const matchedTransactions = transactions.filter(t => t.status === 'matched').length;
    const unmatchedTransactions = transactions.filter(t => t.status === 'unmatched').length;
    
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const matchedAmount = transactions
      .filter(t => t.status === 'matched')
      .reduce((sum, t) => sum + t.amount, 0);
    const unmatchedAmount = transactions
      .filter(t => t.status === 'unmatched')
      .reduce((sum, t) => sum + t.amount, 0);

    setSummary({
      totalTransactions,
      matchedTransactions,
      unmatchedTransactions,
      totalAmount,
      matchedAmount,
      unmatchedAmount
    });
  };

  // Manual match transaction
  const handleManualMatch = async (transactionId: string, invoiceNumber: string) => {
    try {
      // Find the invoice
      const { data: invoice, error } = await supabase
        .from('company_payments')
        .select('id, invoice_number, amount')
        .eq('invoice_number', invoiceNumber)
        .single();

      if (error || !invoice) {
        toast({
          title: 'Invoice not found',
          description: `Invoice ${invoiceNumber} not found`,
          variant: 'destructive'
        });
        return;
      }

      // Update transaction
      const updatedTransactions = bankTransactions.map(t => 
        t.id === transactionId 
          ? {
              ...t,
              status: 'matched',
              matched_invoice: invoiceNumber,
              matched_amount: invoice.amount,
              difference: Math.abs(t.amount - invoice.amount)
            }
          : t
      );

      setBankTransactions(updatedTransactions);
      calculateSummary(updatedTransactions);

      toast({
        title: 'Transaction matched',
        description: `Transaction matched with invoice ${invoiceNumber}`,
      });
    } catch (error: any) {
      console.error('Error matching transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to match transaction',
        variant: 'destructive'
      });
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'matched':
        return 'default';
      case 'unmatched':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matched':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'unmatched':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bank Reconciliation</h2>
          <p className="text-muted-foreground">Import bank statements and match with invoices</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => setBankTransactions([])}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Import Bank Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Upload CSV File</Label>
              <Input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mt-1"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>CSV format should include columns: Date, Reference, Amount, Description</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {bankTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reconciliation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.totalTransactions}</div>
                <div className="text-sm text-muted-foreground">Total Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.matchedTransactions}</div>
                <div className="text-sm text-muted-foreground">Matched</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.unmatchedTransactions}</div>
                <div className="text-sm text-muted-foreground">Unmatched</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">${summary.totalAmount.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">${summary.matchedAmount.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Matched Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">${summary.unmatchedAmount.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Unmatched Amount</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      {bankTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bank Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Matched Invoice</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell className="font-mono">{transaction.reference}</TableCell>
                      <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(transaction.status)}
                          <Badge variant={getStatusBadgeVariant(transaction.status)}>
                            {transaction.status.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.matched_invoice ? (
                          <span className="font-mono">{transaction.matched_invoice}</span>
                        ) : (
                          <span className="text-muted-foreground">Not matched</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.status === 'unmatched' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const invoiceNumber = prompt('Enter invoice number to match:');
                              if (invoiceNumber) {
                                handleManualMatch(transaction.id, invoiceNumber);
                              }
                            }}
                          >
                            Match
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default BankReconciliation;
