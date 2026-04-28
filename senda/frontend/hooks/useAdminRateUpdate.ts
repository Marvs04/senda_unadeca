/**
 * hooks/useAdminRateUpdate.ts
 *
 * Manages the rate-update modal state and submission logic for AdminPortal.
 * Extracted from AdminPortal: modal open/close, value field and API submit.
 */

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/utils';
import { updateRate } from '../services';

interface UseAdminRateUpdateOptions {
  currentRate: number;
  onRateUpdated: (newRate: number) => void;
}

export function useAdminRateUpdate({ currentRate, onRateUpdated }: UseAdminRateUpdateOptions) {
  const [isOpen,       setIsOpen]       = useState(false);
  const [newRateValue, setNewRateValue] = useState(currentRate.toString());

  const open  = () => {
    setNewRateValue(currentRate.toString());
    setIsOpen(true);
  };
  const close = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const val = Number(newRateValue);
    if (isNaN(val) || val <= 0) {
      toast.error('Por favor ingrese una tarifa válida', { position: 'top-center' });
      return;
    }

    try {
      const saved = await updateRate(val);
      onRateUpdated(saved);
      toast.success(`Tarifa actualizada a ${formatCurrency(saved)}`, { position: 'top-center' });
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No fue posible actualizar la tarifa.', {
        position: 'top-center',
      });
    }
  };

  return {
    isOpen,
    open,
    close,
    newRateValue,
    setNewRateValue,
    handleSubmit,
  };
}
