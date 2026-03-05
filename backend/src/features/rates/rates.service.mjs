import { findCurrent, insert } from './rates.repository.mjs';

export async function getCurrentRate(supabase) {
  const { data, error } = await findCurrent(supabase);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
  const today = new Date().toISOString().split('T')[0];
  return {
    rate: data?.rate ?? 1500,
    effectiveDate: data?.effective_date ?? today,
  };
}

export async function updateRate(rate, requester, authUserId) {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(requester.role)) {
    const err = new Error('No autorizado para actualizar la tarifa.');
    err.statusCode = 403;
    throw err;
  }
  if (!rate || Number(rate) <= 0) {
    const err = new Error('rate debe ser mayor a 0.');
    err.statusCode = 400;
    throw err;
  }
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await insert({
    rate,
    effective_date: today,
    created_by: authUserId,
  });
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
  return { rate: data.rate };
}
// Exports:
//   getCurrentRate(supabase)
//   updateRate(rate, requester, authUserId)  — enforces ADMIN/SUPER_ADMIN role check
// Rates are append-only: never updated or deleted; active rate = latest effective_date <= today.
// TODO: implement in Commit 3 (migrate rates).
