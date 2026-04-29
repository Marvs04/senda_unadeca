import { adminSupabase } from '../../shared/config/supabaseClient.mjs';

export async function findByDepartment(supabase, departmentId) {
  const { data, error } = await adminSupabase
    .from('session_locks')
    .select('id, department_id, start_datetime, end_datetime, reason, created_by, created_at')
    .eq('department_id', departmentId)
    .order('start_datetime', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function findAllActive(supabase, departmentId) {
  const now = new Date().toISOString();
  const { data, error } = await adminSupabase
    .from('session_locks')
    .select('id, department_id, start_datetime, end_datetime, reason')
    .eq('department_id', departmentId)
    .lte('start_datetime', now)
    .gte('end_datetime', now)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function insert(supabase, payload) {
  const { data, error } = await adminSupabase
    .from('session_locks')
    .insert(payload)
    .select('id, department_id, start_datetime, end_datetime, reason, created_by, created_at')
    .single();

  if (error) throw error;
  return data;
}

export async function remove(supabase, lockId) {
  const { error } = await adminSupabase
    .from('session_locks')
    .delete()
    .eq('id', lockId);

  if (error) throw error;
  return true;
}

// Exports:
//   findByDepartment(supabase, departmentId)        — get all locks for a department
//   findAllActive(supabase, departmentId)           — check if there's an active lock NOW
//   insert(supabase, payload)                       — create a new lock
//   remove(supabase, lockId)                        — delete a lock
