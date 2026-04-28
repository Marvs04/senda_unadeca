import { adminSupabase } from '../../shared/config/supabaseClient.mjs';

export async function getConfig() {
  return adminSupabase.from('accounting_config').select('*').eq('id', 1).single();
}

export async function updateConfig(payload) {
  return adminSupabase
    .from('accounting_config')
    .update(payload)
    .eq('id', 1)
    .select('*')
    .single();
}

export async function upsertReceivable(payload) {
  return adminSupabase
    .from('student_receivables')
    .upsert(payload, { onConflict: 'student_id, period_key' })
    .select('*')
    .single();
}

export async function upsertManyReceivables(records) {
  return adminSupabase
    .from('student_receivables')
    .upsert(records, { onConflict: 'student_id, period_key' })
    .select('id, student_id, period_key, amount');
}
