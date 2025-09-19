import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Eye,
  MoreHorizontal,
  Check,
  X,
  RefreshCw
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { changeRequestService, ChangeRequest, ChangeRequestFilters } from "@/services/changeRequestService";
import { auditService } from "@/services/auditService";

const AdminChangeRequests = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<ChangeRequestFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  // Load change requests
  const loadChangeRequests = async () => {
    try {
      setIsLoading(true);
      
      const filterParams: ChangeRequestFilters = {
        ...filters,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? [statusFilter] : undefined,
        category: categoryFilter !== 'all' ? [categoryFilter] : undefined,
        priority: priorityFilter !== 'all' ? [priorityFilter] : undefined,
      };

      const result = await changeRequestService.getChangeRequests(filterParams, currentPage, itemsPerPage);
      
      if (result.success && result.data) {
        setChangeRequests(result.data);
        setTotalCount(result.total || 0);
        setTotalPages(Math.ceil((result.total || 0) / itemsPerPage));
      } else {
        toast({
          title: t('common.error'),
          description: result.error || 'Failed to load change requests',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading change requests:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to load change requests',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChangeRequests();
  }, [currentPage, statusFilter, categoryFilter, priorityFilter, searchTerm]);

  // Handle review action
  const handleReviewAction = async () => {
    if (!selectedRequest || !reviewAction) return;

    try {
      const result = await changeRequestService.updateChangeRequestStatus(
        selectedRequest.id!,
        reviewAction,
        reviewerNotes
      );

      if (result.success) {
        // Log the action
        await auditService.logChangeRequestAction(
          selectedRequest.id!,
          `${reviewAction}_change_request`,
          selectedRequest.employee_id,
          undefined,
          { reviewer_notes: reviewerNotes }
        );

        toast({
          title: t('common.success'),
          description: `Change request ${reviewAction}d successfully`,
        });

        setShowReviewModal(false);
        setSelectedRequest(null);
        setReviewerNotes('');
        setReviewAction(null);
        loadChangeRequests();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error reviewing change request:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to review change request',
        variant: "destructive"
      });
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'approve' | 'reject' | 'cancel') => {
    if (selectedRequests.length === 0) return;

    try {
      const result = await changeRequestService.bulkUpdateChangeRequests(
        selectedRequests,
        action,
        `Bulk ${action} action`
      );

      if (result.success) {
        toast({
          title: t('common.success'),
          description: `${result.updatedCount} change requests ${action}d successfully`,
        });

        setSelectedRequests([]);
        loadChangeRequests();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to perform bulk action',
        variant: "destructive"
      });
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><X className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">High</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Get category badge
  const getCategoryBadge = (category: string) => {
    const colors = {
      profile: 'bg-blue-100 text-blue-800',
      financial: 'bg-red-100 text-red-800',
      personal: 'bg-purple-100 text-purple-800',
      work: 'bg-green-100 text-green-800',
      contact: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <Badge variant="outline" className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Change Requests Management</h1>
            <p className="text-muted-foreground mt-2">Review and manage employee change requests</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={loadChangeRequests} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="profile">Profile</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedRequests.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{selectedRequests.length} requests selected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleBulkAction('approve')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve All
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('reject')}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRequests([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Change Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Change Requests ({totalCount})</CardTitle>
            <CardDescription>
              Manage employee change requests and approvals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading change requests...</span>
              </div>
            ) : changeRequests.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No change requests found</h3>
                <p className="text-muted-foreground">No change requests match your current filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {changeRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedRequests.includes(request.id!)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRequests(prev => [...prev, request.id!]);
                              } else {
                                setSelectedRequests(prev => prev.filter(id => id !== request.id));
                              }
                            }}
                            className="rounded"
                          />
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(request.status!)}
                            {getPriorityBadge(request.priority!)}
                            {getCategoryBadge(request.category!)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Employee</Label>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{(request as any).employees?.first_name} {(request as any).employees?.last_name}</span>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Field</Label>
                            <div className="font-medium">{request.field_name.replace('_', ' ').toUpperCase()}</div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Requested</Label>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(request.created_at!).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Reason</Label>
                          <p className="text-sm">{request.reason}</p>
                        </div>
                        
                        {request.details && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Details</Label>
                            <p className="text-sm text-muted-foreground">{request.details}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowReviewModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedRequest(request);
                                setReviewAction('approve');
                                setShowReviewModal(true);
                              }}
                              disabled={request.status !== 'pending'}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedRequest(request);
                                setReviewAction('reject');
                                setShowReviewModal(true);
                              }}
                              disabled={request.status !== 'pending'}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                // View full details
                                setSelectedRequest(request);
                                setShowReviewModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Review Change Request</span>
            </DialogTitle>
            <DialogDescription>
              Review the change request details and take action
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Employee</Label>
                  <div className="font-medium">{(selectedRequest as any).employees?.first_name} {(selectedRequest as any).employees?.last_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Field</Label>
                  <div className="font-medium">{selectedRequest.field_name.replace('_', ' ').toUpperCase()}</div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Current Value</Label>
                <div className="p-2 bg-muted rounded-md text-sm">{selectedRequest.current_value || 'N/A'}</div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Requested Value</Label>
                <div className="p-2 bg-muted rounded-md text-sm">{selectedRequest.requested_value || 'N/A'}</div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Reason</Label>
                <div className="p-2 bg-muted rounded-md text-sm">{selectedRequest.reason}</div>
              </div>
              
              {selectedRequest.details && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Details</Label>
                  <div className="p-2 bg-muted rounded-md text-sm">{selectedRequest.details}</div>
                </div>
              )}
              
              <div>
                <Label htmlFor="reviewerNotes">Reviewer Notes</Label>
                <Textarea
                  id="reviewerNotes"
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            {reviewAction && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setReviewAction('reject');
                    handleReviewAction();
                  }}
                  disabled={selectedRequest?.status !== 'pending'}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setReviewAction('approve');
                    handleReviewAction();
                  }}
                  disabled={selectedRequest?.status !== 'pending'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminChangeRequests;
