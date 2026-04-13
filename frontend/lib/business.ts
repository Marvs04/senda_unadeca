export function getBillingCycle(dateInput: Date | string = new Date(), closingDay = 25) {
  const date = typeof dateInput === 'string' ? new Date(dateInput + (dateInput.length <= 7 ? '-01' : '') + 'T00:00:00') : dateInput;
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  let cycleMonth = month;
  let cycleYear = year;

  if (day > closingDay) {
    cycleMonth = (month + 1) % 12;
    if (cycleMonth === 0) cycleYear++;
  }

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
  
  let trimesterNum = Math.floor(month / 4) + 1;
  if (month === 10 && day > 25) trimesterNum = 1;
  if (month === 11) trimesterNum = 1;

  const labels = ['Primer Cuatrimestre', 'Segundo Cuatrimestre', 'Tercer Cuatrimestre'];
  return {
    num: trimesterNum > 3 ? 1 : trimesterNum,
    label: labels[(trimesterNum > 3 ? 1 : trimesterNum) - 1],
    year: (month === 10 && day > 25) || month === 11 ? date.getFullYear() + 1 : date.getFullYear()
  };
}

export function isDateInCycle(dateStr: string, cycleValue: string, closingDay = 25) {
  const date = new Date(dateStr + 'T00:00:00');
  if (cycleValue.includes('-Q')) {
    const [year, qPart] = cycleValue.split('-Q');
    const trimesterNum = parseInt(qPart);
    return isDateInTrimester(dateStr, trimesterNum, parseInt(year));
  }

  const [targetYear, targetMonth] = cycleValue.split('-').map(Number);
  const cycleEnd   = new Date(targetYear, targetMonth - 1, closingDay);
  const cycleStart = new Date(targetYear, targetMonth - 2, closingDay + 1);
  return date >= cycleStart && date <= cycleEnd;
}

export function isDateInTrimester(dateStr: string, trimesterNum: number, year: number) {
  const date = new Date(dateStr + 'T00:00:00');
  const month = date.getMonth();
  const day = date.getDate();
  
  let currentTrimester = Math.floor(month / 4) + 1;
  let currentYear = date.getFullYear();

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
