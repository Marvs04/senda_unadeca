import { getAuthedSupabase } from '../config/supabaseClient.mjs';

export async function requireAuth(req, res, next) {
  const supabase = getAuthedSupabase(req);
  if (!supabase) return res.status(401).json({ message: 'Falta token de autorización.' });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return res.status(401).json({ message: 'Token inválido o expirado.' });

  req.supabase = supabase;
  req.authUser = data.user;
  next();
}

export async function getRequesterProfile(req) {
  const { data, error } = await req.supabase
    .from('profiles')
    .select('*')
    .eq('id', req.authUser.id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
