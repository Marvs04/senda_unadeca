/**
 * hooks/useDeptHeadData.ts
 *
 * Derives department statistics and student lists for the DeptHead portal.
 * Extracted from DeptHeadPortal's useMemo blocks.
 *
 * Returns:
 *   myLogs       — all logs belonging to the head's department
 *   pendingLogs  — subset of myLogs with PENDING status
 *   myStudents   — students assigned to the department
 *   totalHours   — sum of hours in the selected billing cycle
 *   pendingHours — pending hours in the cycle
 *   approvedHours— approved hours in the cycle
 *   totalBilling — approvedHours × currentRate (CRC)
 */

import { useMemo } from 'react';
import { WorkLog, WorkLogStatus, User, UserRole } from '../types';
import { isDateInCycle } from '../lib/business';

interface UseDeptHeadDataParams {
  departmentId: string | undefined;
  allLogs: WorkLog[];
  allUsers: User[];
  selectedCycle: string;
  currentRate: number;
}

export function useDeptHeadData({
  departmentId,
  allLogs,
  allUsers,
  selectedCycle,
  currentRate,
}: UseDeptHeadDataParams) {
  // All logs for this department
  const myLogs = useMemo(
    () => (allLogs ?? []).filter(log => log.departmentId === departmentId),
    [allLogs, departmentId],
  );

  // Logs waiting for head's review
  const pendingLogs = useMemo(
    () => myLogs.filter(log => log.status === WorkLogStatus.PENDING),
    [myLogs],
  );

  // Cycle-level stats
  const stats = useMemo(() => {
    const myStudents = (allUsers ?? []).filter(
      u => u.role === UserRole.STUDENT && u.departmentId === departmentId,
    );

    const cycleLogs    = myLogs.filter(log => isDateInCycle(log.date, selectedCycle));
    const totalHours   = cycleLogs.reduce((acc, log) => acc + log.hours, 0);
    const pendingHours = cycleLogs
      .filter(log => log.status === WorkLogStatus.PENDING)
      .reduce((acc, log) => acc + log.hours, 0);
    const approvedHours = cycleLogs
      .filter(log => log.status === WorkLogStatus.APPROVED)
      .reduce((acc, log) => acc + log.hours, 0);
    const totalBilling = approvedHours * currentRate;

    return { myStudents, totalHours, pendingHours, approvedHours, totalBilling };
  }, [allUsers, departmentId, myLogs, selectedCycle, currentRate]);

  return { myLogs, pendingLogs, ...stats };
}
