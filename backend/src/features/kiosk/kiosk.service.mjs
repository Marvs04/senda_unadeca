import { createClient } from '@supabase/supabase-js';
import { buildAuthEmail } from '../auth/auth.schemas.mjs';
import { KIOSK_MANAGER_ROLES, validateShift } from './kiosk.schemas.mjs';
import {
  findStateByDept,
  insertState,
  updateStateShifts,
  deleteState,
  insertSession,
  deleteSession,
  deleteAllSessions,
} from './kiosk.repository.mjs';
import { insert as insertWorkLog } from '../workLogs/workLogs.repository.mjs';
import { toWorkLog } from '../../shared/utils/mappers.mjs';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Verify identifier+password against Supabase Auth.
 * Returns the auth user's profile row from adminSupa on success.
 * Throws with statusCode 401 on bad credentials.
 */
async function verifyCredentials(identifier, password, adminSupa) {
  const email = buildAuthEmail(identifier);
  const publicSupa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await publicSupa.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    const err = new Error('Credenciales incorrectas.');
    err.statusCode = 401;
    throw err;
  }

  const { data: profile, error: profileError } = await adminSupa
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  if (profileError) {
    const err = new Error(profileError.message);
    err.statusCode = 400;
    throw err;
  }
  if (profile.is_active === false) {
    const err = new Error('La cuenta está desactivada.');
    err.statusCode = 403;
    throw err;
  }
  return profile;
}

/** Costa Rica UTC-6 (no DST) date string YYYY-MM-DD from an ISO timestamp. */
function toCRDate(isoTimestamp) {
  const date = new Date(new Date(isoTimestamp).getTime() - 6 * 3_600_000);
  return date.toISOString().slice(0, 10);
}

function hoursWorked(startedAt, endedAt) {
  return parseFloat(
    ((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 3_600_000).toFixed(2),
  );
}

function throwNotFound(msg) {
  const err = new Error(msg ?? 'No encontrado.');
  err.statusCode = 404;
  throw err;
}

function throwForbidden(msg) {
  const err = new Error(msg ?? 'Acceso denegado.');
  err.statusCode = 403;
  throw err;
}

function throwConflict(msg) {
  const err = new Error(msg ?? 'Conflicto.');
  err.statusCode = 409;
  throw err;
}

// ─── Public service functions ─────────────────────────────────────────────────

/**
 * GET /kiosk/:departmentId
 * Returns the active kiosk state or null. Requester must be DEPT_HEAD of that dept or SUPER_ADMIN.
 */
export async function getState(requesterProfile, departmentId, adminSupa) {
  if (
    requesterProfile.role !== 'SUPER_ADMIN' &&
    !(requesterProfile.role === 'DEPT_HEAD' && requesterProfile.department_id === departmentId)
  ) {
    throwForbidden('No tienes permisos para ver el kiosco de este departamento.');
  }

  const { data, error } = await findStateByDept(adminSupa, departmentId);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
  if (!data) return null;

  return {
    id: data.id,
    departmentId: data.department_id,
    activatedBy: data.activated_by,
    activatedAt: data.activated_at,
    shifts: data.shifts ?? [],
    sessions: (data.kiosk_sessions ?? []).map(s => ({
      studentId: s.student_id,
      startedAt: s.started_at,
      sessionId: s.id,
      user: s.profiles
        ? {
            id: s.profiles.id,
            name: s.profiles.name,
            role: s.profiles.role,
            carnet: s.profiles.carnet ?? undefined,
            departmentId: s.profiles.department_id ?? undefined,
          }
        : null,
    })),
  };
}

/**
 * POST /kiosk/activate
 * Body: { identifier, password, departmentId? }
 * The authenticating user must be DEPT_HEAD or SUPER_ADMIN.
 * SUPER_ADMIN must supply departmentId.
 */
export async function activateKiosk(body, adminSupa) {
  const { identifier, password, departmentId: targetDeptId } = body ?? {};
  if (!identifier || !password) {
    const err = new Error('identifier y password son requeridos.');
    err.statusCode = 400;
    throw err;
  }

  const profile = await verifyCredentials(identifier, password, adminSupa);

  if (!KIOSK_MANAGER_ROLES.has(profile.role)) {
    throwForbidden('Solo jefes de departamento o super administradores pueden activar el kiosco.');
  }

  const departmentId =
    profile.role === 'SUPER_ADMIN'
      ? (targetDeptId?.trim() || null)
      : profile.department_id;

  if (!departmentId) {
    const err = new Error('SUPER_ADMIN debe indicar el departmentId objetivo.');
    err.statusCode = 400;
    throw err;
  }

  if (profile.role === 'DEPT_HEAD' && profile.department_id !== departmentId) {
    throwForbidden('No tienes permisos para activar el kiosco en este departamento.');
  }

  // Check uniqueness (DB also enforces UNIQUE(department_id))
  const { data: existing, error: checkError } = await findStateByDept(adminSupa, departmentId);
  if (checkError) {
    const err = new Error(checkError.message);
    err.statusCode = 400;
    throw err;
  }
  if (existing) {
    throwConflict('Ya hay un kiosco activo para este departamento.');
  }

  const { data, error } = await insertState(adminSupa, {
    department_id: departmentId,
    activated_by: profile.id,
    activated_at: new Date().toISOString(),
    shifts: [],
  });
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return {
    id: data.id,
    departmentId: data.department_id,
    activatedBy: data.activated_by,
    activatedAt: data.activated_at,
    shifts: [],
    sessions: [],
  };
}

/**
 * POST /kiosk/deactivate
 * Body: { identifier, password }
 * Flushes all open sessions as PENDING work logs, then deletes the kiosk_state.
 */
export async function deactivateKiosk(body, adminSupa) {
  const { identifier, password, departmentId: bodyDeptId } = body ?? {};
  if (!identifier || !password) {
    const err = new Error('identifier y password son requeridos.');
    err.statusCode = 400;
    throw err;
  }

  const profile = await verifyCredentials(identifier, password, adminSupa);

  if (!KIOSK_MANAGER_ROLES.has(profile.role)) {
    throwForbidden('Solo jefes de departamento o super administradores pueden desactivar el kiosco.');
  }

  // SUPER_ADMIN can deactivate any dept's kiosk by supplying departmentId in the body.
  // DEPT_HEAD can only deactivate their own dept's kiosk.
  const departmentId = profile.role === 'SUPER_ADMIN'
    ? (bodyDeptId?.trim() || profile.department_id)
    : profile.department_id;

  if (!departmentId) {
    const err = new Error('No se pudo determinar el departamento. Proporciona departmentId en el cuerpo de la solicitud.');
    err.statusCode = 400;
    throw err;
  }

  const { data: kioskData, error: fetchError } = await findStateByDept(adminSupa, departmentId);
  if (fetchError) {
    const err = new Error(fetchError.message);
    err.statusCode = 400;
    throw err;
  }
  if (!kioskData) throwNotFound('El kiosco no está activo.');

  if (profile.role !== 'SUPER_ADMIN' && kioskData.department_id !== profile.department_id) {
    throwForbidden('No tienes permisos para desactivar el kiosco de este departamento.');
  }

  // Flush open sessions as work logs
  const openSessions = kioskData.kiosk_sessions ?? [];
  const flushTime = new Date().toISOString();

  await Promise.all(openSessions.map(session => {
    const hours = Math.max(hoursWorked(session.started_at, flushTime), 0);
    return insertWorkLog(adminSupa, {
      student_id: session.student_id,
      department_id: kioskData.department_id,
      date: toCRDate(flushTime),
      hours,
      description: 'Sesión kiosco — cierre automático al desactivar',
      entry_source: 'KIOSK',
      start_time: session.started_at,
      end_time: flushTime,
      status: 'PENDING',
    });
  }));

  // Delete kiosk_state (cascades to kiosk_sessions)
  const { error: deleteError } = await deleteState(adminSupa, kioskData.id);
  if (deleteError) {
    const err = new Error(deleteError.message);
    err.statusCode = 400;
    throw err;
  }

  return { ok: true, flushedSessions: openSessions.length };
}


/**
 * POST /kiosk/clock-in
 * Body: { identifier, password }
 * Authenticates as a student, verifies dept match, creates a kiosk_session.
 */
export async function clockIn(body, adminSupa) {
  const { identifier, password } = body ?? {};
  if (!identifier || !password) {
    const err = new Error('identifier y password son requeridos.');
    err.statusCode = 400;
    throw err;
  }

  const profile = await verifyCredentials(identifier, password, adminSupa);

  if (profile.role !== 'STUDENT') {
    throwForbidden('Solo los estudiantes pueden registrar entrada.');
  }

  const { data: kioskData, error: fetchError } = await findStateByDept(adminSupa, profile.department_id);
  if (fetchError) {
    const err = new Error(fetchError.message);
    err.statusCode = 400;
    throw err;
  }
  if (!kioskData) throwNotFound('El kiosco no está activo para tu departamento.');

  const alreadyIn = (kioskData.kiosk_sessions ?? []).some(s => s.student_id === profile.id);
  if (alreadyIn) {
    throwConflict('Ya tienes una sesión activa. Registra tu salida primero.');
  }

  const { data, error } = await insertSession(adminSupa, {
    kiosk_id: kioskData.id,
    student_id: profile.id,
    started_at: new Date().toISOString(),
  });
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return { ok: true, name: profile.name, sessionId: data.id, startedAt: data.started_at };
}

/**
 * POST /kiosk/clock-out
 * Body: { identifier, password }
 * Closes the session, creates a PENDING work log, returns it.
 */
export async function clockOut(body, adminSupa) {
  const { identifier, password } = body ?? {};
  if (!identifier || !password) {
    const err = new Error('identifier y password son requeridos.');
    err.statusCode = 400;
    throw err;
  }

  const profile = await verifyCredentials(identifier, password, adminSupa);

  const { data: kioskData, error: fetchError } = await findStateByDept(adminSupa, profile.department_id);
  if (fetchError) {
    const err = new Error(fetchError.message);
    err.statusCode = 400;
    throw err;
  }
  if (!kioskData) throwNotFound('El kiosco no está activo para tu departamento.');

  const session = (kioskData.kiosk_sessions ?? []).find(s => s.student_id === profile.id);
  if (!session) throwNotFound('No tienes una sesión activa en este kiosco.');

  const endedAt = new Date().toISOString();
  const hours = Math.max(hoursWorked(session.started_at, endedAt), 0);

  // Delete session
  await deleteSession(adminSupa, kioskData.id, profile.id);

  // Create work log
  const { data: logRow, error: logError } = await insertWorkLog(adminSupa, {
    student_id: profile.id,
    department_id: kioskData.department_id,
    date: toCRDate(endedAt),
    hours,
    description: 'Sesión kiosco',
    entry_source: 'KIOSK',
    start_time: session.started_at,
    end_time: endedAt,
    status: 'PENDING',
  });
  if (logError) {
    const err = new Error(logError.message);
    err.statusCode = 400;
    throw err;
  }

  return { ok: true, name: profile.name, workLog: toWorkLog(logRow) };
}

/**
 * POST /kiosk/cancel-session
 * Body: { identifier, password, studentId, reason }
 * Only a DEPT_HEAD or SUPER_ADMIN can cancel a session. Creates a REJECTED work log.
 */
export async function cancelSession(body, adminSupa) {
  const { identifier, password, studentId, reason } = body ?? {};
  if (!identifier || !password || !studentId || !reason?.trim()) {
    const err = new Error('identifier, password, studentId y reason son requeridos.');
    err.statusCode = 400;
    throw err;
  }

  const profile = await verifyCredentials(identifier, password, adminSupa);

  if (!KIOSK_MANAGER_ROLES.has(profile.role)) {
    throwForbidden('Solo jefes de departamento o super administradores pueden cancelar sesiones.');
  }

  const departmentId = profile.department_id;
  if (!departmentId && profile.role !== 'SUPER_ADMIN') {
    const err = new Error('No tienes un departamento asignado.');
    err.statusCode = 400;
    throw err;
  }

  // Find the kiosk — for SUPER_ADMIN we need to look it up by student's dept
  const { data: studentProfile, error: studentError } = await adminSupa
    .from('profiles')
    .select('department_id')
    .eq('id', studentId)
    .single();
  if (studentError) {
    const err = new Error(studentError.message);
    err.statusCode = 400;
    throw err;
  }

  const targetDeptId = profile.role === 'SUPER_ADMIN' ? studentProfile.department_id : departmentId;

  const { data: kioskData, error: fetchError } = await findStateByDept(adminSupa, targetDeptId);
  if (fetchError) {
    const err = new Error(fetchError.message);
    err.statusCode = 400;
    throw err;
  }
  if (!kioskData) throwNotFound('El kiosco no está activo para ese departamento.');

  if (profile.role === 'DEPT_HEAD' && kioskData.department_id !== profile.department_id) {
    throwForbidden('No tienes permisos para cancelar sesiones en este departamento.');
  }

  const session = (kioskData.kiosk_sessions ?? []).find(s => s.student_id === studentId);
  if (!session) throwNotFound('Sesión no encontrada.');

  const rejectedAt = new Date().toISOString();
  const hours = Math.max(hoursWorked(session.started_at, rejectedAt), 0);

  await deleteSession(adminSupa, kioskData.id, studentId);

  const { data: logRow, error: logError } = await insertWorkLog(adminSupa, {
    student_id: studentId,
    department_id: kioskData.department_id,
    date: toCRDate(rejectedAt),
    hours,
    description: 'Sesión kiosco — cancelada por jefe de departamento',
    entry_source: 'KIOSK',
    start_time: session.started_at,
    end_time: rejectedAt,
    status: 'REJECTED',
    rejected_by: profile.id,
    rejected_at: rejectedAt,
    rejection_reason: reason.trim(),
  });
  if (logError) {
    const err = new Error(logError.message);
    err.statusCode = 400;
    throw err;
  }

  return { ok: true, workLog: toWorkLog(logRow) };
}

/**
 * PATCH /kiosk/shifts
 * Body: { identifier, password, shifts: [{ startTime, endTime }] }
 * Only DEPT_HEAD or SUPER_ADMIN of that department may update shifts.
 */
export async function updateShifts(body, adminSupa) {
  const { identifier, password, shifts } = body ?? {};
  if (!identifier || !password || !Array.isArray(shifts)) {
    const err = new Error('identifier, password y shifts[] son requeridos.');
    err.statusCode = 400;
    throw err;
  }

  for (const shift of shifts) {
    const validationError = validateShift(shift);
    if (validationError) {
      const err = new Error(validationError);
      err.statusCode = 400;
      throw err;
    }
  }

  const profile = await verifyCredentials(identifier, password, adminSupa);

  if (!KIOSK_MANAGER_ROLES.has(profile.role)) {
    throwForbidden('Solo jefes de departamento o super administradores pueden configurar turnos.');
  }

  if (!profile.department_id) {
    const err = new Error('No tienes un departamento asignado.');
    err.statusCode = 400;
    throw err;
  }

  const { data: kioskData, error: fetchError } = await findStateByDept(adminSupa, profile.department_id);
  if (fetchError) {
    const err = new Error(fetchError.message);
    err.statusCode = 400;
    throw err;
  }
  if (!kioskData) throwNotFound('El kiosco no está activo.');

  if (profile.role === 'DEPT_HEAD' && kioskData.department_id !== profile.department_id) {
    throwForbidden('No tienes permisos para configurar los turnos de este departamento.');
  }

  const { data, error } = await updateStateShifts(adminSupa, kioskData.id, shifts);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return { ok: true, shifts: data.shifts ?? [] };
}
// TODO: implement when kiosk REST endpoints are defined.
