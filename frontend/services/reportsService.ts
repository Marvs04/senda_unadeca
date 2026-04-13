/**
 * services/reportsService.ts
 *
 * API calls for payroll report computation (now done server-side).
 */

import { apiClient } from '../api';

// ─── Shared types (also consumed by useAccountingReport) ──────────────────────

export interface PayrollEntry {
  studentId:    string;
  studentName:  string;
  carnet?:      string;
  departmentId: string;
  totalHours:   number;
  totalBruto:   number;
  totalTithe:   number;
  totalNeto:    number;
  manualReceivable: number;
  totalPayable: number;
  logIds:       string[];
}

export interface DeptBook {
  departmentId:   string;
  departmentName: string;
  costCenter?:    string;
  students:       PayrollEntry[];
  totalHours:     number;
  totalBruto:     number;
  totalTithe:     number;
  totalNeto:      number;
  totalReceivable: number;
  totalPayable:   number;
}

export interface TrimesterSummaryItem {
  trimester: number;
  hours:     number;
  bruto:     number;
  tithe:     number;
  neto:      number;
}

export interface AccountingReportData {
  approvedForPayroll:   PayrollEntry[];
  processedForPayroll:  PayrollEntry[];
  approvedBooks:        DeptBook[];
  processedBooks:       DeptBook[];
  totalApprovedAmount:  number;
  totalProcessedAmount: number;
  chartData:            { name: string; monto: number; neto: number }[];
  deptData:             { name: string; value: number }[];
  deptChartData:        { name: string; bruto: number; neto: number; hours: number }[];
  weeklySummary:        { key: string; hours: number; amount: number }[];
  trimesterSummary:     TrimesterSummaryItem[];
}

export interface PayrollReportParams {
  viewMode:         'cycle' | 'trimester';
  selectedCycle:    string;
  selectedTrimester: number;
  selectedYear:     number;
  searchTerm:       string;
  selectedDeptId:   string;
  currentRate:      number;
  closingDay:       number;
}

// ─── API call ─────────────────────────────────────────────────────────────────

export async function getPayrollReport(params: PayrollReportParams): Promise<AccountingReportData> {
  const {
    viewMode, selectedCycle, selectedTrimester,
    selectedYear, searchTerm, selectedDeptId, currentRate, closingDay,
  } = params;

  const q = new URLSearchParams();
  q.set('mode', viewMode);
  if (viewMode === 'cycle') {
    q.set('cycle', selectedCycle);
  } else {
    q.set('trimester', String(selectedTrimester));
  }
  q.set('year',       String(selectedYear));
  q.set('deptId',     selectedDeptId);
  q.set('rate',       String(currentRate));
  q.set('closingDay', String(closingDay ?? 25));
  if (searchTerm) q.set('search', searchTerm);

  const { data } = await apiClient.get<AccountingReportData>(`/reports/payroll?${q.toString()}`);
  return data;
}
