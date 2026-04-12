/**
 * features/reports/reports.repository.mjs
 *
 * Fetches all raw data needed for payroll computation.
 * Uses adminSupabase to bypass RLS and see every row
 * (ACCOUNTING users need sight of all departments/students).
 */

import { toWorkLog, toUser, toDepartment } from '../../shared/utils/mappers.mjs';
import { AppError } from '../../shared/errors/AppError.mjs';

/**
 * Returns { logs, users, departments } — all mapped to camelCase API shape.
 * @param {import('@supabase/supabase-js').SupabaseClient} adminSupa
 */
export async function fetchAllData(adminSupa) {
  const [logsRes, usersRes, deptsRes, recRes] = await Promise.all([
    adminSupa.from('work_logs').select('*'),
    adminSupa.from('profiles').select('*'),
    adminSupa.from('departments').select('*'),
    adminSupa.from('student_receivables').select('*'),
  ]);

  if (logsRes.error)  throw new AppError('work_logs: '   + logsRes.error.message,  500);
  if (usersRes.error) throw new AppError('profiles: '    + usersRes.error.message,  500);
  if (deptsRes.error) throw new AppError('departments: ' + deptsRes.error.message, 500);
  if (recRes.error)   throw new AppError('student_receivables: ' + recRes.error.message, 500);

  return {
    logs:        logsRes.data.map(toWorkLog),
    users:       usersRes.data.map(toUser),
    departments: deptsRes.data.map(toDepartment),
    receivables: recRes.data.map(r => ({
      id: r.id,
      studentId: r.student_id,
      periodKey: r.period_key,
      amount: r.amount,
    })),
  };
}
