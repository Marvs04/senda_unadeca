/**
 * hooks/useAdminRateUpdate.ts
 *
 * Manages the rate-update modal state and submission logic for AdminPortal.
 * Extracted from AdminPortal: modal open/close, password field, value field,
 * and validation against ADMIN_RATE_PASSWORD.
 */

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ADMIN_RATE_PASSWORD } from '../constants';
import { formatCurrency } from '../lib/utils';

interface UseAdminRateUpdateOptions {
  currentRate: number;
  onRateUpdated: (newRate: number) => void;
}

export function useAdminRateUpdate({ currentRate, onRateUpdated }: UseAdminRateUpdateOptions) {
  const [isOpen,       setIsOpen]       = useState(false);
  const [ratePassword, setRatePassword] = useState('');
  const [newRateValue, setNewRateValue] = useState(currentRate.toString());

  const open  = () => setIsOpen(true);
  const close = () => {
    setIsOpen(false);
    setRatePassword('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (ratePassword !== ADMIN_RATE_PASSWORD) {
      toast.error('Contraseña de autorización incorrecta', { position: 'top-center' });
      return;
    }

    const val = Number(newRateValue);
    if (isNaN(val) || val <= 0) {
      toast.error('Por favor ingrese una tarifa válida', { position: 'top-center' });
      return;
    }

    onRateUpdated(val);
    toast.success(`Tarifa actualizada a ${formatCurrency(val)}`, { position: 'top-center' });
    close();
  };

  return {
    isOpen,
    open,
    close,
    ratePassword,
    setRatePassword,
    newRateValue,
    setNewRateValue,
    handleSubmit,
  };
}
