import * as repository from './activeTimerSessions.repository.mjs';
import { AppError } from '../../shared/errors/AppError.mjs';

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
  const result = await repository.stopSession(supabase, sessionId, requesterProfile.id, reason);
  if (!result) {
    throw new AppError('Sesión no encontrada o ya detenida', 404);
  }
  return result;
}
