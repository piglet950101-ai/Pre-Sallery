import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type FxState = {
  rate: number | null;
  updatedAt: string | null;
  error: string | null;
  isStale: boolean;
  source: string | null;
};

const CACHE_KEY = 'fx_usd_ves_cache_v1';
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes for real-time updates
const OVERRIDE_KEY = 'fx_usd_ves_override_v1';

export const ExchangeRateBar: React.FC = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [state, setState] = useState<FxState>({ rate: null, updatedAt: null, error: null, isStale: false, source: null });
  const [showEdit, setShowEdit] = useState(false);
  const [editRate, setEditRate] = useState('');
  const [currentApiRate, setCurrentApiRate] = useState<number | null>(null);

  const loadFromCache = () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.rate || !parsed?.updatedAt || !parsed?.expiresAt) return null;
      if (Date.now() > parsed.expiresAt) return null;
      return parsed as { rate: number; updatedAt: string; expiresAt: number };
    } catch {
      return null;
    }
  };

  const saveToCache = (rate: number) => {
    const nowIso = new Date().toISOString();
    const expiresAt = Date.now() + CACHE_TTL_MS;
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, updatedAt: nowIso, expiresAt }));
  };

  const loadOverride = () => {
    try {
      const raw = localStorage.getItem(OVERRIDE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed as { rate: number; date: string } | null;
    } catch { return null; }
  };

  const fetchRate = async () => {
    try {
      // Load from DB (latest view)
      const { data, error } = await supabase
        .from('exchange_rate_latest')
        .select('usd_to_ves, as_of_date, created_at, source')
        .maybeSingle();
      if (!error && data?.usd_to_ves) {
        const updatedAt = data.created_at || data.as_of_date;
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours for reasonable threshold
        const isStale = new Date(updatedAt) < fourHoursAgo;
        
        setState({ 
          rate: Number(data.usd_to_ves), 
          updatedAt, 
          error: null, 
          isStale,
          source: data.source || null
        });
        saveToCache(Number(data.usd_to_ves));
        return;
      }

      // Fallback to cache
      const cached = loadFromCache();
      if (cached) {
        setState({ rate: cached.rate, updatedAt: cached.updatedAt, error: null, isStale: true, source: null });
      } else {
        // No DB row yet and no cache: show nothing, no error text
        setState({ rate: null, updatedAt: null, error: null, isStale: false, source: null });
      }
    } catch (err: any) {
      if (!loadFromCache()) {
        setState({ rate: null, updatedAt: null, error: t('fx.error'), isStale: false, source: null });
      }
    }
  };

  useEffect(() => {
    fetchRate();
    const id = setInterval(fetchRate, CACHE_TTL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open edit from header dropdown via custom event
  useEffect(() => {
    const handler = async () => {
      // Fetch current API rate when opening edit
      try {
        const response = await supabase.functions.invoke('update-exchange-rate');
        if (response.data?.rate) {
          setCurrentApiRate(response.data.rate);
        }
      } catch (error) {
        console.log('Could not fetch current API rate:', error);
      }
      setShowEdit(true);
    };
    window.addEventListener('open-fx-edit', handler as EventListener);
    return () => window.removeEventListener('open-fx-edit', handler as EventListener);
  }, []);

  const updatedLabel = useMemo(() => {
    if (!state.updatedAt) return '';
    try {
      const d = new Date(state.updatedAt);
      return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'es-ES', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return state.updatedAt;
    }
  }, [state.updatedAt, language]);

  return (
    <div className="sticky top-16 z-40 w-full bg-blue-50/95 backdrop-blur supports-[backdrop-filter]:bg-blue-50/80 text-blue-900 border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 text-sm flex items-center justify-between gap-4">
        <div className="font-medium">
          {t('fx.usdToVes')}: {state.rate ? (
            <span className="font-semibold">1 USD = {state.rate.toFixed(2)} VES</span>
          ) : state.error ? (
            <span className="text-red-600">{state.error}</span>
          ) : (
            <span>{t('common.loading') || 'Loading...'}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {showEdit && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  type="number"
                  inputMode="decimal"
                  className="h-7 w-28 text-xs"
                  placeholder={t('fx.ratePlaceholder') || 'Rate'}
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                />
                {currentApiRate && (
                  <div className="absolute -bottom-5 left-0 text-xs text-gray-600">
                    API: {currentApiRate.toFixed(6)}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                className="h-7 px-3"
                onClick={async () => {
                  const v = parseFloat(editRate);
                  if (isNaN(v) || !isFinite(v) || v <= 0) return;
                  
                  // First, check the current API rate for comparison
                  let apiRate: number | null = null;
                  try {
                    // Try to fetch current API rate
                    const response = await supabase.functions.invoke('update-exchange-rate');
                    if (response.data?.rate) {
                      apiRate = response.data.rate;
                    }
                  } catch (error) {
                    console.log('Could not fetch API rate for comparison:', error);
                  }
                  
                  const today = new Date().toISOString().slice(0, 10);
                  const { error } = await supabase
                    .from('exchange_rates')
                    .upsert({ as_of_date: today, usd_to_ves: v, source: 'manual' }, { onConflict: 'as_of_date' });
                  if (error) {
                    console.error('Failed to set rate', error);
                    return;
                  }
                  
                  // Check for significant difference and create notification
                  if (apiRate && Math.abs(v - apiRate) / apiRate > 0.05) { // 5% difference threshold
                    const percentDiff = ((v - apiRate) / apiRate * 100).toFixed(1);
                    const diffDirection = v > apiRate ? 'higher' : 'lower';
                    
                    // Show immediate toast notification
                    toast({
                      title: "Exchange Rate Deviation Alert",
                      description: `Your rate (${v.toFixed(6)}) is ${Math.abs(parseFloat(percentDiff))}% ${diffDirection} than the current API rate (${apiRate.toFixed(6)}). Please verify this is correct.`,
                      variant: "destructive",
                      duration: 8000,
                    });
                    
                    try {
                      await supabase
                        .from('notifications')
                        .insert({
                          type: 'exchange_rate_deviation',
                          title: 'Exchange Rate Deviation Alert',
                          message: `Manual rate (${v.toFixed(6)} VES) is ${Math.abs(parseFloat(percentDiff))}% ${diffDirection} than current API rate (${apiRate.toFixed(6)} VES). Please verify the rate is correct.`,
                          severity: 'warning',
                          metadata: {
                            manual_rate: v,
                            api_rate: apiRate,
                            difference_percent: parseFloat(percentDiff),
                            date: today
                          }
                        });
                    } catch (notificationError) {
                      console.error('Failed to create deviation notification:', notificationError);
                    }
                  }
                  
                  setShowEdit(false);
                  setEditRate('');
                  setState({ rate: v, updatedAt: new Date().toISOString(), error: null, isStale: false, source: 'manual' });
                }}
              >
                {t('fx.apply') || 'Apply'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3"
                onClick={async () => {
                  const today = new Date().toISOString().slice(0, 10);
                  const { error } = await supabase
                    .from('exchange_rates')
                    .delete()
                    .eq('as_of_date', today)
                    .eq('source', 'manual');
                  if (error) {
                    console.error('Failed to clear rate', error);
                  }
                  setShowEdit(false);
                  setEditRate('');
                  await fetchRate();
                }}
              >
                {t('fx.clearOverride') || 'Clear'}
              </Button>
            </div>
          )}
          <div className="text-xs">
            {state.updatedAt && (
              <span className={state.isStale ? 'text-orange-600' : 'text-blue-700'}>
                {t('fx.updated')}: {updatedLabel}
                {state.isStale && ' ⚠️'}
              </span>
            )}
            {state.isStale && (
              <div className="text-xs text-orange-600 mt-1">
                {t('fx.staleWarning') || 'Rate may be outdated. Consider updating.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeRateBar;


