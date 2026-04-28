import { adminSupabase } from '../../shared/config/supabaseClient.mjs';

export async function findCurrent(supabase) {
  const today = new Date().toISOString().split('T')[0];
  return supabase
    .from('hourly_rates')
    .select('rate, effective_date')
    .lte('effective_date', today)
    .order('effective_date', { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function insert(payload) {
  return adminSupabase
    .from('hourly_rates')
    .insert(payload)
    .select('rate')
    .single();
}
// Exports:
//   findCurrent(supabase)  — queries hourly_rates WHERE effective_date <= today ORDER BY DESC LIMIT 1
//   insert(payload)        — inserts a new rate row (append-only)
// All DB errors thrown as AppError.
// TODO: implement in Commit 3 (migrate rates).
