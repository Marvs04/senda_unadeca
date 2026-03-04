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

export function useRate() {
  const [currentRate, setCurrentRate] = useState(0);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const billingCycle = getBillingCycle().value;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getCurrentRate()
      .then(rate => {
        if (!cancelled) {
          setCurrentRate(rate);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar tarifa');
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  return { currentRate, setCurrentRate, isLoading, error, billingCycle };
}
