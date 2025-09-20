import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import ChangeRequestItem from './ChangeRequestItem';
import Pagination from './ui/pagination';

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

interface ChangeRequestsListProps {
  changeRequests: ChangeRequest[];
  onCancelRequest?: (id: string) => void;
  itemsPerPage?: number;
}

export const ChangeRequestsList: React.FC<ChangeRequestsListProps> = ({
  changeRequests,
  onCancelRequest,
  itemsPerPage = 5
}) => {
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(changeRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = changeRequests.slice(startIndex, endIndex);

  // Reset to page 1 when changeRequests change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [changeRequests.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (changeRequests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>{t('employee.profile.changeRequested')}</span>
          <Badge variant="secondary">{changeRequests.length}</Badge>
        </CardTitle>
        <CardDescription>
          {t('employee.profile.changeRequestDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Change Requests List */}
          <div className="space-y-3">
            {currentRequests.map((request, index) => (
              <ChangeRequestItem
                key={request.id || index}
                request={request}
                onCancel={onCancelRequest}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          {/* Pagination Info */}
          <div className="text-center text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, changeRequests.length)} of {changeRequests.length} requests
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChangeRequestsList;
