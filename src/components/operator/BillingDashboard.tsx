import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Eye, CheckCircle, Clock, AlertCircle, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import InvoiceDetailModal from './InvoiceDetailModal';
import PaymentConfirmationModal from './PaymentConfirmationModal';

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

const BillingDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch invoices from Supabase
  const fetchInvoices = async (page: number = 1) => {
    try {
      setIsLoading(true);
      
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error, count } = await supabase
        .from('company_payments')
        .select(`
          *,
          companies!inner(
            name,
            rif
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(`Error fetching invoices: ${error.message}`);
      }

      // Set total items for pagination
      setTotalItems(count || 0);
      setCurrentPage(page);

      // Calculate breakdown for each invoice
      const transformedInvoices: Invoice[] = await Promise.all((data || []).map(async (payment: any) => {
        // Get advances for this company in the billing period
        const { data: advancesData } = await supabase
          .from('advance_transactions')
          .select('requested_amount, fee_amount, created_at')
          .eq('company_id', payment.company_id)
          .gte('created_at', payment.created_at.split('T')[0])
          .lte('created_at', payment.due_date);

        // Get active employees count for this company
        const { data: employeesData } = await supabase
          .from('employees')
          .select('id, is_active')
          .eq('company_id', payment.company_id)
          .eq('is_active', true);

        // Calculate breakdown
        const advances_amount = advancesData?.reduce((sum, advance) => sum + advance.requested_amount, 0) || 0;
        const commission_fees = advancesData?.reduce((sum, advance) => sum + advance.fee_amount, 0) || 0;
        const employee_fees = (employeesData?.length || 0) * 1.00; // $1 per active employee

        return {
          id: payment.id,
          invoice_number: payment.invoice_number,
          company_name: payment.companies?.name || 'Unknown Company',
          company_rif: payment.companies?.rif || 'Unknown RIF',
          amount: payment.amount,
          status: payment.status === 'paid' ? 'paid' : 
                  payment.status === 'pending' ? 'sent' : 'draft',
          due_date: payment.due_date,
          created_at: payment.created_at,
          paid_date: payment.paid_date,
          payment_reference: payment.payment_reference,
          operator_name: payment.operator_name,
          payment_proof_url: payment.payment_proof_url,
          period: payment.period,
          advances_amount,
          employee_fees,
          commission_fees
        };
      }));

      setInvoices(transformedInvoices);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast({
        title: t('common.error'),
        description: error?.message || 'Failed to fetch invoices',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter invoices based on search and filters
  useEffect(() => {
    let filtered = invoices;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.company_rif.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Company filter
    if (companyFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.company_name === companyFilter);
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter, companyFilter]);

  // Calculate pagination values
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchInvoices(page);
    }
  };

  // Get unique companies for filter
  const uniqueCompanies = Array.from(new Set(invoices.map(invoice => invoice.company_name)));

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
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  // Handle invoice click
  const handleInvoiceClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetail(true);
  };

  // Handle mark as paid
  const handleMarkAsPaid = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  // Handle payment confirmation
  const handlePaymentConfirmed = () => {
    fetchInvoices(currentPage); // Refresh the current page
    setShowPaymentModal(false);
    setSelectedInvoice(null);
  };

  useEffect(() => {
    fetchInvoices(1);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Billing Dashboard</h2>
          <p className="text-muted-foreground">Manage company invoices and payments</p>
        </div>
        <Button onClick={() => fetchInvoices(1)} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            {/* Company Filter */}
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {uniqueCompanies.map(company => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCompanyFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Invoices ({totalItems} total)
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{endIndex} of {totalItems}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No invoices found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(invoice.status)}
                    <div>
                      <div className="font-medium">{invoice.invoice_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.company_name} ({invoice.company_rif})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-medium">${invoice.amount.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </div>
                    </div>

                    <Badge variant={getStatusBadgeVariant(invoice.status)}>
                      {invoice.status.toUpperCase()}
                    </Badge>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInvoiceClick(invoice)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>

                      {invoice.status === 'sent' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleMarkAsPaid(invoice)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Paid
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedInvoice && (
        <>
          <InvoiceDetailModal
            invoice={selectedInvoice}
            isOpen={showInvoiceDetail}
            onClose={() => setShowInvoiceDetail(false)}
            onMarkAsPaid={() => {
              setShowInvoiceDetail(false);
              setShowPaymentModal(true);
            }}
          />

          <PaymentConfirmationModal
            invoice={selectedInvoice}
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onConfirm={handlePaymentConfirmed}
          />
        </>
      )}
    </div>
  );
};

export default BillingDashboard;
