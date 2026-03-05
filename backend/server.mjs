import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  PORT = '4000',
  CORS_ORIGIN = 'http://localhost:3000',
} = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Faltan variables de entorno: SUPABASE_URL, SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY.');
}

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

const INSTITUTIONAL_EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const COST_CENTER_REGEX = /^\d{2}-\d{4}$/;
const WORK_LOG_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED']);
const WORK_LOG_ENTRY_SOURCES = new Set(['MANUAL', 'KIOSK']);

function buildAuthEmail(identifier) {
  return `${String(identifier).toLowerCase().trim().replace(/\s+/g, '-')}@senda.internal`;
}

function normalizeOptionalText(value) {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function normalizeIsoTimestamp(value) {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 'INVALID';
  return date.toISOString();
}

function toUser(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    carnet: row.carnet ?? undefined,
    employeeNumber: row.employee_number ?? undefined,
    institutionalEmail: row.institutional_email ?? undefined,
    departmentId: row.department_id ?? undefined,
    isActive: row.is_active !== false,
  };
}

function toDepartment(row) {
  return {
    id: row.id,
    name: row.name,
    headId: row.head_id ?? undefined,
    costCenter: row.cost_center ?? '',
  };
}

function toWorkLog(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    departmentId: row.department_id,
    date: row.date,
    hours: Number(row.hours),
    description: row.description,
    status: row.status,
    entrySource: row.entry_source ?? undefined,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    rejectedBy: row.rejected_by ?? undefined,
    rejectedAt: row.rejected_at ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
  };
}

function getBearerToken(req) {
  const auth = req.headers.authorization ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  return auth.slice(7).trim();
}

function getAuthedSupabase(req) {
  const token = getBearerToken(req);
  if (!token) return null;

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

async function requireAuth(req, res, next) {
  const supabase = getAuthedSupabase(req);
  if (!supabase) return res.status(401).json({ message: 'Falta token de autorización.' });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return res.status(401).json({ message: 'Token inválido o expirado.' });

  req.supabase = supabase;
  req.authUser = data.user;
  next();
}

async function getRequesterProfile(req) {
  const { data, error } = await req.supabase
    .from('profiles')
    .select('*')
    .eq('id', req.authUser.id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body ?? {};
    if (!identifier || !password) {
      return res.status(400).json({ message: 'identifier y password son requeridos.' });
    }

    const email = buildAuthEmail(identifier);
    const publicSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await publicSupabase.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) {
      return res.status(401).json({ message: error?.message ?? 'Credenciales inválidas.' });
    }

    const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
    });

    const { data: profile, error: profileError } = await userSupabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) return res.status(400).json({ message: profileError.message });
    if (profile.is_active === false) {
      return res.status(403).json({ message: 'La cuenta está desactivada. Contacta al administrador.' });
    }

    return res.json({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: toUser(profile),
    });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
});

app.get('/api/v1/auth/me', requireAuth, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('profiles')
      .select('*')
      .eq('id', req.authUser.id)
      .single();

    if (error) return res.status(400).json({ message: error.message });
    if (data.is_active === false) {
      return res.status(403).json({ message: 'La cuenta está desactivada. Contacta al administrador.' });
    }
    return res.json(toUser(data));
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
});

app.post('/api/v1/auth/logout', (_req, res) => {
  return res.status(204).send();
});

app.get('/api/v1/users', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase.from('profiles').select('*');
  if (error) return res.status(400).json({ message: error.message });
  return res.json((data ?? []).map(toUser));
});

app.post('/api/v1/users', requireAuth, async (req, res) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!['ADMIN', 'SUPER_ADMIN'].includes(requester.role)) {
      return res.status(403).json({ message: 'No autorizado para crear usuarios.' });
    }

    const {
      name,
      role,
      carnet,
      employeeNumber,
      institutionalEmail,
      departmentId,
      password,
    } = req.body ?? {};

    const normalizedName = String(name ?? '').trim();
    const normalizedRole = String(role ?? '').trim().toUpperCase();
    const normalizedCarnet = normalizeOptionalText(carnet);
    const normalizedEmployeeNumber = normalizeOptionalText(employeeNumber);
    const normalizedDepartmentId = normalizeOptionalText(departmentId);
    const normalizedInstitutionalEmail = normalizeOptionalText(institutionalEmail);

    if (!normalizedName || !normalizedRole) {
      return res.status(400).json({ message: 'name y role son requeridos.' });
    }
    if (!['SUPER_ADMIN', 'ADMIN', 'DEPT_HEAD', 'STUDENT', 'ACCOUNTING'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'role invalido.' });
    }
    if (requester.role === 'ADMIN' && !['DEPT_HEAD', 'STUDENT'].includes(normalizedRole)) {
      return res.status(403).json({ message: 'Admin solo puede crear cuentas DEPT_HEAD y STUDENT.' });
    }
    if (normalizedRole === 'DEPT_HEAD' && !normalizedEmployeeNumber) {
      return res.status(400).json({ message: 'Numero de empleado es requerido para DEPT_HEAD.' });
    }
    if (normalizedRole === 'STUDENT' && !normalizedCarnet) {
      return res.status(400).json({ message: 'Carnet es requerido para STUDENT.' });
    }
    if (
      normalizedInstitutionalEmail &&
      !INSTITUTIONAL_EMAIL_REGEX.test(normalizedInstitutionalEmail)
    ) {
      return res.status(400).json({ message: 'Correo institucional invalido.' });
    }

    const identifier = normalizedCarnet ?? normalizedEmployeeNumber ?? normalizedName;
    const email = buildAuthEmail(identifier);

    const { data: createdAuth, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password: password ?? 'Temp#123456',
      email_confirm: true,
      user_metadata: {
        name: normalizedName,
        role: normalizedRole,
        carnet: normalizedCarnet,
        employee_number: normalizedEmployeeNumber,
        institutional_email: normalizedInstitutionalEmail,
        department_id: normalizedDepartmentId,
      },
    });

    if (createError || !createdAuth.user) {
      return res.status(400).json({ message: createError?.message ?? 'No fue posible crear usuario.' });
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .update({ institutional_email: normalizedInstitutionalEmail ?? null })
      .eq('id', createdAuth.user.id)
      .select('*')
      .single();

    if (profileError) return res.status(400).json({ message: profileError.message });
    return res.status(201).json(toUser(profile));
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
});

app.patch('/api/v1/users/:id', requireAuth, async (req, res) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!['ADMIN', 'SUPER_ADMIN'].includes(requester.role)) {
      return res.status(403).json({ message: 'No autorizado para editar usuarios.' });
    }

    const { id } = req.params;
    const {
      name,
      role,
      carnet,
      employeeNumber,
      institutionalEmail,
      departmentId,
      isActive,
    } = req.body ?? {};

    const { data: target, error: targetError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (targetError || !target) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (requester.role === 'ADMIN' && !['STUDENT', 'DEPT_HEAD'].includes(target.role)) {
      return res.status(403).json({ message: 'Admin solo puede editar estudiantes y jefes de departamento.' });
    }

    if (target.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'No se permite editar cuentas SUPER_ADMIN.' });
    }

    if (role !== undefined) {
      return res.status(400).json({ message: 'Cambiar rol no está habilitado por esta ruta.' });
    }

    const nextName =
      name !== undefined
        ? String(name).trim()
        : String(target.name ?? '').trim();
    const nextCarnet =
      carnet !== undefined
        ? normalizeOptionalText(carnet)
        : normalizeOptionalText(target.carnet);
    const nextEmployeeNumber =
      employeeNumber !== undefined
        ? normalizeOptionalText(employeeNumber)
        : normalizeOptionalText(target.employee_number);
    const nextInstitutionalEmail =
      institutionalEmail !== undefined
        ? normalizeOptionalText(institutionalEmail)
        : normalizeOptionalText(target.institutional_email);

    if (!nextName) {
      return res.status(400).json({ message: 'El nombre es requerido.' });
    }
    if (target.role === 'STUDENT' && !nextCarnet) {
      return res.status(400).json({ message: 'Carnet es requerido para STUDENT.' });
    }
    if (target.role === 'DEPT_HEAD' && !nextEmployeeNumber) {
      return res.status(400).json({ message: 'Numero de empleado es requerido para DEPT_HEAD.' });
    }
    if (
      nextInstitutionalEmail &&
      !INSTITUTIONAL_EMAIL_REGEX.test(nextInstitutionalEmail)
    ) {
      return res.status(400).json({ message: 'Correo institucional invalido.' });
    }

    const updates = {};
    if (name !== undefined) updates.name = nextName;
    if (carnet !== undefined) updates.carnet = nextCarnet;
    if (employeeNumber !== undefined) updates.employee_number = nextEmployeeNumber;
    if (institutionalEmail !== undefined) updates.institutional_email = nextInstitutionalEmail;
    if (departmentId !== undefined) updates.department_id = normalizeOptionalText(departmentId);
    if (isActive !== undefined) updates.is_active = Boolean(isActive);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No hay cambios para actualizar.' });
    }

    const { error } = await adminSupabase
      .from('profiles')
      .update(updates)
      .eq('id', id);

    if (error) return res.status(400).json({ message: error.message });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
});

app.delete('/api/v1/users/:id', requireAuth, async (req, res) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!['ADMIN', 'SUPER_ADMIN'].includes(requester.role)) {
      return res.status(403).json({ message: 'No autorizado para eliminar usuarios.' });
    }

    const { id } = req.params;

    const { data: target, error: targetError } = await adminSupabase
      .from('profiles')
      .select('id, role')
      .eq('id', id)
      .single();

    if (targetError || !target) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (target.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'No se permite eliminar cuentas SUPER_ADMIN.' });
    }

    if (requester.role === 'ADMIN' && !['STUDENT', 'DEPT_HEAD'].includes(target.role)) {
      return res.status(403).json({ message: 'Admin solo puede eliminar estudiantes y jefes de departamento.' });
    }

    const { error } = await adminSupabase.auth.admin.deleteUser(id);
    if (error) return res.status(400).json({ message: error.message });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
});

app.post('/api/v1/users/:id/reset-password', requireAuth, async (req, res) => {
  try {
    const requester = await getRequesterProfile(req);
    if (requester.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Solo SUPER_ADMIN puede resetear contraseñas.' });
    }

    const { id } = req.params;
    const { newPassword } = req.body ?? {};

    if (typeof newPassword !== 'string' || newPassword.trim().length < 8) {
      return res.status(400).json({ message: 'newPassword debe tener al menos 8 caracteres.' });
    }

    const { data: target, error: targetError } = await adminSupabase
      .from('profiles')
      .select('id, role')
      .eq('id', id)
      .single();

    if (targetError || !target) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (target.role === 'SUPER_ADMIN' && target.id !== requester.id) {
      return res.status(403).json({ message: 'No se permite resetear otro usuario SUPER_ADMIN.' });
    }

    const { error } = await adminSupabase.auth.admin.updateUserById(id, {
      password: newPassword.trim(),
    });

    if (error) return res.status(400).json({ message: error.message });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
});

app.get('/api/v1/departments', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase.from('departments').select('*');
  if (error) return res.status(400).json({ message: error.message });
  return res.json((data ?? []).map(toDepartment));
});

app.post('/api/v1/departments', requireAuth, async (req, res) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!['ADMIN', 'SUPER_ADMIN'].includes(requester.role)) {
      return res.status(403).json({ message: 'No autorizado para crear departamentos.' });
    }

    const { name, headId, costCenter } = req.body ?? {};
    const normalizedName = String(name ?? '').trim();
    const normalizedHeadId = normalizeOptionalText(headId);
    const normalizedCostCenter = String(costCenter ?? '').trim();

    if (!normalizedName) {
      return res.status(400).json({ message: 'El nombre del departamento es requerido.' });
    }
    if (!COST_CENTER_REGEX.test(normalizedCostCenter)) {
      return res.status(400).json({ message: 'Centro de costos invalido. Use formato NN-NNNN.' });
    }

    const { data, error } = await adminSupabase
      .from('departments')
      .insert({
        name: normalizedName,
        head_id: normalizedHeadId,
        cost_center: normalizedCostCenter,
      })
      .select('*')
      .single();

    if (error) return res.status(400).json({ message: error.message });
    return res.status(201).json(toDepartment(data));
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
});

app.patch('/api/v1/departments/:id', requireAuth, async (req, res) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!['ADMIN', 'SUPER_ADMIN'].includes(requester.role)) {
      return res.status(403).json({ message: 'No autorizado para actualizar departamentos.' });
    }

    const { id } = req.params;
    const { name, headId, costCenter } = req.body ?? {};
    const updates = {};

    if (name !== undefined) {
      const normalizedName = String(name).trim();
      if (!normalizedName) {
        return res.status(400).json({ message: 'El nombre del departamento no puede estar vacío.' });
      }
      updates.name = normalizedName;
    }

    if (headId !== undefined) {
      updates.head_id = normalizeOptionalText(headId);
    }

    if (costCenter !== undefined) {
      const normalizedCostCenter = String(costCenter).trim();
      if (!COST_CENTER_REGEX.test(normalizedCostCenter)) {
        return res.status(400).json({ message: 'Centro de costos invalido. Use formato NN-NNNN.' });
      }
      updates.cost_center = normalizedCostCenter;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar.' });
    }

    const { error } = await adminSupabase
      .from('departments')
      .update(updates)
      .eq('id', id);

    if (error) return res.status(400).json({ message: error.message });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
});

app.delete('/api/v1/departments/:id', requireAuth, async (req, res) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!['ADMIN', 'SUPER_ADMIN'].includes(requester.role)) {
      return res.status(403).json({ message: 'No autorizado para eliminar departamentos.' });
    }

    const { id } = req.params;

    const { data: dept, error: deptError } = await adminSupabase
      .from('departments')
      .select('id, name')
      .eq('id', id)
      .single();

    if (deptError || !dept) {
      return res.status(404).json({ message: 'Departamento no encontrado.' });
    }

    const { count, error: logsError } = await adminSupabase
      .from('work_logs')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', id);

    if (logsError) return res.status(400).json({ message: logsError.message });
    if ((count ?? 0) > 0) {
      return res.status(409).json({
        message: `No se puede eliminar \"${dept.name}\" porque tiene registros de horas asociados.`,
      });
    }

    const { error } = await adminSupabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) return res.status(400).json({ message: error.message });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
});

app.get('/api/v1/work-logs', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('work_logs')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ message: error.message });
  return res.json((data ?? []).map(toWorkLog));
});

app.post('/api/v1/work-logs', requireAuth, async (req, res) => {
  try {
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
    } = req.body ?? {};

    if (!studentId || !departmentId || !date || !description || Number(hours) <= 0) {
      return res.status(400).json({ message: 'studentId, departmentId, date, hours y description son requeridos.' });
    }

    const normalizedStatus = String(status ?? 'PENDING').trim().toUpperCase();
    if (!WORK_LOG_STATUSES.has(normalizedStatus)) {
      return res.status(400).json({ message: 'Estado de bitacora invalido.' });
    }

    const normalizedEntrySource = String(entrySource ?? 'MANUAL').trim().toUpperCase();
    if (!WORK_LOG_ENTRY_SOURCES.has(normalizedEntrySource)) {
      return res.status(400).json({ message: 'entrySource invalido.' });
    }

    const normalizedStartTime = normalizeIsoTimestamp(startTime);
    const normalizedEndTime = normalizeIsoTimestamp(endTime);
    if (normalizedStartTime === 'INVALID' || normalizedEndTime === 'INVALID') {
      return res.status(400).json({ message: 'startTime o endTime invalido.' });
    }
    if (
      normalizedStartTime &&
      normalizedEndTime &&
      new Date(normalizedEndTime).getTime() < new Date(normalizedStartTime).getTime()
    ) {
      return res.status(400).json({ message: 'endTime no puede ser menor a startTime.' });
    }

    const normalizedRejectionReason = normalizeOptionalText(rejectionReason);
    if (normalizedStatus === 'REJECTED' && !normalizedRejectionReason) {
      return res.status(400).json({ message: 'rejectionReason es requerido cuando el estado es REJECTED.' });
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
      approved_by: isApprovedStatus ? req.authUser.id : null,
      approved_at: isApprovedStatus ? nowIso : null,
      rejected_by: isRejectedStatus ? req.authUser.id : null,
      rejected_at: isRejectedStatus ? nowIso : null,
    };

    const { data, error } = await req.supabase
      .from('work_logs')
      .insert(payload)
      .select('*')
      .single();

    if (error) return res.status(400).json({ message: error.message });
    return res.status(201).json(toWorkLog(data));
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
});

app.patch('/api/v1/work-logs/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body ?? {};

    const normalizedStatus = String(status ?? '').trim().toUpperCase();
    if (!WORK_LOG_STATUSES.has(normalizedStatus)) {
      return res.status(400).json({ message: 'Estado de bitacora invalido.' });
    }

    const normalizedRejectionReason = normalizeOptionalText(rejectionReason);
    if (normalizedStatus === 'REJECTED' && !normalizedRejectionReason) {
      return res.status(400).json({ message: 'rejectionReason es requerido cuando el estado es REJECTED.' });
    }

    const nowIso = new Date().toISOString();
    const updates = { status: normalizedStatus };

    if (normalizedStatus === 'APPROVED') {
      updates.rejection_reason = null;
      updates.approved_by = req.authUser.id;
      updates.approved_at = nowIso;
      updates.rejected_by = null;
      updates.rejected_at = null;
    } else if (normalizedStatus === 'REJECTED') {
      updates.rejection_reason = normalizedRejectionReason;
      updates.rejected_by = req.authUser.id;
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

    const { data, error } = await req.supabase
      .from('work_logs')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) return res.status(400).json({ message: error.message });
    return res.json(toWorkLog(data));
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
});

app.patch('/api/v1/work-logs/bulk-status', requireAuth, async (req, res) => {
  try {
    const { updates } = req.body ?? {};
    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: 'updates debe ser un arreglo.' });
    }

    const nowIso = new Date().toISOString();
    const updatedLogs = [];

    for (const update of updates) {
      const { logId, status, rejectionReason } = update ?? {};
      const normalizedStatus = String(status ?? '').trim().toUpperCase();
      if (!logId || !WORK_LOG_STATUSES.has(normalizedStatus)) {
        return res.status(400).json({ message: 'Cada item debe incluir logId y status valido.' });
      }

      const normalizedRejectionReason = normalizeOptionalText(rejectionReason);
      if (normalizedStatus === 'REJECTED' && !normalizedRejectionReason) {
        return res.status(400).json({ message: 'rejectionReason es requerido para estado REJECTED.' });
      }

      const payload = { status: normalizedStatus };

      if (normalizedStatus === 'APPROVED') {
        payload.rejection_reason = null;
        payload.approved_by = req.authUser.id;
        payload.approved_at = nowIso;
        payload.rejected_by = null;
        payload.rejected_at = null;
      } else if (normalizedStatus === 'REJECTED') {
        payload.rejection_reason = normalizedRejectionReason;
        payload.rejected_by = req.authUser.id;
        payload.rejected_at = nowIso;
        payload.approved_by = null;
        payload.approved_at = null;
      } else if (normalizedStatus === 'PENDING') {
        payload.rejection_reason = null;
        payload.approved_by = null;
        payload.approved_at = null;
        payload.rejected_by = null;
        payload.rejected_at = null;
      } else {
        payload.rejection_reason = null;
        payload.rejected_by = null;
        payload.rejected_at = null;
      }

      const { data, error } = await req.supabase
        .from('work_logs')
        .update(payload)
        .eq('id', logId)
        .select('*')
        .single();

      if (error) return res.status(400).json({ message: error.message });
      updatedLogs.push(toWorkLog(data));
    }

    return res.json(updatedLogs);
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
});

app.get('/api/v1/rate', requireAuth, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await req.supabase
    .from('hourly_rates')
    .select('rate, effective_date')
    .lte('effective_date', today)
    .order('effective_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return res.status(400).json({ message: error.message });
  return res.json({
    rate: data?.rate ?? 1500,
    effectiveDate: data?.effective_date ?? today,
  });
});

app.put('/api/v1/rate', requireAuth, async (req, res) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!['ADMIN', 'SUPER_ADMIN'].includes(requester.role)) {
      return res.status(403).json({ message: 'No autorizado para actualizar la tarifa.' });
    }

    const { rate } = req.body ?? {};
    if (!rate || Number(rate) <= 0) {
      return res.status(400).json({ message: 'rate debe ser mayor a 0.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await adminSupabase
      .from('hourly_rates')
      .insert({
        rate,
        effective_date: today,
        created_by: req.authUser.id,
      })
      .select('rate')
      .single();

    if (error) return res.status(400).json({ message: error.message });
    return res.json({ rate: data.rate });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
});

app.listen(Number(PORT), () => {
  console.log(`SENDA backend API listening on http://localhost:${PORT}`);
});
