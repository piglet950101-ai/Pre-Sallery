import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Building2, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  Clock,
  UserX,
  UserCheck,
  Trash2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  rif: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  is_approved: boolean;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  rejected_at?: string;
  rejected_by?: string;
  total_transactions: number;
  outstanding_balance: number;
  employee_count: number;
  last_activity?: string;
  auth_user_id?: string;
  auth_email?: string;
}

const CompanyManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyDetail, setShowCompanyDetail] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'revoke' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch companies from Supabase
  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      
      // Get companies with auth user email using the view
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies_with_auth')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesError) {
        throw new Error(`Error fetching companies: ${companiesError.message}`);
      }

      // Transform data to include calculated fields
      const transformedCompanies: Company[] = await Promise.all((companiesData || []).map(async (company: any) => {
        // Get employee count for this company
        const { count: employeeCount } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id);

        // Get total transactions for this company
        const { data: transactionsData } = await supabase
          .from('advance_transactions')
          .select('requested_amount')
          .eq('company_id', company.id);

        const totalTransactions = transactionsData?.reduce((sum: number, transaction: any) => 
          sum + (transaction.requested_amount || 0), 0) || 0;
        
        // Calculate outstanding balance (simplified - in real app, this would be more complex)
        const outstandingBalance = totalTransactions * 0.05; // 5% of total transactions as outstanding

        return {
          id: company.id,
          name: company.name,
          rif: company.rif,
          email: company.email,
          phone: company.phone,
          address: company.address,
          city: company.city,
          state: company.state,
          postal_code: company.postal_code,
          is_approved: company.is_approved || false,
          created_at: company.created_at,
          approved_at: company.approved_at,
          approved_by: company.approved_by,
          rejection_reason: company.rejection_reason,
          rejected_at: company.rejected_at,
          rejected_by: company.rejected_by,
          total_transactions: totalTransactions,
          outstanding_balance: outstandingBalance,
          employee_count: employeeCount || 0,
          last_activity: company.updated_at,
          auth_user_id: company.auth_user_id,
          auth_email: company.auth_email
        };
      }));

      setCompanies(transformedCompanies);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      toast({
        title: t('common.error'),
        description: error?.message || 'Failed to fetch companies',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter companies based on search and filters
  useEffect(() => {
    let filtered = companies;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.rif.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.auth_email && company.auth_email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(company => {
        if (statusFilter === 'approved') return company.is_approved;
        if (statusFilter === 'pending') return !company.is_approved && !company.rejection_reason;
        if (statusFilter === 'rejected') return !company.is_approved && company.rejection_reason;
        return true;
      });
    }

    setFilteredCompanies(filtered);
  }, [companies, searchTerm, statusFilter]);

  // Handle company approval
  const handleApproval = async (company: Company) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: 'operator' // In real app, this would be the actual operator ID
        })
        .eq('id', company.id);

      if (error) {
        throw new Error(`Error approving company: ${error.message}`);
      }

      toast({
        title: t('operator.companyApproved'),
        description: t('operator.companyApprovedDesc').replace('{companyName}', company.name),
      });

      fetchCompanies();
      setShowApprovalModal(false);
      setSelectedCompany(null);
    } catch (error: any) {
      console.error('Error approving company:', error);
      toast({
        title: t('common.error'),
        description: error?.message || 'Failed to approve company',
        variant: 'destructive'
      });
    }
  };

  // Handle company rejection
  const handleRejection = async (company: Company) => {
    try {
      const isRevocation = actionType === 'revoke';
      
      // Ensure we have a rejection reason
      if (!rejectionReason.trim()) {
        toast({
          title: t('common.error'),
          description: t('operator.rejectionReasonRequired'),
          variant: 'destructive'
        });
        return;
      }
      
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData = {
        is_approved: false,
        rejection_reason: rejectionReason.trim(),
        rejected_at: new Date().toISOString(),
        rejected_by: user?.id || null,
        // Clear approval fields when revoking
        approved_at: isRevocation ? null : company.approved_at,
        approved_by: isRevocation ? null : company.approved_by
      };
      
      
      const { data: updateResult, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', company.id)
        .select();


      if (error) {
        throw new Error(`Error ${isRevocation ? 'revoking' : 'rejecting'} company: ${error.message}`);
      }

      // Update local state
      setCompanies(prevCompanies => 
        prevCompanies.map(c => 
          c.id === company.id 
            ? { 
                ...c, 
                is_approved: false, 
                rejection_reason: rejectionReason,
                rejected_at: new Date().toISOString(),
                approved_at: isRevocation ? null : c.approved_at,
                approved_by: isRevocation ? null : c.approved_by
              }
            : c
        )
      );

      toast({
        title: isRevocation ? t('operator.accessRevoked') : t('operator.companyRejected'),
        description: isRevocation 
          ? t('operator.accessRevokedDesc').replace('{companyName}', company.name)
          : t('operator.companyRejectedDesc').replace('{companyName}', company.name),
        variant: 'destructive'
      });

      setShowRejectionModal(false);
      setSelectedCompany(null);
      setRejectionReason('');
      setActionType(null);
      
      // Refresh the companies list to ensure data is up to date
      await fetchCompanies();
    } catch (error: any) {
      console.error(`Error ${actionType === 'revoke' ? 'revoking' : 'rejecting'} company:`, error);
      toast({
        title: t('common.error'),
        description: error?.message || `Failed to ${actionType === 'revoke' ? 'revoke' : 'reject'} company`,
        variant: 'destructive'
      });
    }
  };

  // Handle view company
  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowCompanyDetail(true);
  };


  // Handle delete company
  const handleDeleteCompany = (company: Company) => {
    // TODO: Implement delete company functionality
  };

  // Handle toggle permission (grant/revoke access)
  const handleTogglePermission = async (company: Company) => {
    if (company.is_approved) {
      // If company is approved, show confirmation modal for revoking
      setSelectedCompany(company);
      setActionType('revoke');
      setShowRejectionModal(true);
    } else {
      // If company is pending, show confirmation modal for granting
      setSelectedCompany(company);
      setActionType('approve');
      setShowApprovalModal(true);
    }
  };


  // Get status badge variant
  const getStatusBadgeVariant = (isApproved: boolean, rejectionReason?: string) => {
    if (isApproved) return 'default';
    if (rejectionReason) return 'destructive';
    return 'secondary';
  };

  // Get status icon
  const getStatusIcon = (isApproved: boolean) => {
    return isApproved ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <Clock className="h-4 w-4 text-orange-600" />;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'en' ? 'en-US' : 'es-ES';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t('operator.loadingCompanies')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('operator.companyManagement')}</h2>
          <p className="text-muted-foreground">{t('operator.companyManagementDesc')}</p>
        </div>
        <Button onClick={fetchCompanies} variant="outline">
          <Search className="h-4 w-4 mr-2" />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t('operator.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('operator.searchCompanies')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">{t('operator.allStatuses')}</option>
              <option value="pending">{t('operator.pendingApproval')}</option>
              <option value="approved">{t('operator.approved')}</option>
              <option value="rejected">{t('operator.rejected')}</option>
            </select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
            >
              {t('operator.clearFilters')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Companies List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {t('operator.companies')} ({filteredCompanies.length})
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {t('operator.showing')} {filteredCompanies.length} {t('common.of')} {companies.length}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('operator.noCompaniesFound')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">{company.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {company.auth_email || company.email || company.rif}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="font-medium">${company.total_transactions.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {company.is_approved ? t('operator.approved') : 
                         company.rejection_reason ? t('operator.rejected') : t('operator.pending')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {company.is_approved ? (
                        <Badge className="bg-green-100 text-green-800">{t('operator.active')}</Badge>
                      ) : company.rejection_reason ? (
                        <Badge variant="destructive">{t('operator.rejected')}</Badge>
                      ) : (
                        <Badge variant="secondary">{t('operator.pending')}</Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCompany(company);
                          setShowCompanyDetail(true);
                        }}
                        title={t('operator.viewCompany')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePermission(company)}
                        title={company.is_approved ? t('operator.revokeAccess') : t('operator.grantAccess')}
                      >
                        {company.is_approved ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteCompany(company)}
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Detail Modal */}
      {selectedCompany && (
        <Dialog open={showCompanyDetail} onOpenChange={setShowCompanyDetail}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Building2 className="h-5 w-5" />
                {selectedCompany.name}
                <Badge variant={getStatusBadgeVariant(selectedCompany.is_approved, selectedCompany.rejection_reason)}>
                  {selectedCompany.is_approved ? t('operator.approved') : 
                   selectedCompany.rejection_reason ? t('operator.rejected') : t('operator.pending')}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                {t('operator.companyDetailsDesc')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {t('operator.companyInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('operator.companyName')}</label>
                      <p className="text-lg font-semibold">{selectedCompany.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('operator.rif')}</label>
                      <p className="text-lg font-semibold">{selectedCompany.rif}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('operator.email')}</label>
                      <p className="text-lg font-semibold">{selectedCompany.auth_email || selectedCompany.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('operator.phone')}</label>
                      <p className="text-lg font-semibold">{selectedCompany.phone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">{t('operator.address')}</label>
                      <p className="text-lg font-semibold">
                        {selectedCompany.address}, {selectedCompany.city}, {selectedCompany.state} {selectedCompany.postal_code}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {t('operator.financialInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">${selectedCompany.total_transactions.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">{t('operator.totalTransactions')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">${selectedCompany.outstanding_balance.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">{t('operator.outstandingBalance')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedCompany.employee_count}</div>
                      <div className="text-sm text-muted-foreground">{t('operator.totalEmployees')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registration Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {t('operator.registrationInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('operator.registeredOn')}</label>
                      <p className="text-lg font-semibold">{formatDate(selectedCompany.created_at)}</p>
                    </div>
                    {selectedCompany.approved_at && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('operator.approvedOn')}</label>
                        <p className="text-lg font-semibold">{formatDate(selectedCompany.approved_at)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Approval/Grant Confirmation Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {actionType === 'approve' ? t('operator.grantAccess') : t('operator.approveCompany')}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? t('operator.grantAccessConfirmDesc').replace('{companyName}', selectedCompany?.name || '')
                : t('operator.approveCompanyDesc').replace('{companyName}', selectedCompany?.name || '')
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowApprovalModal(false);
                setActionType(null);
              }}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => selectedCompany && handleApproval(selectedCompany)}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {actionType === 'approve' ? t('operator.grant') : t('operator.approve')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection/Revocation Confirmation Modal */}
      <Dialog open={showRejectionModal} onOpenChange={setShowRejectionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              {actionType === 'revoke' ? t('operator.revokeAccess') : t('operator.rejectCompany')}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'revoke' 
                ? t('operator.revokeAccessDesc').replace('{companyName}', selectedCompany?.name || '')
                : t('operator.rejectCompanyDesc').replace('{companyName}', selectedCompany?.name || '')
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {actionType === 'revoke' ? t('operator.revocationReason') : t('operator.rejectionReason')}
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
                placeholder={actionType === 'revoke' ? t('operator.revocationReasonPlaceholder') : t('operator.rejectionReasonPlaceholder')}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                  setActionType(null);
                }}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedCompany && handleRejection(selectedCompany)}
                disabled={!rejectionReason.trim()}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {actionType === 'revoke' ? t('operator.revoke') : t('operator.reject')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyManagement;
