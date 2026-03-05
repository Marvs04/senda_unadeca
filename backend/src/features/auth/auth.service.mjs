import { createClient } from '@supabase/supabase-js';
import { buildAuthEmail } from './auth.schemas.mjs';
import { signInWithPassword, findProfileById } from './auth.repository.mjs';
import { toUser } from '../../shared/utils/mappers.mjs';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

export async function login(identifier, password) {
  const email = buildAuthEmail(identifier);
  const { data, error } = await signInWithPassword(email, password);
  if (error || !data.session || !data.user) {
    const err = new Error(error?.message ?? 'Credenciales inválidas.');
    err.statusCode = 401;
    throw err;
  }

  const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  });

  const { data: profile, error: profileError } = await findProfileById(userSupabase, data.user.id);
  if (profileError) {
    const err = new Error(profileError.message);
    err.statusCode = 400;
    throw err;
  }
  if (profile.is_active === false) {
    const err = new Error('La cuenta está desactivada. Contacta al administrador.');
    err.statusCode = 403;
    throw err;
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
    user: toUser(profile),
  };
}

export async function getSessionProfile(supabase, authUserId) {
  const { data, error } = await findProfileById(supabase, authUserId);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
  if (data.is_active === false) {
    const err = new Error('La cuenta está desactivada. Contacta al administrador.');
    err.statusCode = 403;
    throw err;
  }
  return toUser(data);
}
// Exports:
//   login(identifier, password)    — builds synthetic email, authenticates, returns { accessToken, user }
//   getSessionProfile(authUser)    — fetches profile from DB, checks is_active
// TODO: implement in Commit 2 (migrate auth).
