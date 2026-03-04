/**
 * hooks/useStudentFilter.ts
 *
 * Computes filtered log lists and financial stats for the Student portal.
 * Extracted from StudentPortal's two useMemo blocks.
 *
 * Returns:
 *   filteredLogs — logs matching the selected view/cycle/trimester
 *   stats        — totalHours, grossAmount, tithe, netAmount for the current cycle
 */

import { useMemo } from 'react';
import { WorkLog } from '../types';
import { TITHE_PERCENTAGE } from '../constants';
import { isDateInCycle, isDateInTrimester } from '../lib/business';

interface UseStudentFilterParams {
  myLogs: WorkLog[];
  currentRate: number;
  historyView: 'cycle' | 'trimester';
  selectedCycle: string;
  selectedTrimester: number;
  selectedYear: number;
}

export function useStudentFilter({
  myLogs,
  currentRate,
  historyView,
  selectedCycle,
  selectedTrimester,
  selectedYear,
}: UseStudentFilterParams) {
  // Financial summary for the current billing cycle
  const stats = useMemo(() => {
    const cycleLogs   = (myLogs ?? []).filter(l => isDateInCycle(l.date, selectedCycle));
    const totalHours  = cycleLogs.reduce((acc, l) => acc + l.hours, 0);
    const grossAmount = totalHours * currentRate;
    const tithe       = grossAmount * TITHE_PERCENTAGE;
    return { totalHours, grossAmount, tithe, netAmount: grossAmount - tithe };
  }, [myLogs, selectedCycle, currentRate]);

  // Logs for the history table (cycle or trimester view)
  const filteredLogs = useMemo(() => {
    if (historyView === 'cycle') {
      return (myLogs ?? []).filter(l => isDateInCycle(l.date, selectedCycle));
    }
    return (myLogs ?? []).filter(l =>
      isDateInTrimester(l.date, selectedTrimester, selectedYear),
    );
  }, [myLogs, historyView, selectedCycle, selectedTrimester, selectedYear]);

  return { stats, filteredLogs };
}
