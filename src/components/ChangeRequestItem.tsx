import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, Calendar, User, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChangeRequest {
  id?: string;
  field_name: string;
  current_value?: string;
  requested_value?: string;
  reason: string;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at?: string;
  details?: string;
}

interface ChangeRequestItemProps {
  request: ChangeRequest;
  onCancel?: (id: string) => void;
}

export const ChangeRequestItem: React.FC<ChangeRequestItemProps> = ({
  request,
  onCancel
}) => {
  const { t, language } = useLanguage();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'cancelled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return t('employee.profile.requestPending');
      case 'approved':
        return t('employee.profile.requestApproved');
      case 'rejected':
        return t('employee.profile.requestRejected');
      case 'cancelled':
        return 'Cancelled';
      default:
        return t('employee.profile.requestPending');
    }
  };

  const formatFieldName = (fieldName: string) => {
    const fieldMap: Record<string, string> = {
      'first_name': t('employee.profile.firstName'),
      'last_name': t('employee.profile.lastName'),
      'email': t('employee.email'),
      'bank_name': t('employee.bankName'),
      'account_number': t('employee.accountNumber'),
      'account_type': t('employee.accountType'),
      'phone': t('employee.phone'),
      'monthly_salary': t('employee.monthlySalary'),
      'weekly_hours': t('employee.weeklyHours'),
      'position': t('employee.profile.position'),
      'department': t('employee.profile.department'),
      'hire_date': t('employee.profile.hireDate')
    };
    return fieldMap[fieldName] || fieldName.replace('_', ' ');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatValue = (value?: string, fieldName: string) => {
    if (!value) return 'N/A';
    
    // Mask sensitive information
    if (fieldName === 'account_number' && value.length > 4) {
      return `****-****-${value.slice(-4)}`;
    }
    
    return value;
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Header with field name and status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {formatFieldName(request.field_name)}
                </span>
              </div>
              <Badge variant={getStatusVariant(request.status || 'pending')} className="text-xs">
                {getStatusIcon(request.status || 'pending')}
                <span className="ml-1">{getStatusText(request.status || 'pending')}</span>
              </Badge>
            </div>

            {/* Current and Requested Values */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Current:</span>
                <div className="font-medium mt-1">
                  {formatValue(request.current_value, request.field_name)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Requested:</span>
                <div className="font-medium mt-1">
                  {formatValue(request.requested_value, request.field_name)}
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <span className="text-muted-foreground text-sm">Reason:</span>
              <div className="text-sm mt-1 p-2 bg-muted/50 rounded-md">
                {request.reason}
              </div>
            </div>

            {/* Details and Date */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(request.created_at)}</span>
                </div>
                {request.details && (
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{request.details}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cancel Button (only for pending requests) */}
          {request.status === 'pending' && onCancel && request.id && (
            <div className="ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(request.id!)}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChangeRequestItem;
