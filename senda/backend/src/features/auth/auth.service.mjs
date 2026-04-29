import { createClient } from '@supabase/supabase-js';
import { buildAuthEmail } from './auth.schemas.mjs';
import { signInWithPassword, findProfileById } from './auth.repository.mjs';
import { updateProfileField, updateAuthPassword } from '../users/users.repository.mjs';
import { toUser } from '../../shared/utils/mappers.mjs';
import { adminSupabase } from '../../shared/config/supabaseClient.mjs';

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

export async function changePassword(userId, newPassword) {
  if (typeof newPassword !== 'string' || newPassword.trim().length < 8) {
    const err = new Error('La nueva contraseña debe tener al menos 8 caracteres.');
    err.statusCode = 400;
    throw err;
  }

  // Use admin client — the user-scoped supabase client doesn't carry a live
  // session (persistSession: false), so auth.updateUser() would fail with
  // "Auth session missing". adminSupabase.auth.admin.updateUserById is safe
  // here because we only ever set the password for the authenticated user's
  // own ID (verified by requireAuth middleware).
  const { error } = await updateAuthPassword(userId, newPassword.trim());
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  await updateProfileField(userId, { must_change_password: false })
    .catch((e) => console.error('[auth] changePassword flag error:', e.message));

  // Supabase invalidates all existing sessions when the password changes via
  // admin API, so the current token is dead. Re-authenticate immediately with
  // the new password and return a fresh session so the frontend can keep going
  // without forcing the user to log in again.
  const { data: adminUser } = await adminSupabase.auth.admin.getUserById(userId);
  const email = adminUser?.user?.email;
  if (email) {
    const { data: session, error: signInErr } = await signInWithPassword(email, newPassword.trim());
    if (!signInErr && session?.session) {
      return {
        accessToken: session.session.access_token,
        refreshToken: session.session.refresh_token,
        expiresAt: session.session.expires_at,
      };
    }
  }

  return null;
}
// Exports:
//   login(identifier, password)    — builds synthetic email, authenticates, returns { accessToken, user }
//   getSessionProfile(authUser)    — fetches profile from DB, checks is_active
// TODO: implement in Commit 2 (migrate auth).
