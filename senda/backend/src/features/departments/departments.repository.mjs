import { adminSupabase } from '../../shared/config/supabaseClient.mjs';

export async function findAll(supabase) {
  return supabase.from('departments').select('*');
}

export async function findById(id) {
  return adminSupabase.from('departments').select('id, name').eq('id', id).single();
}

export async function insert(payload) {
  return adminSupabase.from('departments').insert(payload).select('*').single();
}

export async function update(id, updates) {
  return adminSupabase.from('departments').update(updates).eq('id', id);
}

export async function remove(id) {
  return adminSupabase.from('departments').delete().eq('id', id);
}

export async function countWorkLogsByDepartment(id) {
  return adminSupabase
    .from('work_logs')
    .select('id', { count: 'exact', head: true })
    .eq('department_id', id);
}

/** Devuelve el departamento donde head_id = userId (o null si no existe). */
export async function findDeptByHead(userId) {
  return adminSupabase
    .from('departments')
    .select('id, head_id')
    .eq('head_id', userId)
    .maybeSingle();
}

/** Actualiza head_id en un departamento. Pasa null para desasignar. */
export async function setDeptHead(deptId, headId) {
  return adminSupabase
    .from('departments')
    .update({ head_id: headId ?? null })
    .eq('id', deptId);
}
// Exports:
//   findAll(supabase)
//   insert(payload)
//   update(id, updates)
//   remove(id)
//   countWorkLogsByDepartment(id)  — used by service before delete to enforce referential guard
// All DB errors thrown as AppError.
// TODO: implement in Commit 4 (migrate departments).
