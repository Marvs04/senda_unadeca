/**
 * Agrega bitácoras de trabajo para el ciclo 2026-05
 * (Abr 26 – Abr 29 + Mayo 1-29, 2026)
 * Solo inserta — no borra datos existentes.
 */
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function isoOf(dateStr, hour = 8, minute = 0) {
  return new Date(`${dateStr}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00.000Z`).toISOString();
}

const HOURS_POOL   = [4, 5, 6, 3, 8, 4, 5, 6, 7, 4, 3, 5, 6, 4, 8];
const DESCRIPTIONS = {
  0: [
    'Apoyo en clasificación de recursos bibliográficos de lingüística aplicada',
    'Revisión y corrección de documentos académicos del departamento',
    'Digitalización de material didáctico para cursos de lingüística',
  ],
  1: [
    'Catalogación de nuevas adquisiciones bibliográficas',
    'Atención al público y gestión de préstamo de materiales',
    'Registro de devoluciones y actualización de base de datos',
  ],
  2: [
    'Revisión del sistema eléctrico en aulas del edificio A',
    'Reparación y reposición de mobiliario en salones de clases',
    'Instalación de señalización de emergencia en pasillos',
  ],
  3: [
    'Limpieza general de áreas comunes y pasillos del campus',
    'Desinfección de baños y sanitarios de laboratorios',
    'Limpieza profunda de salones de clase después de jornada académica',
  ],
  4: [
    'Apoyo técnico en plataforma de educación virtual institucional',
    'Carga y organización de material didáctico en el LMS',
    'Configuración de usuarios y cursos en entorno virtual',
  ],
};

function pick(arr, idx) { return arr[Math.abs(idx) % arr.length]; }

// Días hábiles del ciclo 2026-05 (Abr 26–29 + Mayo 2026)
const CYCLE_DATES = [
  // Últimos días de abril (dentro del ciclo 2026-05)
  '2026-04-27','2026-04-28','2026-04-29',
  // Mayo 2026
  '2026-05-04','2026-05-05','2026-05-06','2026-05-07','2026-05-08',
  '2026-05-11','2026-05-12','2026-05-13','2026-05-14','2026-05-15',
  '2026-05-18','2026-05-19','2026-05-20','2026-05-21','2026-05-22',
  '2026-05-25',
];

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Seed ciclo 2026-05 (Abr 26 – May 25, 2026)');
  console.log('═══════════════════════════════════════════════════════\n');

  // Traer estudiantes y departamentos
  const { data: students } = await sb
    .from('profiles')
    .select('id, carnet, department_id')
    .eq('role', 'STUDENT')
    .eq('is_active', true);

  const { data: depts } = await sb
    .from('departments')
    .select('id');

  const { data: heads } = await sb
    .from('profiles')
    .select('id, department_id')
    .eq('role', 'DEPT_HEAD')
    .eq('is_active', true);

  const deptIds  = depts.map(d => d.id);
  const headMap  = {};  // deptId → [headId, ...]
  for (const h of heads) {
    if (!headMap[h.department_id]) headMap[h.department_id] = [];
    headMap[h.department_id].push(h.id);
  }

  // Usar solo los primeros 20 días del ciclo para datos "aprobados"
  // Los últimos 3 días quedan PENDING (trabajo reciente sin aprobar)
  const APPROVED_CUTOFF = '2026-05-23';

  let totalInserted = 0;
  const approvedHours = {}; // studentId → hours (mayo)

  for (let si = 0; si < students.length; si++) {
    const st = students[si];
    const primaryDeptId   = st.department_id ?? deptIds[si % deptIds.length];
    const primaryDeptIdx  = deptIds.indexOf(primaryDeptId);
    const secDeptIdx      = (primaryDeptIdx + 1) % deptIds.length;

    // Cada estudiante trabaja 3-4 días del ciclo
    const count = 3 + (si % 2);
    const step  = Math.max(1, Math.floor(CYCLE_DATES.length / count));
    const dates = [];
    for (let i = 0; dates.length < count && i < CYCLE_DATES.length; i++) {
      dates.push(CYCLE_DATES[(si * 3 + i * step) % CYCLE_DATES.length]);
    }
    const uniqueDates = [...new Set(dates)].sort();

    const logs = [];
    for (let di = 0; di < uniqueDates.length; di++) {
      const date      = uniqueDates[di];
      const deptIdx   = di % 2 === 0 ? primaryDeptIdx : secDeptIdx;
      const deptId    = deptIds[deptIdx] ?? primaryDeptId;
      const headsArr  = headMap[deptId] ?? [];
      const approverId = headsArr.length ? pick(headsArr, si + di) : null;
      const hours     = pick(HOURS_POOL, si + di + 7);
      const desc      = pick(DESCRIPTIONS[deptIdx] ?? DESCRIPTIONS[0], si + di);

      const isPending = date > APPROVED_CUTOFF;
      const status    = isPending ? 'PENDING' : 'APPROVED';

      logs.push({
        student_id:      st.id,
        department_id:   deptId,
        date,
        hours,
        description:     desc,
        status,
        entry_source:    di % 3 === 0 ? 'KIOSK' : 'MANUAL',
        approved_by:     !isPending && approverId ? approverId : null,
        approved_at:     !isPending && approverId ? isoOf(date, 17, (si * 7) % 60) : null,
        rejected_by:     null,
        rejected_at:     null,
        rejection_reason: null,
        start_time:      isoOf(date, 8,  (si * 11) % 30),
        end_time:        isoOf(date, 8 + hours, (si * 11) % 30),
      });

      if (!isPending && approverId) {
        approvedHours[st.id] = (approvedHours[st.id] ?? 0) + hours;
      }
    }

    const { error } = await sb.from('work_logs').insert(logs);
    if (error) {
      console.error(`  ❌  [${si}] ${error.message}`);
    } else {
      totalInserted += logs.length;
    }
  }

  console.log(`  ✅  ${totalInserted} bitácoras insertadas`);

  // Upsert cuentas por cobrar de mayo
  const RATE = 75.00;
  const records = Object.entries(approvedHours).map(([studentId, hours]) => ({
    student_id:  studentId,
    period_key:  '2026-05',
    amount:      parseFloat((hours * RATE).toFixed(2)),
  }));

  if (records.length) {
    const { error } = await sb
      .from('student_receivables')
      .upsert(records, { onConflict: 'student_id, period_key' });
    if (error) console.error('  ❌  student_receivables:', error.message);
    else console.log(`  ✅  ${records.length} registros de cuentas por cobrar (2026-05)`);
  }

  // Verificar
  const { data: summary } = await sb
    .from('work_logs')
    .select('status, hours')
    .gte('date', '2026-04-26');

  const byStatus = (summary ?? []).reduce((a, r) => { a[r.status] = (a[r.status] ?? 0) + 1; return a; }, {});
  const totalHrs = (summary ?? []).reduce((a, r) => a + Number(r.hours), 0);

  console.log('\n─────────────────────────────────────────────');
  console.log('  Verificación ciclo 2026-05:');
  console.log('  Bitácoras:', JSON.stringify(byStatus));
  console.log('  Horas totales ciclo:', totalHrs);
  console.log('═══════════════════════════════════════════════════════');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
