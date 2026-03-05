/**
 * features/reports/reports.schemas.mjs
 *
 * Business-logic helpers ported from frontend/lib/business.ts.
 * Used by the service to filter work logs by billing cycle or trimester.
 */

export const TITHE_PERCENTAGE = 0.10;

/**
 * Returns true when `dateStr` (YYYY-MM-DD) belongs to the given trimester
 * of `year`. Trimesters follow the UNADECA academic calendar:
 *   T1 → Jan–Apr  (or late-Nov / Dec of previous year rolls into T1 of next)
 *   T2 → May–Aug
 *   T3 → Sep–Oct (first 25 days of Nov)
 */
export function isDateInTrimester(dateStr, trimesterNum, year) {
  const date  = new Date(dateStr + 'T00:00:00');
  const month = date.getMonth(); // 0-based
  const day   = date.getDate();

  let currentTrimester = Math.floor(month / 4) + 1;
  let currentYear      = date.getFullYear();

  if (month === 10 && day > 25) { currentTrimester = 1; currentYear++; }
  if (month === 11)              { currentTrimester = 1; currentYear++; }

  return currentTrimester === trimesterNum && currentYear === year;
}

/**
 * Returns true when `dateStr` belongs to the billing cycle `cycleValue`.
 * cycleValue format: 'YYYY-MM'  (cycle closes on the 25th of that month).
 * Also handles legacy '-Q' format by delegating to isDateInTrimester.
 */
export function isDateInCycle(dateStr, cycleValue) {
  const date = new Date(dateStr + 'T00:00:00');

  if (cycleValue.includes('-Q')) {
    const [yearStr, qPart] = cycleValue.split('-Q');
    return isDateInTrimester(dateStr, parseInt(qPart, 10), parseInt(yearStr, 10));
  }

  const [targetYear, targetMonth] = cycleValue.split('-').map(Number);
  const cycleEnd   = new Date(targetYear, targetMonth - 1, 25);      // 25th of cycle month
  const cycleStart = new Date(targetYear, targetMonth - 2, 26);      // 26th of prev month
  return date >= cycleStart && date <= cycleEnd;
}
