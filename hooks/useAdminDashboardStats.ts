/**
 * hooks/useAdminDashboardStats.ts
 *
 * Derives all computed statistics displayed on the Admin dashboard.
 * Extracted from AdminDashboardTab's useMemo block.
 *
 * Returns:
 *   totalHours         — total hours logged in the selected billing cycle
 *   totalGlobalPayment — totalHours × currentRate (CRC)
 *   activeStudents     — total number of student accounts
 *   deptChartData      — hours per department (for pie chart)
 *   studentChartData   — top-5 students by hours (for bar chart)
 */

import { useMemo } from 'react';
import { WorkLog, User, Department, UserRole } from '../types';
import { isDateInCycle } from '../lib/business';

interface UseAdminDashboardStatsParams {
  allLogs: WorkLog[];
  allUsers: User[];
  allDepartments: Department[];
  selectedCycle: string;
  currentRate: number;
}

export function useAdminDashboardStats({
  allLogs,
  allUsers,
  allDepartments,
  selectedCycle,
  currentRate,
}: UseAdminDashboardStatsParams) {
  return useMemo(() => {
    const cycleLogs = (allLogs ?? []).filter(log => isDateInCycle(log.date, selectedCycle));

    const totalHours        = cycleLogs.reduce((acc, log) => acc + log.hours, 0);
    const totalGlobalPayment = totalHours * currentRate;
    const activeStudents    = (allUsers ?? []).filter(u => u.role === UserRole.STUDENT).length;

    // Hours per department → pie chart
    const deptMap = cycleLogs.reduce(
      (acc, log) => {
        const name = (allDepartments ?? []).find(d => d.id === log.departmentId)?.name ?? 'N/A';
        acc[name] = (acc[name] ?? 0) + log.hours;
        return acc;
      },
      {} as Record<string, number>,
    );
    const deptChartData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

    // Top-5 students by hours → bar chart
    const studentMap = cycleLogs.reduce(
      (acc, log) => {
        const name = (allUsers ?? []).find(u => u.id === log.studentId)?.name?.split(' ')[0] ?? 'N/A';
        acc[name] = (acc[name] ?? 0) + log.hours;
        return acc;
      },
      {} as Record<string, number>,
    );
    const studentChartData = (Object.entries(studentMap) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, hours]) => ({ name, hours }));

    return { totalHours, totalGlobalPayment, activeStudents, deptChartData, studentChartData };
  }, [allLogs, allUsers, allDepartments, selectedCycle, currentRate]);
}
