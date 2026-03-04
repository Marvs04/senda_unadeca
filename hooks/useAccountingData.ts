/**
 * hooks/useAccountingData.ts
 *
 * Derives all computed payroll data for the Accounting portal.
 * Supports: dept-book grouping, carnet/name search, full financial breakdown,
 *           quarterly summaries, and per-dept chart data.
 */

import { useMemo } from 'react';
import { WorkLog, WorkLogStatus, User, Department } from '../types';
import { isDateInCycle, isDateInTrimester } from '../lib/business';
import { TITHE_PERCENTAGE } from '../constants';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface PayrollEntry {
  studentId: string;
  studentName: string;
  carnet?: string;
  departmentId: string;
  totalHours: number;
  totalBruto: number;
  totalTithe: number;
  totalNeto: number;
  logIds: string[];
}

/** One "book" per department: aggregated totals + individual student entries. */
export interface DeptBook {
  departmentId: string;
  departmentName: string;
  students: PayrollEntry[];
  totalHours: number;
  totalBruto: number;
  totalTithe: number;
  totalNeto: number;
}

export interface TrimesterSummaryItem {
  trimester: number;
  hours: number;
  bruto: number;
  tithe: number;
  neto: number;
}

interface UseAccountingDataParams {
  allLogs: WorkLog[];
  allUsers: User[];
  allDepartments: Department[];
  viewMode: 'cycle' | 'trimester';
  selectedCycle: string;
  selectedTrimester: number;
  selectedYear: number;
  searchTerm: string;
  selectedDeptId: string;
  currentRate: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAccountingData({
  allLogs,
  allUsers,
  allDepartments,
  viewMode,
  selectedCycle,
  selectedTrimester,
  selectedYear,
  searchTerm,
  selectedDeptId,
  currentRate,
}: UseAccountingDataParams) {
  return useMemo(() => {
    const users = allUsers ?? [];
    const depts = allDepartments ?? [];
    const logs  = allLogs ?? [];

    // 1. Filter by period
    let periodLogs = logs.filter(log =>
      viewMode === 'cycle'
        ? isDateInCycle(log.date, selectedCycle)
        : isDateInTrimester(log.date, selectedTrimester, selectedYear),
    );

    // 2. Filter by department
    if (selectedDeptId !== 'all') {
      periodLogs = periodLogs.filter(l => l.departmentId === selectedDeptId);
    }

    // 3. Search: matches student name OR carnet
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = (log: WorkLog): boolean => {
      if (!term) return true;
      const student = users.find(u => u.id === log.studentId);
      return (
        (student?.name?.toLowerCase().includes(term) ?? false) ||
        (student?.carnet?.toLowerCase().includes(term) ?? false)
      );
    };

    // 4. Split by status
    const approvedLogs   = periodLogs.filter(l => l.status === WorkLogStatus.APPROVED  && matchesSearch(l));
    const processedLogs  = periodLogs.filter(l => l.status === WorkLogStatus.PROCESSED && matchesSearch(l));

    // 5. Per-student aggregation with full financial breakdown
    const aggregate = (logList: WorkLog[]): PayrollEntry[] =>
      Object.values(
        logList.reduce((acc, log) => {
          if (!acc[log.studentId]) {
            const student = users.find(u => u.id === log.studentId);
            acc[log.studentId] = {
              studentId:   log.studentId,
              studentName: student?.name ?? 'N/A',
              carnet:      student?.carnet,
              departmentId: log.departmentId,
              totalHours: 0,
              totalBruto: 0,
              totalTithe: 0,
              totalNeto:  0,
              logIds:     [],
            };
          }
          const bruto = log.hours * currentRate;
          acc[log.studentId].totalHours += log.hours;
          acc[log.studentId].totalBruto += bruto;
          acc[log.studentId].totalTithe += bruto * TITHE_PERCENTAGE;
          acc[log.studentId].totalNeto  += bruto * (1 - TITHE_PERCENTAGE);
          acc[log.studentId].logIds.push(log.id);
          return acc;
        }, {} as Record<string, PayrollEntry>),
      );

    const approvedForPayroll  = aggregate(approvedLogs);
    const processedForPayroll = aggregate(processedLogs);

    // 6. Grand totals
    const totalApprovedAmount  = approvedForPayroll.reduce((s, i) => s + i.totalBruto, 0);
    const totalProcessedAmount = processedForPayroll.reduce((s, i) => s + i.totalBruto, 0);

    // 7. Build department books
    const buildDeptBooks = (entries: PayrollEntry[]): DeptBook[] => {
      const map = new Map<string, DeptBook>();
      for (const entry of entries) {
        const dept = depts.find(d => d.id === entry.departmentId);
        const deptName = dept?.name ?? 'Sin Departamento';
        if (!map.has(entry.departmentId)) {
          map.set(entry.departmentId, {
            departmentId:   entry.departmentId,
            departmentName: deptName,
            students:       [],
            totalHours: 0,
            totalBruto: 0,
            totalTithe: 0,
            totalNeto:  0,
          });
        }
        const book = map.get(entry.departmentId)!;
        book.students.push(entry);
        book.totalHours += entry.totalHours;
        book.totalBruto += entry.totalBruto;
        book.totalTithe += entry.totalTithe;
        book.totalNeto  += entry.totalNeto;
      }
      return [...map.values()].sort((a, b) =>
        a.departmentName.localeCompare(b.departmentName),
      );
    };

    const approvedBooks  = buildDeptBooks(approvedForPayroll);
    const processedBooks = buildDeptBooks(processedForPayroll);

    // 8. Trimester quarterly summary (all 3 trimesters for selected year)
    const trimesterSummary: TrimesterSummaryItem[] = [1, 2, 3].map(tNum => {
      const tLogs  = logs.filter(l => isDateInTrimester(l.date, tNum, selectedYear));
      const hours  = tLogs.reduce((s, l) => s + l.hours, 0);
      const bruto  = hours * currentRate;
      const tithe  = bruto * TITHE_PERCENTAGE;
      return { trimester: tNum, hours, bruto, tithe, neto: bruto - tithe };
    });

    // 9. Dept chart data: bruto + neto per department (approved)
    const deptChartData = depts.map(d => {
      const book = approvedBooks.find(b => b.departmentId === d.id);
      return {
        name:  d.name,
        bruto: book?.totalBruto ?? 0,
        neto:  book?.totalNeto  ?? 0,
        hours: book?.totalHours ?? 0,
      };
    }).filter(d => d.bruto > 0);

    // 10. Top-5 students by bruto (approved)
    const chartData = [...approvedForPayroll]
      .sort((a, b) => b.totalBruto - a.totalBruto)
      .slice(0, 5)
      .map(item => ({
        name:  item.studentName.split(' ')[0] ?? 'N/A',
        monto: item.totalBruto,
        neto:  item.totalNeto,
      }));

    // 11. Weekly summary
    const weeklySummaryMap = periodLogs.reduce(
      (acc, log) => {
        const date  = new Date(log.date + 'T00:00:00');
        const week  = `W${Math.ceil(date.getDate() / 7)}`;
        const month = date.toLocaleString('es-ES', { month: 'short' });
        const key   = `${month} - ${week}`;
        if (!acc[key]) acc[key] = { key, hours: 0, amount: 0 };
        acc[key].hours  += log.hours;
        acc[key].amount += log.hours * currentRate;
        return acc;
      },
      {} as Record<string, { key: string; hours: number; amount: number }>,
    );

    // 12. Dept hours (for backward-compat chart)
    const deptData = depts.map(d => ({
      name:  d.name,
      value: periodLogs.filter(l => l.departmentId === d.id).reduce((s, l) => s + l.hours, 0),
    })).filter(d => d.value > 0);

    return {
      filteredLogs:       periodLogs,
      approvedForPayroll,
      processedForPayroll,
      approvedBooks,
      processedBooks,
      totalApprovedAmount,
      totalProcessedAmount,
      chartData,
      deptData,
      deptChartData,
      weeklySummary:    Object.values(weeklySummaryMap),
      trimesterSummary,
    };
  }, [
    allLogs,
    allUsers,
    allDepartments,
    viewMode,
    selectedCycle,
    selectedTrimester,
    selectedYear,
    searchTerm,
    selectedDeptId,
    currentRate,
  ]);
}
