/**
 * services/rateService.ts
 *
 * Data-access layer for the global hourly rate.
 */

import { HOURLY_RATE } from '../constants';
// import { apiClient } from '../api';
// import { supabase, TABLES } from '../api'; // ← Supabase

export async function getCurrentRate(): Promise<number> {
  // Real (REST):
  // const { data } = await apiClient.get<{ rate: number; effectiveDate: string }>('/rate');
  // return data.rate;

  // Real (Supabase):
  // const { data, error } = await supabase
  //   .from(TABLES.RATES)
  //   .select('rate')
  //   .order('effective_date', { ascending: false })
  //   .limit(1)
  //   .single();
  // if (error) throw new Error(error.message);
  // return data.rate;

  return Promise.resolve(HOURLY_RATE);
}

export async function updateRate(rate: number): Promise<number> {
  // Real (REST):
  // const { data } = await apiClient.put<{ rate: number }>('/rate', { rate });
  // return data.rate;

  // Real (Supabase):
  // const { data, error } = await supabase
  //   .from(TABLES.RATES)
  //   .insert({ rate, effective_date: new Date().toISOString(), created_by: 'admin' })
  //   .select('rate')
  //   .single();
  // if (error) throw new Error(error.message);
  // return data.rate;

  return Promise.resolve(rate);
}
