import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

export async function signInWithPassword(email, password) {
  const publicSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return publicSupabase.auth.signInWithPassword({ email, password });
}

export async function findProfileById(supabase, userId) {
  return supabase.from('profiles').select('*').eq('id', userId).single();
}
// Exports:
//   signInWithPassword(email, password)  — calls supabase.auth.signInWithPassword
//   findProfileById(supabase, userId)    — queries profiles table by id
// TODO: implement in Commit 2 (migrate auth).
