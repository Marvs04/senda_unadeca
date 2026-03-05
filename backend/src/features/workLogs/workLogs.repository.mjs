export async function findAll(supabase) {
  return supabase
    .from('work_logs')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
}

export async function insert(supabase, payload) {
  return supabase.from('work_logs').insert(payload).select('*').single();
}

export async function updateStatus(supabase, id, updates) {
  return supabase.from('work_logs').update(updates).eq('id', id).select('*').single();
}
// Exports:
//   findAll(supabase)
//   insert(supabase, payload)
//   updateStatus(supabase, id, updates)
// All DB errors thrown as AppError.
// TODO: implement in Commit 6 (migrate workLogs).
