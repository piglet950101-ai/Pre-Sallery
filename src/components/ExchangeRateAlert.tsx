import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ExchangeRateStatus {
  hasRateToday: boolean;
  isStale: boolean;
  lastUpdate: string | null;
  source: string | null;
  rate: number | null;
}

export const ExchangeRateAlert: React.FC = () => {
  const { t } = useLanguage();
  const [status, setStatus] = useState<ExchangeRateStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkStatus = async () => {
    try {
      setIsLoading(true);
      
      // Fallback: Check exchange rate status directly from database if function doesn't exist
      const { data: latestRate, error } = await supabase
        .from('exchange_rate_latest')
        .select('usd_to_ves, created_at, updated_at, as_of_date, source')
        .maybeSingle();

      if (!error && latestRate) {
        const today = new Date().toISOString().slice(0, 10);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours (1 day) threshold
        const lastUpdate = latestRate.updated_at || latestRate.created_at || latestRate.as_of_date;
        const hasRateToday = latestRate.as_of_date === today;
        const isStale = new Date(lastUpdate) < oneDayAgo;
        
        // More robust check: consider rate as "today's rate" if:
        // 1. as_of_date matches today, OR
        // 2. the rate was updated within the last 24 hours (regardless of as_of_date)
        const hasRecentRate = hasRateToday || (lastUpdate && new Date(lastUpdate) > oneDayAgo);


        setStatus({
          hasRateToday: hasRecentRate, // Use the more robust check
          isStale,
          lastUpdate,
          source: latestRate.source,
          rate: latestRate.usd_to_ves
        });
      } else {
        // No rate found
        setStatus({
          hasRateToday: false,
          isStale: true,
          lastUpdate: null,
          source: null,
          rate: null
        });
      }
    } catch (error) {
       // Set a default error state
      setStatus({
        hasRateToday: false,
        isStale: true,
        lastUpdate: null,
        source: null,
        rate: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerUpdate = async () => {
    try {
      setIsLoading(true);
      
      // Try to call the real-time update function first
      try {
        const response = await supabase.functions.invoke('realtime-exchange-update');
        if (response.data?.success) {
          // Refresh status after update
          await checkStatus();
          return;
        }
      } catch (functionError) {
        // Function not available, continue to next fallback
      }
      
      // Fallback to hourly update function
      try {
        const response = await supabase.functions.invoke('hourly-exchange-update');
        if (response.data?.success) {
          // Refresh status after update
          await checkStatus();
          return;
        }
      } catch (functionError) {
        // Function not available, continue to next fallback
      }
      
      // Fallback: Try the main update function
      try {
        const response = await supabase.functions.invoke('update-exchange-rate');
        if (response.data?.ok) {
          // Refresh status after update
          await checkStatus();
          return;
        }
      } catch (fallbackError) {
        throw new Error('Unable to update exchange rate - functions may not be deployed');
      }
      
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // Check status every 30 minutes
    const interval = setInterval(checkStatus, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  // Only show alert if there's an issue
  if (status.hasRateToday && !status.isStale) return null;

  const getAlertContent = () => {
    if (!status.hasRateToday) {
      return {
        title: 'Exchange Rate Not Updated',
        message: 'Exchange rate not updated today. Please set the exchange rate manually or trigger an automatic update.',
        severity: 'error' as const,
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }

    if (status.isStale) {
      const lastUpdate = status.lastUpdate 
        ? new Date(status.lastUpdate).toLocaleTimeString()
        : 'Unknown';
      
      return {
        title: 'Exchange Rate is Stale',
        message: `Exchange rate was last updated at ${lastUpdate}. Consider updating for real-time accuracy.`,
        severity: 'warning' as const,
        icon: Clock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    }

    return null;
  };

  const alertContent = getAlertContent();
  if (!alertContent) return null;

  const { title, message, icon: Icon, color, bgColor, borderColor } = alertContent;

  return (
    <Card className={`${bgColor} ${borderColor} border-2 mb-4`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Icon className={`h-5 w-5 ${color} mt-0.5 flex-shrink-0`} />
          <div className="flex-1">
            <h4 className={`font-semibold ${color}`}>{title}</h4>
            <p className="text-sm text-gray-700 mt-1">{message}</p>
            {status.rate && (
              <p className="text-xs text-gray-600 mt-2">
                Current rate: 1 USD = {String(status.rate)} VES
                {status.source && ` (${status.source})`}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={checkStatus}
              disabled={isLoading}
              className="h-8"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Check
            </Button>
            <Button
              size="sm"
              onClick={triggerUpdate}
              disabled={isLoading}
              className="h-8"
            >
              Update Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
