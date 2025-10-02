import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle, X, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DeviationNotification {
  id: string;
  title: string;
  message: string;
  severity: 'warning' | 'error';
  created_at: string;
  metadata: {
    manual_rate: number;
    api_rate: number;
    difference_percent: number;
    date: string;
  };
}

export const ExchangeRateDeviationAlert: React.FC = () => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<DeviationNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDeviationNotifications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'exchange_rate_deviation')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch deviation notifications:', error);
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
    fetchDeviationNotifications();
    // Check for new notifications every 5 minutes
    const interval = setInterval(fetchDeviationNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const { manual_rate, api_rate, difference_percent } = notification.metadata;
        const isHigher = difference_percent > 0;
        const TrendIcon = isHigher ? TrendingUp : TrendingDown;
        const trendColor = isHigher ? 'text-red-600' : 'text-blue-600';
        
        return (
          <Card key={notification.id} className="bg-orange-50 border-orange-200 border-2">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-orange-800">
                      {notification.title}
                    </h4>
                    <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">
                    {notification.message}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-white p-2 rounded border">
                      <div className="text-gray-600">Manual Rate</div>
                      <div className="font-semibold text-orange-800">
                        {manual_rate.toFixed(6)} VES
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <div className="text-gray-600">API Rate</div>
                      <div className="font-semibold text-gray-800">
                        {api_rate.toFixed(6)} VES
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-600">
                    Difference: {Math.abs(difference_percent).toFixed(1)}% {isHigher ? 'higher' : 'lower'} • 
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => dismissNotification(notification.id)}
                  className="h-8 w-8 p-0 text-orange-600 hover:text-orange-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
