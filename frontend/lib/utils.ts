import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const COSTA_RICA_TIME_ZONE = 'America/Costa_Rica';

function toValidDate(value: Date | string | number): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getCostaRicaDateParts(value: Date | string | number): { year: string; month: string; day: string } | null {
  const date = toValidDate(value);
  if (!date) return null;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: COSTA_RICA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;

  if (!year || !month || !day) return null;
  return { year, month, day };
}

export function getCostaRicaISODate(value: Date | string | number = new Date()): string {
  const parts = getCostaRicaDateParts(value);
  if (!parts) return '';
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatCostaRicaLongDate(value: Date | string | number = new Date()): string {
  const date = toValidDate(value);
  if (!date) return 'Fecha invalida';
  return new Intl.DateTimeFormat('es-CR', {
    timeZone: COSTA_RICA_TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatCostaRicaTime(value?: Date | string | number): string {
  if (value === undefined || value === null || value === '') return 'No registrado';
  const date = toValidDate(value);
  if (!date) return 'No registrado';
  return new Intl.DateTimeFormat('es-CR', {
    timeZone: COSTA_RICA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/** Formats an ISO timestamp as "DD/MM/YYYY HH:MM" in Costa Rica timezone. Useful for audit reports. */
export function formatCostaRicaDateTime(value?: Date | string | number): string {
  if (value === undefined || value === null || value === '') return 'No registrado';
  const date = toValidDate(value);
  if (!date) return 'No registrado';
  const datePart = new Intl.DateTimeFormat('es-CR', {
    timeZone: COSTA_RICA_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('es-CR', {
    timeZone: COSTA_RICA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${datePart} ${timePart}`;
}


export function getCostaRicaMinutesNow(reference: Date | string | number = new Date()): number {
  const date = toValidDate(reference);
  if (!date) return 0;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: COSTA_RICA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find(part => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find(part => part.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
}

export function formatIsoDate(dateString: string): string {
  const [year, month, day] = String(dateString).split('-');
  if (!year || !month || !day) return dateString;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `₡${formatted}`;
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function truncate(text: string | undefined | null, limit: number) {
  if (!text) return '';
  if (text.length <= limit) return text;
  return text.substring(0, limit) + '...';
}

export function buildAuthEmail(identifier: string): string {
  return `${identifier.toLowerCase().trim().replace(/\s+/g, '-')}@senda.internal`;
}
