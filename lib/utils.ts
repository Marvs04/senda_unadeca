import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function exportToCSV(filename: string, headers: string[], rows: any[][]) {
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

export function exportToPDF(filename: string, title: string, headers: string[], rows: any[][]) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generado el: ${new Date().toLocaleString('es-CR')}`, 14, 30);
  
  // @ts-ignore
  doc.autoTable({
    startY: 40,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
    margin: { top: 40 },
  });

  doc.save(filename);
}

export function getBillingCycle(dateInput: Date | string = new Date()) {
  const date = typeof dateInput === 'string' ? new Date(dateInput + (dateInput.length <= 7 ? '-01' : '') + 'T00:00:00') : dateInput;
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  let cycleMonth = month;
  let cycleYear = year;

  if (day >= 26) {
    cycleMonth = (month + 1) % 12;
    if (cycleMonth === 0) cycleYear++;
  }

  // Special case: If cycle is December (month 11), but cut-off is Nov 25
  // We'll keep the cycle logic but the filters will handle the cut-off
  
  const cycleDate = new Date(cycleYear, cycleMonth, 1);
  return {
    label: cycleDate.toLocaleString('es-CR', { month: 'long', year: 'numeric' }),
    value: `${cycleYear}-${String(cycleMonth + 1).padStart(2, '0')}`,
    month: cycleMonth,
    year: cycleYear
  };
}

export function getTrimester(dateInput: Date | string = new Date()) {
  const date = typeof dateInput === 'string' ? new Date(dateInput + (dateInput.length <= 7 ? '-01' : '') + 'T00:00:00') : dateInput;
  const month = date.getMonth();
  const day = date.getDate();
  
  // C1: Jan-Apr
  // C2: May-Aug
  // C3: Sept-Nov 25
  let trimesterNum = Math.floor(month / 4) + 1;
  
  // If it's after Nov 25, it's technically start of next year's cycle or "Plan Verano"
  if (month === 10 && day > 25) trimesterNum = 1; // Simplified: after Nov 25 is next cycle
  if (month === 11) trimesterNum = 1;

  const labels = ['Primer Cuatrimestre', 'Segundo Cuatrimestre', 'Tercer Cuatrimestre'];
  
  return {
    num: trimesterNum > 3 ? 1 : trimesterNum,
    label: labels[(trimesterNum > 3 ? 1 : trimesterNum) - 1],
    year: (month === 10 && day > 25) || month === 11 ? date.getFullYear() + 1 : date.getFullYear()
  };
}

export function isDateInCycle(dateStr: string, cycleValue: string) {
  const date = new Date(dateStr + 'T00:00:00');
  
  if (cycleValue.includes('-Q')) {
    const [year, qPart] = cycleValue.split('-Q');
    const trimesterNum = parseInt(qPart);
    return isDateInTrimester(dateStr, trimesterNum, parseInt(year));
  }

  const [targetYear, targetMonth] = cycleValue.split('-').map(Number);
  
  // If cycle is December (12), and cut-off is Nov 25, then December cycle might not exist or be empty
  if (targetMonth === 12) {
    // If user says last cut-off is Nov 25, then Dec cycle (Nov 26 - Dec 25) is invalid
    // But we'll allow it for now unless explicitly told to block it.
  }

  const cycleEnd = new Date(targetYear, targetMonth - 1, 25);
  const cycleStart = new Date(targetYear, targetMonth - 2, 26);
  
  return date >= cycleStart && date <= cycleEnd;
}

export function isDateInTrimester(dateStr: string, trimesterNum: number, year: number) {
  const date = new Date(dateStr + 'T00:00:00');
  
  const month = date.getMonth();
  const day = date.getDate();
  
  let currentTrimester = Math.floor(month / 4) + 1;
  let currentYear = date.getFullYear();

  // Adjust for Nov 25 cut-off
  if (month === 10 && day > 25) {
    currentTrimester = 1;
    currentYear++;
  }
  if (month === 11) {
    currentTrimester = 1;
    currentYear++;
  }

  return currentTrimester === trimesterNum && currentYear === year;
}

export function getWeekNumber(dateInput: Date | string) {
  const date = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : dateInput;
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function truncate(text: string | undefined | null, limit: number) {
  if (!text) return '';
  if (text.length <= limit) return text;
  return text.substring(0, limit) + '...';
}
