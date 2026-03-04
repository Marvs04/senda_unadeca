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

function buildAuthEmail(identifier) {
  return `${String(identifier).toLowerCase().trim().replace(/\s+/g, '-')}@senda.internal`;
}

function toUser(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    carnet: row.carnet ?? undefined,
    employeeNumber: row.employee_number ?? undefined,
    departmentId: row.department_id ?? undefined,
    isActive: row.is_active !== false,
  };
}

function toDepartment(row) {
  return {
    id: row.id,
    name: row.name,
    headId: row.head_id ?? undefined,
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

    const { name, role, carnet, employeeNumber, departmentId, password } = req.body ?? {};
    if (!name || !role) return res.status(400).json({ message: 'name y role son requeridos.' });

    const identifier = carnet ?? employeeNumber ?? name;
    const email = buildAuthEmail(identifier);

    const { data: createdAuth, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password: password ?? 'Temp#123456',
      email_confirm: true,
      user_metadata: {
        name,
        role,
        carnet: carnet ?? null,
        employee_number: employeeNumber ?? null,
        department_id: departmentId ?? null,
      },
    });

    if (createError || !createdAuth.user) {
      return res.status(400).json({ message: createError?.message ?? 'No fue posible crear usuario.' });
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', createdAuth.user.id)
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
    const { name, role, carnet, employeeNumber, departmentId, isActive } = req.body ?? {};

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

    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (carnet !== undefined) updates.carnet = carnet ? String(carnet).trim() : null;
    if (employeeNumber !== undefined) updates.employee_number = employeeNumber ? String(employeeNumber).trim() : null;
    if (departmentId !== undefined) updates.department_id = departmentId ? String(departmentId).trim() : null;
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

    const { name, headId } = req.body ?? {};
    const normalizedName = String(name ?? '').trim();
    const normalizedHeadId = typeof headId === 'string' && headId.trim() ? headId.trim() : null;

    if (!normalizedName) {
      return res.status(400).json({ message: 'El nombre del departamento es requerido.' });
    }

    const { data, error } = await adminSupabase
      .from('departments')
      .insert({ name: normalizedName, head_id: normalizedHeadId })
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
    const { name, headId } = req.body ?? {};
    const updates = {};

    if (name !== undefined) {
      const normalizedName = String(name).trim();
      if (!normalizedName) {
        return res.status(400).json({ message: 'El nombre del departamento no puede estar vacío.' });
      }
      updates.name = normalizedName;
    }

    if (headId !== undefined) {
      updates.head_id = typeof headId === 'string' && headId.trim() ? headId.trim() : null;
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

app.get('/api/v1/work-logs', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('work_logs')
    .select('*')
    .order('date', { ascending: false });

  if (error) return res.status(400).json({ message: error.message });
  return res.json((data ?? []).map(toWorkLog));
});

app.post('/api/v1/work-logs', requireAuth, async (req, res) => {
  const { studentId, departmentId, date, hours, description, status, rejectionReason } = req.body ?? {};
  const { data, error } = await req.supabase
    .from('work_logs')
    .insert({
      student_id: studentId,
      department_id: departmentId,
      date,
      hours,
      description,
      status,
      rejection_reason: rejectionReason ?? null,
    })
    .select('*')
    .single();

  if (error) return res.status(400).json({ message: error.message });
  return res.status(201).json(toWorkLog(data));
});

app.patch('/api/v1/work-logs/:id/status', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body ?? {};

  const { error } = await req.supabase
    .from('work_logs')
    .update({ status, rejection_reason: rejectionReason ?? null })
    .eq('id', id);

  if (error) return res.status(400).json({ message: error.message });
  return res.status(204).send();
});

app.patch('/api/v1/work-logs/bulk-status', requireAuth, async (req, res) => {
  const { updates } = req.body ?? {};
  if (!Array.isArray(updates)) {
    return res.status(400).json({ message: 'updates debe ser un arreglo.' });
  }

  for (const update of updates) {
    const { logId, status } = update;
    const { error } = await req.supabase
      .from('work_logs')
      .update({ status })
      .eq('id', logId);

    if (error) return res.status(400).json({ message: error.message });
  }

  return res.status(204).send();
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
  const { rate } = req.body ?? {};
  if (!rate || Number(rate) <= 0) {
    return res.status(400).json({ message: 'rate debe ser mayor a 0.' });
  }

  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await req.supabase
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
});

app.listen(Number(PORT), () => {
  console.log(`SENDA backend API listening on http://localhost:${PORT}`);
});
