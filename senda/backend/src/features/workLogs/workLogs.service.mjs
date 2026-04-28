import { findAll, insert, updateStatus } from './workLogs.repository.mjs';
import { WORK_LOG_STATUSES, WORK_LOG_ENTRY_SOURCES } from './workLogs.schemas.mjs';
import { toWorkLog } from '../../shared/utils/mappers.mjs';
import { normalizeOptionalText, normalizeIsoTimestamp } from '../../shared/utils/normalize.mjs';

function buildStatusUpdates(normalizedStatus, normalizedRejectionReason, authUserId, nowIso) {
  const updates = { status: normalizedStatus };
  if (normalizedStatus === 'APPROVED') {
    updates.rejection_reason = null;
    updates.approved_by = authUserId;
    updates.approved_at = nowIso;
    updates.rejected_by = null;
    updates.rejected_at = null;
  } else if (normalizedStatus === 'REJECTED') {
    updates.rejection_reason = normalizedRejectionReason;
    updates.rejected_by = authUserId;
    updates.rejected_at = nowIso;
    updates.approved_by = null;
    updates.approved_at = null;
  } else if (normalizedStatus === 'PENDING') {
    updates.rejection_reason = null;
    updates.approved_by = null;
    updates.approved_at = null;
    updates.rejected_by = null;
    updates.rejected_at = null;
  } else {
    updates.rejection_reason = null;
    updates.rejected_by = null;
    updates.rejected_at = null;
  }
  return updates;
}

export async function getWorkLogs(supabase) {
  const { data, error } = await findAll(supabase);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
  return (data ?? []).map(toWorkLog);
}

export async function createWorkLog(body, authUser, supabase) {
  const {
    studentId,
    departmentId,
    date,
    hours,
    description,
    status,
    rejectionReason,
    startTime,
    endTime,
    entrySource,
  } = body ?? {};

  if (!studentId || !departmentId || !date || !description || Number(hours) <= 0) {
    const err = new Error('studentId, departmentId, date, hours y description son requeridos.');
    err.statusCode = 400;
    throw err;
  }

  const normalizedStatus = String(status ?? 'PENDING').trim().toUpperCase();
  if (!WORK_LOG_STATUSES.has(normalizedStatus)) {
    const err = new Error('Estado de bitacora invalido.');
    err.statusCode = 400;
    throw err;
  }

  const normalizedEntrySource = String(entrySource ?? 'MANUAL').trim().toUpperCase();
  if (!WORK_LOG_ENTRY_SOURCES.has(normalizedEntrySource)) {
    const err = new Error('entrySource invalido.');
    err.statusCode = 400;
    throw err;
  }

  const normalizedStartTime = normalizeIsoTimestamp(startTime);
  const normalizedEndTime = normalizeIsoTimestamp(endTime);
  if (normalizedStartTime === 'INVALID' || normalizedEndTime === 'INVALID') {
    const err = new Error('startTime o endTime invalido.');
    err.statusCode = 400;
    throw err;
  }
  if (
    normalizedStartTime &&
    normalizedEndTime &&
    new Date(normalizedEndTime).getTime() < new Date(normalizedStartTime).getTime()
  ) {
    const err = new Error('endTime no puede ser menor a startTime.');
    err.statusCode = 400;
    throw err;
  }

  const normalizedRejectionReason = normalizeOptionalText(rejectionReason);
  if (normalizedStatus === 'REJECTED' && !normalizedRejectionReason) {
    const err = new Error('rejectionReason es requerido cuando el estado es REJECTED.');
    err.statusCode = 400;
    throw err;
  }

  const nowIso = new Date().toISOString();
  const isApprovedStatus = normalizedStatus === 'APPROVED' || normalizedStatus === 'PROCESSED';
  const isRejectedStatus = normalizedStatus === 'REJECTED';

  const payload = {
    student_id: String(studentId),
    department_id: String(departmentId),
    date: String(date),
    hours: Number(hours),
    description: String(description).trim(),
    status: normalizedStatus,
    entry_source: normalizedEntrySource,
    start_time: normalizedStartTime ?? null,
    end_time: normalizedEndTime ?? null,
    rejection_reason: isRejectedStatus ? normalizedRejectionReason : null,
    approved_by: isApprovedStatus ? authUser.id : null,
    approved_at: isApprovedStatus ? nowIso : null,
    rejected_by: isRejectedStatus ? authUser.id : null,
    rejected_at: isRejectedStatus ? nowIso : null,
  };

  const { data, error } = await insert(supabase, payload);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
  return toWorkLog(data);
}

export async function updateWorkLogStatus(id, body, authUser, supabase) {
  const { status, rejectionReason } = body ?? {};
  const normalizedStatus = String(status ?? '').trim().toUpperCase();
  if (!WORK_LOG_STATUSES.has(normalizedStatus)) {
    const err = new Error('Estado de bitacora invalido.');
    err.statusCode = 400;
    throw err;
  }

  const normalizedRejectionReason = normalizeOptionalText(rejectionReason);
  if (normalizedStatus === 'REJECTED' && !normalizedRejectionReason) {
    const err = new Error('rejectionReason es requerido cuando el estado es REJECTED.');
    err.statusCode = 400;
    throw err;
  }

  const nowIso = new Date().toISOString();
  const updates = buildStatusUpdates(normalizedStatus, normalizedRejectionReason, authUser.id, nowIso);

  const { data, error } = await updateStatus(supabase, id, updates);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
  return toWorkLog(data);
}

export async function bulkUpdateWorkLogStatus(updates, authUser, supabase) {
  if (!Array.isArray(updates)) {
    const err = new Error('updates debe ser un arreglo.');
    err.statusCode = 400;
    throw err;
  }

  const nowIso = new Date().toISOString();
  const updatedLogs = [];

  // Sequential loop intentional: preserves per-item rollback behavior
  for (const update of updates) {
    const { logId, status, rejectionReason } = update ?? {};
    const normalizedStatus = String(status ?? '').trim().toUpperCase();
    if (!logId || !WORK_LOG_STATUSES.has(normalizedStatus)) {
      const err = new Error('Cada item debe incluir logId y status valido.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedRejectionReason = normalizeOptionalText(rejectionReason);
    if (normalizedStatus === 'REJECTED' && !normalizedRejectionReason) {
      const err = new Error('rejectionReason es requerido para estado REJECTED.');
      err.statusCode = 400;
      throw err;
    }

    const payload = buildStatusUpdates(normalizedStatus, normalizedRejectionReason, authUser.id, nowIso);
    const { data, error } = await updateStatus(supabase, logId, payload);
    if (error) {
      const err = new Error(error.message);
      err.statusCode = 400;
      throw err;
    }
    updatedLogs.push(toWorkLog(data));
  }

  return updatedLogs;
}
// Exports:
//   getWorkLogs(supabase)
//   createWorkLog(body, authUser, supabase)
//   updateWorkLogStatus(id, body, authUser, supabase)
//   bulkUpdateWorkLogStatus(updates, authUser, supabase)  — sequential loop, NOT Promise.all
// Contains: status machine logic, audit field population (approved_by/at, rejected_by/at).
// TODO: implement in Commit 6 (migrate workLogs).
