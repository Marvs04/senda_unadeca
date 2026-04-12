import type { AccountingConfig } from '../services/accountingService';
import type { DeptBook } from '../services/reportsService';

const FIELD_LENGTHS = {
  account: 17,
  name: 34,
  costCenter: 8,
  detail: 70,
  debit: 14,
  credit: 14,
} as const;

export const ACCOUNTING_ENTRY_LINE_LENGTH =
  FIELD_LENGTHS.account +
  FIELD_LENGTHS.name +
  FIELD_LENGTHS.costCenter +
  FIELD_LENGTHS.detail +
  FIELD_LENGTHS.debit +
  FIELD_LENGTHS.credit;

interface AccountingEntryLine {
  accountCode: string;
  accountName: string;
  costCenter: string;
  detail: string;
  debit: number;
  credit: number;
}

function padRight(value: string, size: number): string {
  return String(value ?? '').slice(0, size).padEnd(size, ' ');
}

function normalizeCostCenter(value: string | undefined): string {
  const raw = String(value ?? '').trim();
  if (!raw) return ''.padEnd(FIELD_LENGTHS.costCenter, ' ');

  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length === 6) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
  }

  return raw.slice(0, FIELD_LENGTHS.costCenter).padEnd(FIELD_LENGTHS.costCenter, ' ');
}

function toAmountField(amount: number): string {
  const cents = Math.round(Math.abs(amount) * 100);
  return String(cents).padStart(FIELD_LENGTHS.debit, '0').slice(-FIELD_LENGTHS.debit);
}

function composeLine(line: AccountingEntryLine): string {
  return [
    padRight(line.accountCode, FIELD_LENGTHS.account),
    padRight(line.accountName, FIELD_LENGTHS.name),
    normalizeCostCenter(line.costCenter),
    padRight(line.detail, FIELD_LENGTHS.detail),
    toAmountField(line.debit),
    toAmountField(line.credit),
  ].join('');
}

function buildDetail(periodLabel: string, departmentName: string): string {
  return `Plan de becas ${periodLabel} - ${departmentName}`;
}

function buildDepartmentLines(
  book: DeptBook,
  config: AccountingConfig,
  periodLabel: string,
): AccountingEntryLine[] {
  const detail = buildDetail(periodLabel, book.departmentName);
  const costCenter = book.costCenter ?? '';
  const lines: AccountingEntryLine[] = [];

  if (book.totalBruto > 0) {
    lines.push({
      accountCode: config.becasAccount,
      accountName: config.becasName,
      costCenter,
      detail,
      debit: book.totalBruto,
      credit: 0,
    });
  }

  if (book.totalTithe > 0) {
    lines.push({
      accountCode: config.diezmoAccount,
      accountName: config.diezmoName,
      costCenter,
      detail,
      debit: 0,
      credit: book.totalTithe,
    });
  }

  if (book.totalReceivable > 0) {
    lines.push({
      accountCode: config.receivableAccount,
      accountName: config.receivableName,
      costCenter,
      detail,
      debit: 0,
      credit: book.totalReceivable,
    });
  }

  if (book.totalPayable > 0) {
    lines.push({
      accountCode: config.payableAccount,
      accountName: config.payableName,
      costCenter,
      detail,
      debit: 0,
      credit: book.totalPayable,
    });
  }

  return lines;
}

export function buildAccountingEntryTxt(
  books: DeptBook[],
  config: AccountingConfig,
  periodLabel: string,
): string {
  const lines = books.flatMap(book => buildDepartmentLines(book, config, periodLabel));
  const entries = lines.map(composeLine);

  // Totals line for auditing (debit sum == credit sum if the entry is balanced)
  const totalDebit  = lines.reduce((s, l) => s + l.debit,  0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const balanceLine = [
    padRight('TOTALES', FIELD_LENGTHS.account),
    padRight('', FIELD_LENGTHS.name),
    padRight('', FIELD_LENGTHS.costCenter),
    padRight(`Debito: ${toAmountField(totalDebit)}  Credito: ${toAmountField(totalCredit)}`, FIELD_LENGTHS.detail),
    toAmountField(totalDebit),
    toAmountField(totalCredit),
  ].join('');

  return [...entries, balanceLine].join('\r\n');
}

export function findInvalidLineLengths(content: string): number[] {
  return content
    .split(/\r?\n/)
    .filter(line => line.length > 0)
    .map(line => line.length)
    .filter(length => length !== ACCOUNTING_ENTRY_LINE_LENGTH);
}

export function downloadPlainTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
