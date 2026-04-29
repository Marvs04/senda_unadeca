import * as repository from './activeTimerSessions.repository.mjs';
import { insert as insertWorkLog } from '../workLogs/workLogs.repository.mjs';
import { AppError } from '../../shared/errors/AppError.mjs';

function toCRDate(isoTimestamp) {
  const date = new Date(new Date(isoTimestamp).getTime() - 6 * 3_600_000);
  return date.toISOString().slice(0, 10);
}

function mapSession(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    departmentId: row.department_id,
    startedAt: row.started_at,
    description: row.description,
    status: row.status,
    student: row.profiles
      ? { id: row.profiles.id, name: row.profiles.name, carnet: row.profiles.carnet ?? null }
      : null,
  };
}

export async function getMySession(studentId, supabase) {
  const row = await repository.findByStudent(supabase, studentId);
  return row ? mapSession(row) : null;
}

export async function getActiveSessions(departmentId, requesterProfile, supabase) {
  if (requesterProfile.role === 'DEPT_HEAD' && requesterProfile.department_id !== departmentId) {
    throw new AppError('No tienes permiso para ver sesiones de este departamento', 403);
  }
  const rows = await repository.findByDepartment(supabase, departmentId);
  return rows.map(mapSession);
}

export async function startSession(studentId, departmentId, description, supabase) {
  const row = await repository.upsert(supabase, {
    student_id: studentId,
    department_id: departmentId,
    started_at: new Date().toISOString(),
    description: description || '',
    status: 'ACTIVE',
    stopped_at: null,
    stop_reason: null,
    stopped_by: null,
  });
  return mapSession(row);
}

export async function endSession(studentId, supabase) {
  await repository.removeByStudent(supabase, studentId);
}

export async function stopSessionByHead(sessionId, departmentId, requesterProfile, reason, supabase) {
  if (!['DEPT_HEAD', 'SUPER_ADMIN'].includes(requesterProfile.role)) {
    throw new AppError('No tienes permiso para detener sesiones', 403);
  }
  if (requesterProfile.role === 'DEPT_HEAD' && requesterProfile.department_id !== departmentId) {
    throw new AppError('No tienes permiso para detener sesiones de este departamento', 403);
  }

  const stoppedAt = new Date().toISOString();
  const result = await repository.stopSession(supabase, sessionId, requesterProfile.id, reason, stoppedAt);
  if (!result) {
    throw new AppError('Sesión no encontrada o ya detenida', 404);
  }

  // Record the elapsed time as a REJECTED work log so hours aren't lost
  const startedAt = result.started_at;
  const hours = parseFloat(
    ((new Date(stoppedAt).getTime() - new Date(startedAt).getTime()) / 3_600_000).toFixed(2),
  );

  if (hours >= 0.01) {
    await insertWorkLog(supabase, {
      student_id: result.student_id,
      department_id: result.department_id,
      date: toCRDate(stoppedAt),
      hours,
      description: `Sesión detenida por jefe de departamento`,
      entry_source: 'MANUAL',
      start_time: startedAt,
      end_time: stoppedAt,
      status: 'REJECTED',
      rejected_by: requesterProfile.id,
      rejected_at: stoppedAt,
      rejection_reason: reason,
    }).catch(() => {}); // non-fatal: work log failure shouldn't block the stop
  }

  return result;
}
