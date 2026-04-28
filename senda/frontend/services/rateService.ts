/**
 * services/rateService.ts
 *
 * Data-access layer for the global hourly rate.
 */

import { HOURLY_RATE } from '../constants';
import { apiClient } from '../api';

export async function getCurrentRate(): Promise<number> {
  const { data } = await apiClient.get<{ rate: number; effectiveDate: string }>('/rate');
  return data.rate ?? HOURLY_RATE;
}

export async function updateRate(rate: number): Promise<number> {
  const { data } = await apiClient.put<{ rate: number }>('/rate', { rate });
  return data.rate;
}
