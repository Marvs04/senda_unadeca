/**
 * features/reports/reports.service.mjs
 *
 * Payroll computation — logic ported from frontend/hooks/useAccountingData.ts.
 * Receives raw query params from the controller and returns a fully aggregated
 * payroll report that the frontend can render directly.
 */

import { AppError }           from '../../shared/errors/AppError.mjs';
import * as repo              from './reports.repository.mjs';
import { isDateInCycle, isDateInTrimester, TITHE_PERCENTAGE } from './reports.schemas.mjs';

const ALLOWED_ROLES = new Set(['ACCOUNTING', 'SUPER_ADMIN', 'ADMIN']);

// ─── Helper: per-student aggregation ────────────────────────────────────────

function aggregate(logList, users, rateNum) {
  const map = {};
  for (const log of logList) {
    if (!map[log.studentId]) {
      const student = users.find(u => u.id === log.studentId);
      map[log.studentId] = {
        studentId:    log.studentId,
        studentName:  student?.name ?? 'N/A',
        carnet:       student?.carnet ?? undefined,
        departmentId: log.departmentId,
        totalHours:   0,
        totalBruto:   0,
        totalTithe:   0,
        totalNeto:    0,
        logIds:       [],
      };
    }
    const bruto = log.hours * rateNum;
    map[log.studentId].totalHours += log.hours;
    map[log.studentId].totalBruto += bruto;
    map[log.studentId].totalTithe += bruto * TITHE_PERCENTAGE;
    map[log.studentId].totalNeto  += bruto * (1 - TITHE_PERCENTAGE);
    map[log.studentId].logIds.push(log.id);
  }
  return Object.values(map);
}

// ─── Helper: build department books ─────────────────────────────────────────

function buildDeptBooks(entries, departments) {
  const map = new Map();
  for (const entry of entries) {
    const dept     = departments.find(d => d.id === entry.departmentId);
    const deptName = dept?.name ?? 'Sin Departamento';
    if (!map.has(entry.departmentId)) {
      map.set(entry.departmentId, {
        departmentId:   entry.departmentId,
        departmentName: deptName,
        students:       [],
        totalHours:     0,
        totalBruto:     0,
        totalTithe:     0,
        totalNeto:      0,
      });
    }
    const book = map.get(entry.departmentId);
    book.students.push(entry);
    book.totalHours += entry.totalHours;
    book.totalBruto += entry.totalBruto;
    book.totalTithe += entry.totalTithe;
    book.totalNeto  += entry.totalNeto;
  }
  return [...map.values()].sort((a, b) =>
    a.departmentName.localeCompare(b.departmentName),
  );
}

// ─── Main service function ───────────────────────────────────────────────────

/**
 * @param {{ role: string }} requesterProfile
 * @param {{ mode, cycle, trimester, year, deptId, search, rate }} params  — raw query strings
 * @param {import('@supabase/supabase-js').SupabaseClient} adminSupa
 */
export async function getPayrollReport(requesterProfile, params, adminSupa) {
  if (!ALLOWED_ROLES.has(requesterProfile.role)) {
    throw new AppError('Acceso denegado: se requiere rol ACCOUNTING, ADMIN o SUPER_ADMIN', 403);
  }

  const { mode, cycle, deptId, search } = params;
  const rateNum     = Number(params.rate)      || 0;
  const yearNum     = Number(params.year)      || new Date().getFullYear();
  const trimNum     = Number(params.trimester) || 1;

  // ── 1. Fetch raw data (already camelCase via mappers) ─────────────────────
  const { logs, users, departments } = await repo.fetchAllData(adminSupa);

  // ── 2. Filter by period ───────────────────────────────────────────────────
  let periodLogs = logs.filter(log =>
    mode === 'cycle'
      ? isDateInCycle(log.date, cycle)
      : isDateInTrimester(log.date, trimNum, yearNum),
  );

  // ── 3. Filter by department ───────────────────────────────────────────────
  if (deptId && deptId !== 'all') {
    periodLogs = periodLogs.filter(l => l.departmentId === deptId);
  }

  // ── 4. Search filter (name or carnet) ─────────────────────────────────────
  const term = (search ?? '').toLowerCase().trim();
  const matchesSearch = (log) => {
    if (!term) return true;
    const student = users.find(u => u.id === log.studentId);
    return (
      (student?.name?.toLowerCase().includes(term) ?? false) ||
      (student?.carnet?.toLowerCase().includes(term) ?? false)
    );
  };

  // ── 5. Split by status ────────────────────────────────────────────────────
  const approvedLogs  = periodLogs.filter(l => l.status === 'APPROVED'  && matchesSearch(l));
  const processedLogs = periodLogs.filter(l => l.status === 'PROCESSED' && matchesSearch(l));

  // ── 6. Aggregate per student ──────────────────────────────────────────────
  const approvedForPayroll  = aggregate(approvedLogs,  users, rateNum);
  const processedForPayroll = aggregate(processedLogs, users, rateNum);

  // ── 7. Grand totals ───────────────────────────────────────────────────────
  const totalApprovedAmount  = approvedForPayroll.reduce((s, i)  => s + i.totalBruto, 0);
  const totalProcessedAmount = processedForPayroll.reduce((s, i) => s + i.totalBruto, 0);

  // ── 8. Department books ───────────────────────────────────────────────────
  const approvedBooks  = buildDeptBooks(approvedForPayroll,  departments);
  const processedBooks = buildDeptBooks(processedForPayroll, departments);

  // ── 9. Trimester quarterly summary (all 3 trimesters of selected year) ────
  //    Uses ALL logs — not filtered by dept/search — to match frontend behaviour.
  const trimesterSummary = [1, 2, 3].map(tNum => {
    const tLogs = logs.filter(l => isDateInTrimester(l.date, tNum, yearNum));
    const hours = tLogs.reduce((s, l) => s + l.hours, 0);
    const bruto = hours * rateNum;
    const tithe = bruto * TITHE_PERCENTAGE;
    return { trimester: tNum, hours, bruto, tithe, neto: bruto - tithe };
  });

  // ── 10. Dept chart data: bruto + neto per department (approved only) ──────
  const deptChartData = departments.map(d => {
    const book = approvedBooks.find(b => b.departmentId === d.id);
    return {
      name:  d.name,
      bruto: book?.totalBruto ?? 0,
      neto:  book?.totalNeto  ?? 0,
      hours: book?.totalHours ?? 0,
    };
  }).filter(d => d.bruto > 0);

  // ── 11. Top-5 students by bruto (approved) ────────────────────────────────
  const chartData = [...approvedForPayroll]
    .sort((a, b) => b.totalBruto - a.totalBruto)
    .slice(0, 5)
    .map(item => ({
      name:  item.studentName.split(' ')[0] ?? 'N/A',
      monto: item.totalBruto,
      neto:  item.totalNeto,
    }));

  // ── 12. Weekly summary ────────────────────────────────────────────────────
  const weeklySummaryMap = periodLogs.reduce((acc, log) => {
    const date  = new Date(log.date + 'T00:00:00');
    const week  = `W${Math.ceil(date.getDate() / 7)}`;
    const month = date.toLocaleString('es-ES', { month: 'short' });
    const key   = `${month} - ${week}`;
    if (!acc[key]) acc[key] = { key, hours: 0, amount: 0 };
    acc[key].hours  += log.hours;
    acc[key].amount += log.hours * rateNum;
    return acc;
  }, {});

  // ── 13. Dept hours (pie chart) ────────────────────────────────────────────
  const deptData = departments.map(d => ({
    name:  d.name,
    value: periodLogs
      .filter(l => l.departmentId === d.id)
      .reduce((s, l) => s + l.hours, 0),
  })).filter(d => d.value > 0);

  return {
    approvedForPayroll,
    processedForPayroll,
    approvedBooks,
    processedBooks,
    totalApprovedAmount,
    totalProcessedAmount,
    chartData,
    deptData,
    deptChartData,
    weeklySummary: Object.values(weeklySummaryMap),
    trimesterSummary,
  };
}
