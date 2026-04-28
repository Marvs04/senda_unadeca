import { adminSupabase } from '../../shared/config/supabaseClient.mjs';

export async function findAll(supabase) {
  return supabase.from('profiles').select('*');
}

export async function findById(id) {
  return adminSupabase.from('profiles').select('*').eq('id', id).single();
}

export async function findByIdLight(id) {
  return adminSupabase.from('profiles').select('id, role').eq('id', id).single();
}

export async function createAuthUser(email, password, metadata) {
  return adminSupabase.auth.admin.createUser({
    email,
    password: password ?? 'Temp#123456',
    email_confirm: true,
    user_metadata: metadata,
  });
}

export async function updateProfileField(id, fields) {
  return adminSupabase.from('profiles').update(fields).eq('id', id).select('*').single();
}

export async function update(id, updates) {
  return adminSupabase.from('profiles').update(updates).eq('id', id);
}

export async function remove(id) {
  return adminSupabase.auth.admin.deleteUser(id);
}

export async function updateAuthPassword(id, password) {
  return adminSupabase.auth.admin.updateUserById(id, { password });
}
// Exports:
//   findAll(supabase)
//   findById(id)
//   insert(payload)             — calls adminSupabase.auth.admin.createUser + profile upsert
//   update(id, updates)
//   remove(id)                  — calls adminSupabase.auth.admin.deleteUser
//   updateAuthPassword(id, pw)  — calls adminSupabase.auth.admin.updateUserById
// All DB errors thrown as AppError.
// TODO: implement in Commit 5 (migrate users).
