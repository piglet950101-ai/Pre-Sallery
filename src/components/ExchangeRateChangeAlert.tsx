import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp, TrendingDown, X, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ChangeNotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning';
  created_at: string;
  metadata: {
    previous_rate: number;
    new_rate: number;
    change_percent: number;
    date: string;
    timestamp: string;
  };
}

export const ExchangeRateChangeAlert: React.FC = () => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<ChangeNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChangeNotifications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'exchange_rate_change')
        .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
        .order('created_at', { ascending: false })
        .limit(3);

      if (!error && data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch change notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissNotification = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  useEffect(() => {
    fetchChangeNotifications();
    // Check for new notifications every 2 minutes for real-time feel
    const interval = setInterval(fetchChangeNotifications, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-2">
      {notifications.map((notification) => {
        const { previous_rate, new_rate, change_percent } = notification.metadata;
        const isIncrease = change_percent > 0;
        const TrendIcon = isIncrease ? TrendingUp : TrendingDown;
        const trendColor = isIncrease ? 'text-green-600' : 'text-red-600';
        const bgColor = isIncrease ? 'bg-green-50' : 'bg-red-50';
        const borderColor = isIncrease ? 'border-green-200' : 'border-red-200';
        
        return (
          <Card key={notification.id} className={`${bgColor} ${borderColor} border-l-4`}>
            <CardContent className="p-3">
              <div className="flex items-start space-x-3">
                <Activity className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-sm text-gray-800">
                      Real-time Rate Change
                    </h4>
                    <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs">
                    <div>
                      <span className="text-gray-600">From:</span>
                      <span className="font-semibold ml-1">{previous_rate.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">To:</span>
                      <span className="font-semibold ml-1">{new_rate.toFixed(6)}</span>
                    </div>
                    <div className={`font-semibold ${trendColor}`}>
                      {isIncrease ? '+' : ''}{change_percent}%
                    </div>
                  </div>
                  
                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleTimeString()}
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => dismissNotification(notification.id)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
