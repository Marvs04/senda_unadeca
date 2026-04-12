import { apiClient } from '../api';

export interface AccountingConfig {
  id: number;
  becasAccount: string;
  becasName: string;
  diezmoAccount: string;
  diezmoName: string;
  payableAccount: string;
  payableName: string;
  receivableAccount: string;
  receivableName: string;
  updatedAt: string;
}

export async function getAccountingConfig(): Promise<AccountingConfig> {
  const { data } = await apiClient.get<AccountingConfig>('/accounting/config');
  return data;
}

export async function updateAccountingConfig(updates: Partial<AccountingConfig>): Promise<AccountingConfig> {
  const { data } = await apiClient.put<AccountingConfig>('/accounting/config', updates);
  return data;
}

export async function upsertStudentReceivable(
  studentId: string,
  periodKey: string,
  amount: number
): Promise<{ id: string; studentId: string; periodKey: string; amount: number }> {
  const { data } = await apiClient.put<{ id: string; studentId: string; periodKey: string; amount: number }>(
    '/accounting/receivables',
    { studentId, periodKey, amount }
  );
  return data;
}
