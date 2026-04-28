/**
 * hooks/useRate.ts
 *
 * Gestiona la tarifa horaria activa y el ciclo de facturación.
 *
 * Ciclo de vida:
 *   isLoading=true → getCurrentRate() → isLoading=false + currentRate | error
 */
import { useState, useEffect } from 'react';
import { getCurrentRate } from '../services';
import { getBillingCycle } from '../lib/business';
import { subscribeToTableChanges } from '../lib/realtime';

export function useRate() {
  const [currentRate, setCurrentRate] = useState(0);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const billingCycle = getBillingCycle().value;

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: number | null = null;

    const syncRate = async (isInitialLoad: boolean) => {
      if (isInitialLoad) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const rate = await getCurrentRate();
        if (cancelled) return;
        setCurrentRate(rate);
        if (isInitialLoad) setIsLoading(false);
      } catch (err: unknown) {
        if (cancelled) return;
        if (isInitialLoad) {
          setError(err instanceof Error ? err.message : 'Error al cargar tarifa');
          setIsLoading(false);
          return;
        }
        // Keep the last good state when realtime refresh fails.
        console.warn('[Realtime] No se pudo sincronizar tarifa', err);
      }
    };

    const scheduleBackgroundSync = () => {
      if (refreshTimer !== null) return;
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        void syncRate(false);
      }, 250);
    };

    void syncRate(true);

    const unsubscribeRealtime = subscribeToTableChanges({
      table: 'hourly_rates',
      onChange: scheduleBackgroundSync,
    });

    return () => {
      cancelled = true;
      unsubscribeRealtime();
      if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer);
      }
    };
  }, []);

  return { currentRate, setCurrentRate, isLoading, error, billingCycle };
}
