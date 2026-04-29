import * as repository from './sessionLocks.repository.mjs';
import { createAppError } from '../../shared/errors/AppError.mjs';

export async function getLocks(departmentId, requesterProfile, supabase) {
  // DEPT_HEAD can only see locks for their department
  // SUPER_ADMIN can see locks for any department
  if (requesterProfile.role === 'DEPT_HEAD' && requesterProfile.departmentId !== departmentId) {
    throw createAppError('FORBIDDEN', 'No tienes permiso para ver los bloqueos de este departamento');
  }

  return repository.findByDepartment(supabase, departmentId);
}

export async function checkIsSessionLocked(departmentId, supabase) {
  // Check if there's an active lock for the department right now
  const activeLock = await repository.findAllActive(supabase, departmentId);
  return !!activeLock;
}

export async function getActiveLockReason(departmentId, supabase) {
  // Get the reason if there's an active lock
  const activeLock = await repository.findAllActive(supabase, departmentId);
  return activeLock?.reason || null;
}

export async function createLock(departmentId, startDateTime, endDateTime, reason, requesterProfile, supabase) {
  // Only DEPT_HEAD (for their dept) and SUPER_ADMIN can create locks
  if (requesterProfile.role === 'DEPT_HEAD') {
    if (requesterProfile.departmentId !== departmentId) {
      throw createAppError('FORBIDDEN', 'No tienes permiso para crear bloqueos en este departamento');
    }
  } else if (requesterProfile.role !== 'SUPER_ADMIN') {
    throw createAppError('FORBIDDEN', 'No tienes permiso para crear bloqueos');
  }

  // Validate dates
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  if (start >= end) {
    throw createAppError('BAD_REQUEST', 'La fecha de inicio debe ser anterior a la fecha de fin');
  }

  return repository.insert(supabase, {
    department_id: departmentId,
    start_datetime: startDateTime,
    end_datetime: endDateTime,
    reason: reason || null,
    created_by: requesterProfile.id,
  });
}

export async function deleteLock(lockId, requesterProfile, supabase) {
  // Get the lock to check permissions
  const locks = await supabase
    .from('session_locks')
    .select('id, department_id, created_by')
    .eq('id', lockId)
    .maybeSingle();

  if (!locks || locks.error) {
    throw createAppError('NOT_FOUND', 'El bloqueo no existe');
  }

  // Check permissions
  if (requesterProfile.role === 'DEPT_HEAD') {
    if (locks.data.created_by !== requesterProfile.id) {
      throw createAppError('FORBIDDEN', 'No tienes permiso para eliminar este bloqueo');
    }
  } else if (requesterProfile.role !== 'SUPER_ADMIN') {
    throw createAppError('FORBIDDEN', 'No tienes permiso para eliminar bloqueos');
  }

  return repository.remove(supabase, lockId);
}

// Exports:
//   getLocks(departmentId, requesterProfile, supabase)
//   checkIsSessionLocked(departmentId, supabase)
//   getActiveLockReason(departmentId, supabase)
//   createLock(departmentId, startDateTime, endDateTime, reason, requesterProfile, supabase)
//   deleteLock(lockId, requesterProfile, supabase)
