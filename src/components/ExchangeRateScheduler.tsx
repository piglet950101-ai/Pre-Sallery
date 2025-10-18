import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, RefreshCw, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SchedulerStatus {
  lastCheck: string | null;
  nextCheck: string | null;
  isEnabled: boolean;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
}

export const ExchangeRateScheduler: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  const loadStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check the latest exchange rate to determine status
      const { data: latestRate, error: rateError } = await supabase
        .from('exchange_rates')
        .select('created_at, updated_at, as_of_date, usd_to_ves, source')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rateError) {
        console.error('Error loading exchange rate:', rateError);
        // Set default status if we can't load data
        const nextCheck = new Date();
        nextCheck.setHours(18, 10, 0, 0); // 6:10 PM
        if (nextCheck <= new Date()) {
          nextCheck.setDate(nextCheck.getDate() + 1); // Next day if already past 6:10 PM
        }

        setStatus({
          lastCheck: null,
          nextCheck: nextCheck.toISOString(),
          isEnabled: true,
          status: 'pending',
          message: 'Unable to load exchange rate data'
        });
        return;
      }

      const nextCheck = new Date();
      nextCheck.setHours(18, 10, 0, 0); // 6:10 PM
      if (nextCheck <= new Date()) {
        nextCheck.setDate(nextCheck.getDate() + 1); // Next day if already past 6:10 PM
      }

      let schedulerStatus: SchedulerStatus = {
        lastCheck: latestRate?.updated_at || latestRate?.created_at || null,
        nextCheck: nextCheck.toISOString(),
        isEnabled: true,
        status: 'success',
        message: 'Exchange rate monitoring active'
      };

      // Check if rate is stale (older than 24 hours)
      if (latestRate) {
        const rateDate = new Date(latestRate.updated_at || latestRate.created_at);
        const hoursSinceUpdate = (Date.now() - rateDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceUpdate > 24) {
          schedulerStatus.status = 'warning';
          schedulerStatus.message = `Exchange rate is ${Math.round(hoursSinceUpdate)} hours old - may need updating`;
        } else {
          schedulerStatus.status = 'success';
          schedulerStatus.message = `Exchange rate updated ${Math.round(hoursSinceUpdate)} hours ago`;
        }
      } else {
        schedulerStatus.status = 'error';
        schedulerStatus.message = 'No exchange rate data found';
      }

      setStatus(schedulerStatus);
    } catch (error) {
      console.error('Failed to load scheduler status:', error);
      // Set error status
      setStatus({
        lastCheck: null,
        nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isEnabled: false,
        status: 'error',
        message: 'Failed to load scheduler status'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerManualCheck = async () => {
    try {
      setIsTriggering(true);
      
      const response = await supabase.functions.invoke('daily-rate-check');
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Manual Check Triggered",
        description: "Daily exchange rate check has been triggered manually. Check notifications for results.",
        variant: "default"
      });

      // Refresh status after a short delay
      setTimeout(() => {
        loadStatus();
      }, 2000);

    } catch (error: any) {
      console.error('Failed to trigger manual check:', error);
      toast({
        title: "Check Failed",
        description: error.message || "Failed to trigger manual exchange rate check",
        variant: "destructive"
      });
    } finally {
      setIsTriggering(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // Refresh status every 5 minutes
    const interval = setInterval(loadStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (!status) return Clock;
    switch (status.status) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      default: return Clock;
    }
  };

  const getStatusColor = () => {
    if (!status) return 'text-gray-500';
    switch (status.status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-orange-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getStatusBadge = () => {
    if (!status) return <Badge variant="secondary">Unknown</Badge>;
    switch (status.status) {
      case 'success': return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'warning': return <Badge variant="default" className="bg-orange-100 text-orange-800">Warning</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  if (!status) return null;

  // Only show the component if there are issues (not success status)
  if (status.status === 'success') return null;

  const StatusIcon = getStatusIcon();

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Daily Exchange Rate Check</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start space-x-3">
          <StatusIcon className={`h-5 w-5 ${getStatusColor()} mt-0.5 flex-shrink-0`} />
          <div className="flex-1">
            <p className="text-sm text-gray-700">{status.message}</p>
            <div className="mt-2 space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Last Check:</span>
                <span>{formatDateTime(status.lastCheck)}</span>
              </div>
              <div className="flex justify-between">
                <span>Next Check:</span>
                <span>{formatDateTime(status.nextCheck)}</span>
              </div>
              <div className="flex justify-between">
                <span>Schedule:</span>
                <span>Daily at 6:10 PM</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadStatus}
            disabled={isLoading}
            className="h-8"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={triggerManualCheck}
            disabled={isTriggering}
            className="h-8"
          >
            <Clock className="h-3 w-3 mr-1" />
            {isTriggering ? 'Checking...' : 'Check Now'}
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 pt-2 border-t">
          <p>🕕 Scheduled to run daily at 6:10 PM (UTC)</p>
          <p>🌍 Local times: Caracas 2:10 PM, New York 1:10 PM, Los Angeles 10:10 AM</p>
        </div>
      </CardContent>
    </Card>
  );
};
