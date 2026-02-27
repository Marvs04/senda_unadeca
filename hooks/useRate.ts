import { useState } from 'react';
import { HOURLY_RATE } from '../constants';
import { getBillingCycle } from '../lib/business';

export function useRate() {
  const [currentRate, setCurrentRate] = useState(HOURLY_RATE);
  const [billingCycle, setBillingCycle] = useState(getBillingCycle().value);

  return { currentRate, setCurrentRate, billingCycle, setBillingCycle };
}
