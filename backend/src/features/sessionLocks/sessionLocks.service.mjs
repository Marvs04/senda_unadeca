import * as repository from './sessionLocks.repository.mjs';
import { AppError } from '../../shared/errors/AppError.mjs';

function mapLock(row) {
  return {
    id: row.id,
    departmentId: row.department_id,
    startDatetime: row.start_datetime,
    endDatetime: row.end_datetime,
    reason: row.reason ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function getLocks(departmentId, requesterProfile, supabase) {
  if (requesterProfile.role === 'DEPT_HEAD' && requesterProfile.department_id !== departmentId) {
    throw new AppError('No tienes permiso para ver los bloqueos de este departamento', 403);
  }
  const rows = await repository.findByDepartment(supabase, departmentId);
  return rows.map(mapLock);
}

export async function checkIsSessionLocked(departmentId, supabase) {
  const activeLock = await repository.findAllActive(supabase, departmentId);
  return !!activeLock;
}

export async function getActiveLockReason(departmentId, supabase) {
  const activeLock = await repository.findAllActive(supabase, departmentId);
  return activeLock?.reason ?? null;
}

export async function createLock(departmentId, startDateTime, endDateTime, reason, requesterProfile, supabase) {
  if (requesterProfile.role === 'DEPT_HEAD') {
    if (requesterProfile.department_id !== departmentId) {
      throw new AppError('No tienes permiso para crear bloqueos en este departamento', 403);
    }
  } else if (requesterProfile.role !== 'SUPER_ADMIN') {
    throw new AppError('No tienes permiso para crear bloqueos', 403);
  }

  const start = new Date(startDateTime);
  const end   = new Date(endDateTime);
  if (start >= end) {
    throw new AppError('La fecha de inicio debe ser anterior a la fecha de fin', 400);
  }

  const row = await repository.insert(supabase, {
    department_id: departmentId,
    start_datetime: startDateTime,
    end_datetime: endDateTime,
    reason: reason || null,
    created_by: requesterProfile.id,
  });
  return mapLock(row);
}

export async function deleteLock(lockId, requesterProfile, supabase) {
  const { data: lock, error } = await supabase
    .from('session_locks')
    .select('id, department_id, created_by')
    .eq('id', lockId)
    .maybeSingle();

  if (error || !lock) {
    throw new AppError('El bloqueo no existe', 404);
  }

  if (requesterProfile.role === 'DEPT_HEAD') {
    if (lock.created_by !== requesterProfile.id) {
      throw new AppError('No tienes permiso para eliminar este bloqueo', 403);
    }
  } else if (requesterProfile.role !== 'SUPER_ADMIN') {
    throw new AppError('No tienes permiso para eliminar bloqueos', 403);
  }

  return repository.remove(supabase, lockId);
}
