/**
 * hooks/useAccountingData.ts
 *
 * Derives all computed payroll data for the Accounting portal.
 * Extracted from AccountingPortal's useMemo so the component only handles UI.
 *
 * Returns:
 *   filteredLogs          — logs for the selected period / department
 *   approvedForPayroll    — aggregated per-student approved entries
 *   processedForPayroll   — aggregated per-student processed entries
 *   totalApprovedAmount   — sum of pending payment amounts (CRC)
 *   totalProcessedAmount  — sum of already processed amounts (CRC)
 *   chartData             — top-5 students by amount (for bar chart)
 *   deptData              — hours per department (for pie chart)
 *   weeklySummary         — hours & amount grouped by week label
 */

import { useMemo } from 'react';
import { WorkLog, WorkLogStatus, User, Department } from '../types';
import { isDateInCycle, isDateInTrimester } from '../lib/business';

export interface PayrollEntry {
  studentId: string;
  departmentId: string;
  totalHours: number;
  totalAmount: number;
  logIds: string[];
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
    // 1. Filter by selected period
    let logs = (allLogs ?? []).filter(log =>
      viewMode === 'cycle'
        ? isDateInCycle(log.date, selectedCycle)
        : isDateInTrimester(log.date, selectedTrimester, selectedYear),
    );

    // 2. Filter by department
    if (selectedDeptId !== 'all') {
      logs = logs.filter(l => l.departmentId === selectedDeptId);
    }

    // 3. Helper: student name matches search
    const matchesSearch = (log: WorkLog) => {
      const student = (allUsers ?? []).find(u => u.id === log.studentId);
      return student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    };

    // 4. Split into APPROVED vs PROCESSED
    const approvedLogs   = logs.filter(l => l.status === WorkLogStatus.APPROVED   && matchesSearch(l));
    const processedLogs  = logs.filter(l => l.status === WorkLogStatus.PROCESSED  && matchesSearch(l));

    // 5. Aggregate per student
    const aggregate = (logList: WorkLog[]): PayrollEntry[] =>
      Object.values(
        logList.reduce(
          (acc, log) => {
            if (!acc[log.studentId]) {
              acc[log.studentId] = {
                studentId: log.studentId,
                departmentId: log.departmentId,
                totalHours: 0,
                totalAmount: 0,
                logIds: [],
              };
            }
            acc[log.studentId].totalHours  += log.hours;
            acc[log.studentId].totalAmount += log.hours * currentRate;
            acc[log.studentId].logIds.push(log.id);
            return acc;
          },
          {} as Record<string, PayrollEntry>,
        ),
      );

    const approvedForPayroll  = aggregate(approvedLogs);
    const processedForPayroll = aggregate(processedLogs);

    // 6. Grand totals
    const totalApprovedAmount = approvedForPayroll.reduce((s, i) => s + i.totalAmount, 0);
    const totalProcessedAmount = logs
      .filter(l => l.status === WorkLogStatus.PROCESSED)
      .reduce((s, l) => s + l.hours * currentRate, 0);

    // 7. Weekly summary (for line/bar chart)
    const weeklySummaryMap = logs.reduce(
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

    // 8. Top-5 students chart data
    const chartData = [...approvedForPayroll]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)
      .map(item => ({
        name:  (allUsers ?? []).find(u => u.id === item.studentId)?.name?.split(' ')[0] ?? 'N/A',
        monto: item.totalAmount,
      }));

    // 9. Hours per department (pie chart)
    const deptMap = logs.reduce(
      (acc, log) => {
        const deptName = (allDepartments ?? []).find(d => d.id === log.departmentId)?.name ?? 'N/A';
        acc[deptName] = (acc[deptName] ?? 0) + log.hours;
        return acc;
      },
      {} as Record<string, number>,
    );
    const deptData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

    return {
      filteredLogs: logs,
      approvedForPayroll,
      processedForPayroll,
      totalApprovedAmount,
      totalProcessedAmount,
      chartData,
      deptData,
      weeklySummary: Object.values(weeklySummaryMap),
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
