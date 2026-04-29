/**
 * SENDA — Seed de datos de tráfico (2 meses: Marzo y Abril 2026)
 * Crea: departamentos, jefes de departamento, estudiantes, tarifas,
 *       bitácoras de trabajo y cuentas por cobrar.
 *
 * Uso: node /tmp/seed.mjs
 *      (se ejecuta dentro del contenedor senda-backend via docker exec)
 */

import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// Conexión
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function buildAuthEmail(identifier) {
  return `${String(identifier).toLowerCase().trim().replace(/\s+/g, '-')}@senda.internal`;
}

function isoOf(dateStr, hour = 10, minute = 0) {
  return new Date(`${dateStr}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00.000Z`).toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Definición de datos
// ─────────────────────────────────────────────────────────────────────────────

const DEPARTMENTS_DEF = [
  { name: 'Lingüística',   cost_center: '01-01-01' },
  { name: 'Biblioteca',    cost_center: '01-02-01' },
  { name: 'Mantenimiento', cost_center: '01-03-01' },
  { name: 'Limpieza',      cost_center: '01-04-01' },
  { name: 'U-Virtual',     cost_center: '01-05-01' },
];

// 2 jefes por departamento (índice deptIdx corresponde a DEPARTMENTS_DEF)
const DEPT_HEADS_DEF = [
  // Lingüística
  { name: 'Roberto Fuentes',    empNum: 'EMP-LNG-01', deptIdx: 0, instEmail: 'r.fuentes@unadeca.net' },
  { name: 'Carmen Vásquez',     empNum: 'EMP-LNG-02', deptIdx: 0, instEmail: 'c.vasquez@unadeca.net' },
  // Biblioteca
  { name: 'Carlos Mendoza',     empNum: 'EMP-BIB-01', deptIdx: 1, instEmail: 'c.mendoza@unadeca.net' },
  { name: 'Ana Flores',         empNum: 'EMP-BIB-02', deptIdx: 1, instEmail: 'a.flores@unadeca.net' },
  // Mantenimiento
  { name: 'Pedro Ramírez',      empNum: 'EMP-MNT-01', deptIdx: 2, instEmail: 'p.ramirez@unadeca.net' },
  { name: 'Luis García',        empNum: 'EMP-MNT-02', deptIdx: 2, instEmail: 'l.garcia@unadeca.net' },
  // Limpieza
  { name: 'María Santos',       empNum: 'EMP-LMP-01', deptIdx: 3, instEmail: 'm.santos@unadeca.net' },
  { name: 'Rosa Hernández',     empNum: 'EMP-LMP-02', deptIdx: 3, instEmail: 'r.hernandez@unadeca.net' },
  // U-Virtual
  { name: 'David Torres',       empNum: 'EMP-UVT-01', deptIdx: 4, instEmail: 'd.torres@unadeca.net' },
  { name: 'Elena Castillo',     empNum: 'EMP-UVT-02', deptIdx: 4, instEmail: 'e.castillo@unadeca.net' },
];

const STUDENTS_DEF = [
  // ── Lista solicitada ──
  // Formato carnet: YYQQNN  (año 2d + cuatrimestre 01/02/03 + id 2d)
  // Cuatrimestre 2401 (2024-Q1): estudiantes 01-12
  { name: 'Marvin Moncada',      carnet: '240101', instEmail: 'm.moncada@unadeca.net' },
  { name: 'Reyshawn Lawrence',   carnet: '240102', instEmail: 'r.lawrence@unadeca.net' },
  { name: 'Alena Vanegas',       carnet: '240103', instEmail: 'a.vanegas@unadeca.net' },
  { name: 'Axel Hernández',      carnet: '240104', instEmail: 'a.hernandez@unadeca.net' },
  { name: 'Connie Ruiz',         carnet: '240105', instEmail: 'c.ruiz@unadeca.net' },
  { name: 'Nely Navarro',        carnet: '240106', instEmail: 'n.navarro@unadeca.net' },
  { name: 'Alexander Mejía',     carnet: '240107', instEmail: 'al.mejia@unadeca.net' },
  { name: 'Ester Torres',        carnet: '240108', instEmail: 'e.torres@unadeca.net' },
  { name: 'Edgar Miranda',       carnet: '240109', instEmail: 'ed.miranda@unadeca.net' },
  { name: 'Jexon Mejía',         carnet: '240110', instEmail: 'j.mejia@unadeca.net' },
  { name: 'Jessica Medina',      carnet: '240111', instEmail: 'je.medina@unadeca.net' },
  { name: 'Juan Carlos',         carnet: '240112', instEmail: 'j.carlos@unadeca.net' },
  // Cuatrimestre 2402 (2024-Q2): estudiantes 01-12
  { name: 'Kemuel Mayorga',      carnet: '240201', instEmail: 'k.mayorga@unadeca.net' },
  { name: 'Katherine Sánchez',   carnet: '240202', instEmail: 'k.sanchez@unadeca.net' },
  { name: 'Katherine Perla',     carnet: '240203', instEmail: 'k.perla@unadeca.net' },
  { name: 'Liz Galindo',         carnet: '240204', instEmail: 'l.galindo@unadeca.net' },
  { name: 'Milma Mann',          carnet: '240205', instEmail: 'mi.mann@unadeca.net' },
  { name: 'Luiz Gómez',          carnet: '240206', instEmail: 'lu.gomez@unadeca.net' },
  { name: 'Odalin Henríquez',    carnet: '240207', instEmail: 'o.henriquez@unadeca.net' },
  { name: 'Alejandro Betancur',  carnet: '240208', instEmail: 'al.betancur@unadeca.net' },
  { name: 'Josué Masís',         carnet: '240209', instEmail: 'jo.masis@unadeca.net' },
  { name: 'Gle Mora',            carnet: '240210', instEmail: 'g.mora@unadeca.net' },
  { name: 'Will Macho',          carnet: '240211', instEmail: 'w.macho@unadeca.net' },
  { name: 'Víctor Escobar',      carnet: '240212', instEmail: 'v.escobar@unadeca.net' },
  // Cuatrimestre 2403 (2024-Q3): estudiantes 01-03
  { name: 'Fernando Moncada',    carnet: '240301', instEmail: 'f.moncada@unadeca.net' },
  { name: 'Daniela López',       carnet: '240302', instEmail: 'd.lopez@unadeca.net' },
  { name: 'Débora Braga',        carnet: '240303', instEmail: 'de.braga@unadeca.net' },
  // Cuatrimestre 2501 (2025-Q1): estudiantes adicionales 01-08
  { name: 'Diego Herrera',       carnet: '250101', instEmail: 'di.herrera@unadeca.net' },
  { name: 'Sofía Reyes',         carnet: '250102', instEmail: 's.reyes@unadeca.net' },
  { name: 'Pablo Cárdenas',      carnet: '250103', instEmail: 'p.cardenas@unadeca.net' },
  { name: 'Lucía Martínez',      carnet: '250104', instEmail: 'lu.martinez@unadeca.net' },
  { name: 'Rodrigo Fuentes',     carnet: '250105', instEmail: 'ro.fuentes@unadeca.net' },
  { name: 'Valentina Chávez',    carnet: '250106', instEmail: 'v.chavez@unadeca.net' },
  { name: 'Cristian Aguilar',    carnet: '250107', instEmail: 'cr.aguilar@unadeca.net' },
  { name: 'Melissa Vargas',      carnet: '250108', instEmail: 'me.vargas@unadeca.net' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Fechas laborables de los 2 meses
// ─────────────────────────────────────────────────────────────────────────────
const MARCH_DATES = [
  '2026-03-02','2026-03-03','2026-03-04','2026-03-05','2026-03-06',
  '2026-03-09','2026-03-10','2026-03-11','2026-03-12','2026-03-13',
  '2026-03-16','2026-03-17','2026-03-18','2026-03-19','2026-03-20',
  '2026-03-23','2026-03-24','2026-03-25','2026-03-26','2026-03-27',
  '2026-03-30','2026-03-31',
];
const APRIL_DATES = [
  '2026-04-01','2026-04-02','2026-04-03',
  '2026-04-06','2026-04-07','2026-04-08','2026-04-09','2026-04-10',
  '2026-04-13','2026-04-14','2026-04-15','2026-04-16','2026-04-17',
  '2026-04-20','2026-04-21','2026-04-22','2026-04-23','2026-04-24',
  '2026-04-27','2026-04-28',
];

// ─────────────────────────────────────────────────────────────────────────────
// Descripciones por departamento
// ─────────────────────────────────────────────────────────────────────────────
const DESCRIPTIONS = {
  0: [ // Lingüística
    'Apoyo en clasificación de recursos bibliográficos de lingüística aplicada',
    'Revisión y corrección de documentos académicos del departamento',
    'Apoyo en tutoría a estudiantes de primer año en redacción académica',
    'Digitalización de material didáctico para cursos de lingüística',
    'Elaboración de fichas bibliográficas para el repositorio institucional',
    'Apoyo en la organización del taller de escritura académica',
  ],
  1: [ // Biblioteca
    'Catalogación de nuevas adquisiciones bibliográficas',
    'Atención al público y gestión de préstamo de materiales',
    'Organización de estanterías y actualización del archivo físico',
    'Apoyo en inventario y verificación del acervo bibliográfico',
    'Digitalización de documentos históricos del archivo institucional',
    'Registro de devoluciones y actualización de base de datos',
  ],
  2: [ // Mantenimiento
    'Revisión del sistema eléctrico en aulas del edificio A',
    'Pintura y mantenimiento de paredes en edificio de laboratorios',
    'Reparación y reposición de mobiliario en salones de clases',
    'Mantenimiento preventivo de equipos de cómputo del laboratorio',
    'Revisión de instalaciones hidráulicas en baños del campus',
    'Instalación de señalización de emergencia en pasillos',
  ],
  3: [ // Limpieza
    'Limpieza general de áreas comunes y pasillos del campus',
    'Desinfección de baños y sanitarios de laboratorios',
    'Limpieza profunda de salones de clase después de jornada académica',
    'Mantenimiento y poda de áreas verdes y jardines del campus',
    'Limpieza y orden en cafetería institucional',
    'Lavado y desinfección de paredes en áreas de alto tráfico',
  ],
  4: [ // U-Virtual
    'Apoyo técnico en plataforma de educación virtual institucional',
    'Carga y organización de material didáctico en el LMS',
    'Soporte a docentes en uso de herramientas de clases virtuales',
    'Monitoreo y reporte de aulas virtuales activas por período',
    'Configuración de usuarios y cursos en entorno virtual',
    'Grabación y edición de videotutoriales para plataforma LMS',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades de selección determinista
// ─────────────────────────────────────────────────────────────────────────────
function pick(arr, idx) {
  return arr[Math.abs(idx) % arr.length];
}

function pickDates(pool, count, offset) {
  const step = Math.max(1, Math.floor(pool.length / count));
  const result = new Set();
  for (let i = 0; result.size < count && i < pool.length * 2; i++) {
    result.add(pool[(offset + i * step) % pool.length]);
  }
  return [...result].sort();
}

const HOURS_POOL = [4, 5, 6, 3, 8, 4, 5, 6, 7, 4, 3, 5, 6, 4, 8];

// ─────────────────────────────────────────────────────────────────────────────
// Paso 1: Departamentos
// ─────────────────────────────────────────────────────────────────────────────
async function seedDepartments() {
  console.log('\n📂  Creando departamentos...');
  const deptIds = [];
  for (const dep of DEPARTMENTS_DEF) {
    const { data, error } = await sb
      .from('departments')
      .insert(dep)
      .select('id')
      .single();
    if (error) {
      console.error(`  ❌  ${dep.name}: ${error.message}`);
      deptIds.push(null);
    } else {
      console.log(`  ✅  ${dep.name} → ${data.id}`);
      deptIds.push(data.id);
    }
  }
  return deptIds; // [lingId, bibId, mntId, lmpId, uvtId]
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 2: Crear usuario auth + actualizar perfil
// ─────────────────────────────────────────────────────────────────────────────
async function createUserWithProfile({ email, password, name, role, carnet, employeeNumber, departmentId, instEmail }) {
  const metadata = {
    name,
    role,
    ...(carnet         && { carnet }),
    ...(employeeNumber && { employee_number: employeeNumber }),
    ...(departmentId   && { department_id: departmentId }),
  };

  const { data: authData, error: authErr } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (authErr || !authData?.user) {
    return { id: null, error: authErr?.message ?? 'No se pudo crear auth user' };
  }

  const userId = authData.user.id;

  // Pequeña pausa para que el trigger de DB procese el nuevo usuario
  await new Promise(r => setTimeout(r, 150));

  const { error: profErr } = await sb.from('profiles').update({
    institutional_email: instEmail ?? null,
    must_change_password: true,
    ...(departmentId && { department_id: departmentId }),
  }).eq('id', userId);

  if (profErr) {
    console.warn(`    ⚠️  Perfil no actualizado (${name}): ${profErr.message}`);
  }

  return { id: userId, error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 3: Jefes de departamento
// ─────────────────────────────────────────────────────────────────────────────
async function seedDeptHeads(deptIds) {
  console.log('\n👔  Creando jefes de departamento...');
  // headsByDept[deptIdx] = [id1, id2]
  const headsByDept = Array.from({ length: deptIds.length }, () => []);

  for (const hd of DEPT_HEADS_DEF) {
    const deptId = deptIds[hd.deptIdx];
    if (!deptId) { console.warn(`  ⚠️  Dept ${hd.deptIdx} sin ID, saltando ${hd.name}`); continue; }

    const email = buildAuthEmail(hd.empNum);
    const { id, error } = await createUserWithProfile({
      email,
      password: 'Senda2026#',
      name: hd.name,
      role: 'DEPT_HEAD',
      employeeNumber: hd.empNum,
      departmentId: deptId,
      instEmail: hd.instEmail,
    });

    if (error || !id) {
      console.error(`  ❌  ${hd.name}: ${error}`);
    } else {
      headsByDept[hd.deptIdx].push(id);
      console.log(`  ✅  ${hd.name} (${hd.empNum}) → ${id}`);
    }
  }
  return headsByDept;
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 4: Estudiantes
// ─────────────────────────────────────────────────────────────────────────────
async function seedStudents(deptIds) {
  console.log('\n🎓  Creando estudiantes...');
  const studentIds = [];

  for (let i = 0; i < STUDENTS_DEF.length; i++) {
    const st = STUDENTS_DEF[i];
    // Asignamos departamento principal al estudiante (rotando entre depts)
    const primaryDeptId = deptIds[i % deptIds.length];

    const email = buildAuthEmail(st.carnet);
    const { id, error } = await createUserWithProfile({
      email,
      password: 'Senda2026#',
      name: st.name,
      role: 'STUDENT',
      carnet: st.carnet,
      departmentId: primaryDeptId,
      instEmail: st.instEmail,
    });

    if (error || !id) {
      console.error(`  ❌  ${st.name}: ${error}`);
      studentIds.push(null);
    } else {
      console.log(`  ✅  ${st.name} (${st.carnet}) → ${id}`);
      studentIds.push(id);
    }
  }
  return studentIds;
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 5: Tarifa por hora
// ─────────────────────────────────────────────────────────────────────────────
async function seedHourlyRate() {
  console.log('\n💰  Insertando tarifa por hora...');
  const { error } = await sb.from('hourly_rates').insert({
    rate: 75.00,
    effective_date: '2026-01-01',
  });
  if (error) {
    if (error.code === '23505') {
      console.log('  ℹ️  Tarifa ya existente, omitida.');
    } else {
      console.error('  ❌  hourly_rates:', error.message);
    }
  } else {
    console.log('  ✅  75.00 HNL/hr desde 2026-01-01');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 6: Bitácoras de trabajo (2 meses)
// ─────────────────────────────────────────────────────────────────────────────
async function seedWorkLogs(studentIds, deptIds, headsByDept) {
  console.log('\n📋  Generando bitácoras de trabajo...');

  const validStudents = studentIds.filter(Boolean);
  const validDepts    = deptIds.filter(Boolean);
  let totalInserted   = 0;
  const approvedHoursByStudentPeriod = {}; // { studentId_period: hours }

  function addApprovedHours(studentId, period, hours) {
    const key = `${studentId}::${period}`;
    approvedHoursByStudentPeriod[key] = (approvedHoursByStudentPeriod[key] ?? 0) + hours;
  }

  for (let si = 0; si < validStudents.length; si++) {
    const studentId = validStudents[si];
    const primaryDeptIdx = si % validDepts.length;
    // Algunos estudiantes rotan entre 2 departamentos
    const secondaryDeptIdx = (si % 3 === 0) ? (primaryDeptIdx + 1) % validDepts.length : primaryDeptIdx;

    const logsToInsert = [];

    // ── MARZO (4-5 entradas) — APPROVED/PROCESSED ──────────────────────────
    const marchDatesForStudent = pickDates(MARCH_DATES, 4 + (si % 2), si * 3);
    for (let di = 0; di < marchDatesForStudent.length; di++) {
      const date        = marchDatesForStudent[di];
      const deptIdx     = di % 2 === 0 ? primaryDeptIdx : secondaryDeptIdx;
      const deptId      = validDepts[deptIdx];
      const approverId  = pick(headsByDept[deptIdx] ?? [], si + di) ?? null;
      const hours       = pick(HOURS_POOL, si + di);
      const description = pick(DESCRIPTIONS[deptIdx] ?? DESCRIPTIONS[0], si + di);
      const approvedAt  = isoOf(date, 17, (si * 7) % 60);
      const status      = di % 7 === 0 ? 'PROCESSED' : 'APPROVED';

      logsToInsert.push({
        student_id:   studentId,
        department_id: deptId,
        date,
        hours,
        description,
        status,
        entry_source: di % 4 === 0 ? 'KIOSK' : 'MANUAL',
        approved_by:   approverId,
        approved_at:   approverId ? approvedAt : null,
        rejected_by:   null,
        rejected_at:   null,
        rejection_reason: null,
        start_time: isoOf(date, 8, (si * 11) % 30),
        end_time:   isoOf(date, 8 + hours, (si * 11) % 30),
      });

      if (approverId) addApprovedHours(studentId, '2026-03', hours);
    }

    // ── ABRIL (3-4 entradas) — mix APPROVED / PENDING / 1 REJECTED ─────────
    const aprilDatesForStudent = pickDates(APRIL_DATES, 3 + (si % 2), si * 5);
    for (let di = 0; di < aprilDatesForStudent.length; di++) {
      const date       = aprilDatesForStudent[di];
      const deptIdx    = di % 2 === 0 ? primaryDeptIdx : secondaryDeptIdx;
      const deptId     = validDepts[deptIdx];
      const approverId = pick(headsByDept[deptIdx] ?? [], si + di) ?? null;
      const hours      = pick(HOURS_POOL, si + di + 5);
      const description= pick(DESCRIPTIONS[deptIdx] ?? DESCRIPTIONS[0], si + di + 2);

      let status, rejectionReason = null, approvedBy = null, approvedAt = null,
          rejectedBy = null, rejectedAt = null;

      if (di === 1 && si % 8 === 0) {
        // 1 entrada rechazada (realismo)
        status        = 'REJECTED';
        rejectionReason = 'Documentación de respaldo incompleta para la sesión registrada.';
        rejectedBy    = approverId;
        rejectedAt    = isoOf(date, 18, 0);
      } else if (di >= aprilDatesForStudent.length - 1 && date >= '2026-04-25') {
        // Últimas fechas de abril → PENDING (sin aprobar aún)
        status = 'PENDING';
      } else {
        status     = 'APPROVED';
        approvedBy = approverId;
        approvedAt = isoOf(date, 17, (si * 7) % 60);
        if (approverId) addApprovedHours(studentId, '2026-04', hours);
      }

      logsToInsert.push({
        student_id:   studentId,
        department_id: deptId,
        date,
        hours,
        description,
        status,
        entry_source: di % 3 === 0 ? 'KIOSK' : 'MANUAL',
        approved_by:   approvedBy,
        approved_at:   approvedAt,
        rejected_by:   rejectedBy,
        rejected_at:   rejectedAt,
        rejection_reason: rejectionReason,
        start_time: isoOf(date, 8, (si * 11) % 30),
        end_time:   isoOf(date, 8 + hours, (si * 11) % 30),
      });
    }

    // Insertamos en lote para este estudiante
    const { error } = await sb.from('work_logs').insert(logsToInsert);
    if (error) {
      console.error(`  ❌  work_logs [${si}]: ${error.message}`);
    } else {
      totalInserted += logsToInsert.length;
    }
  }

  console.log(`  ✅  ${totalInserted} bitácoras insertadas`);
  return approvedHoursByStudentPeriod;
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 7: Cuentas por cobrar (student_receivables)
// ─────────────────────────────────────────────────────────────────────────────
async function seedReceivables(approvedHoursByStudentPeriod) {
  console.log('\n🧾  Generando cuentas por cobrar...');
  const RATE = 75.00;
  const records = [];

  for (const [key, hours] of Object.entries(approvedHoursByStudentPeriod)) {
    const [studentId, period] = key.split('::');
    records.push({
      student_id: studentId,
      period_key: period,
      amount: parseFloat((hours * RATE).toFixed(2)),
    });
  }

  if (records.length === 0) {
    console.log('  ℹ️  No hay horas aprobadas, omitiendo receivables.');
    return;
  }

  const { error } = await sb
    .from('student_receivables')
    .upsert(records, { onConflict: 'student_id, period_key' });

  if (error) {
    console.error('  ❌  student_receivables:', error.message);
  } else {
    console.log(`  ✅  ${records.length} registros de cuentas por cobrar`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 8: accounting_config (si está vacío)
// ─────────────────────────────────────────────────────────────────────────────
async function seedAccountingConfig() {
  const { data } = await sb.from('accounting_config').select('id').eq('id', 1).maybeSingle();
  if (data) return; // ya existe

  const { error } = await sb.from('accounting_config').insert({
    id: 1,
    rate_per_hour: 75.00,
    current_period_key: '2026-04',
  });
  if (error && error.code !== '23505') {
    console.warn('  ⚠️  accounting_config no pudo inicializarse:', error.message);
  } else {
    console.log('  ✅  accounting_config inicializada');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner principal
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  SENDA — Seed de tráfico (Marzo-Abril 2026)');
  console.log('═══════════════════════════════════════════════════════');

  const deptIds   = await seedDepartments();
  const headsByDept = await seedDeptHeads(deptIds);
  const studentIds  = await seedStudents(deptIds);

  await seedHourlyRate();
  await seedAccountingConfig();

  const approvedHours = await seedWorkLogs(studentIds, deptIds, headsByDept);
  await seedReceivables(approvedHours);

  // Resumen
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅  Seed completado');
  console.log(`   Departamentos : ${deptIds.filter(Boolean).length}`);
  console.log(`   Jefes dept.   : ${headsByDept.flat().filter(Boolean).length}`);
  console.log(`   Estudiantes   : ${studentIds.filter(Boolean).length}`);
  console.log('   Períodos      : Marzo 2026, Abril 2026');
  console.log('═══════════════════════════════════════════════════════');
}

main().catch(e => {
  console.error('❌  Error fatal:', e.message);
  process.exit(1);
});
