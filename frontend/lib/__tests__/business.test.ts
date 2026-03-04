import { describe, it, expect } from 'vitest';
import {
  getBillingCycle,
  getTrimester,
  isDateInCycle,
  isDateInTrimester,
  getWeekNumber,
} from '../business';

// ---------------------------------------------------------------------------
// getBillingCycle
// ---------------------------------------------------------------------------
describe('getBillingCycle', () => {
  it('día 25 permanece en el ciclo del mes actual', () => {
    // 25 ene 2024 → ciclo enero 2024
    const result = getBillingCycle(new Date(2024, 0, 25));
    expect(result.value).toBe('2024-01');
  });

  it('día 26 avanza al ciclo del mes siguiente', () => {
    // 26 ene 2024 → ciclo febrero 2024
    const result = getBillingCycle(new Date(2024, 0, 26));
    expect(result.value).toBe('2024-02');
  });

  it('día 1 del mes permanece en el ciclo del mes actual', () => {
    const result = getBillingCycle(new Date(2024, 4, 1)); // 1 mayo
    expect(result.value).toBe('2024-05');
  });

  it('26 de diciembre avanza al ciclo de enero del año siguiente', () => {
    const result = getBillingCycle(new Date(2024, 11, 26)); // 26 dic 2024
    expect(result.value).toBe('2025-01');
  });

  it('acepta un string de fecha YYYY-MM-DD', () => {
    const result = getBillingCycle('2024-03-10');
    expect(result.value).toBe('2024-03');
  });

  it('acepta un string de fecha YYYY-MM (sin día)', () => {
    const result = getBillingCycle('2024-06');
    expect(result.value).toBe('2024-06');
  });

  it('el campo value tiene formato YYYY-MM', () => {
    const result = getBillingCycle(new Date(2024, 8, 5)); // sep
    expect(result.value).toMatch(/^\d{4}-\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// getTrimester
// ---------------------------------------------------------------------------
describe('getTrimester', () => {
  // Primer cuatrimestre: enero–abril
  it('enero → cuatrimestre 1', () => {
    const r = getTrimester(new Date(2024, 0, 15));
    expect(r.num).toBe(1);
    expect(r.year).toBe(2024);
  });

  it('abril → cuatrimestre 1', () => {
    const r = getTrimester(new Date(2024, 3, 30));
    expect(r.num).toBe(1);
    expect(r.year).toBe(2024);
  });

  // Segundo cuatrimestre: mayo–agosto
  it('mayo → cuatrimestre 2', () => {
    const r = getTrimester(new Date(2024, 4, 1));
    expect(r.num).toBe(2);
    expect(r.year).toBe(2024);
  });

  it('agosto → cuatrimestre 2', () => {
    const r = getTrimester(new Date(2024, 7, 31));
    expect(r.num).toBe(2);
    expect(r.year).toBe(2024);
  });

  // Tercer cuatrimestre: septiembre–noviembre 25
  it('septiembre → cuatrimestre 3', () => {
    const r = getTrimester(new Date(2024, 8, 1));
    expect(r.num).toBe(3);
    expect(r.year).toBe(2024);
  });

  it('noviembre 25 → cuatrimestre 3 (año actual)', () => {
    const r = getTrimester(new Date(2024, 10, 25)); // nov 25
    expect(r.num).toBe(3);
    expect(r.year).toBe(2024);
  });

  // Frontera: noviembre 26 → cuatrimestre 1 del año siguiente
  it('noviembre 26 → cuatrimestre 1 del año siguiente', () => {
    const r = getTrimester(new Date(2024, 10, 26)); // nov 26
    expect(r.num).toBe(1);
    expect(r.year).toBe(2025);
  });

  // Diciembre → siempre cuatrimestre 1 del año siguiente
  it('diciembre → cuatrimestre 1 del año siguiente', () => {
    const r = getTrimester(new Date(2024, 11, 15)); // dic
    expect(r.num).toBe(1);
    expect(r.year).toBe(2025);
  });

  it('acepta un string de fecha', () => {
    const r = getTrimester('2024-06-15');
    expect(r.num).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// isDateInCycle
// ---------------------------------------------------------------------------
describe('isDateInCycle', () => {
  // Ciclo mensual: del 26 del mes anterior al 25 del mes del ciclo
  it('fecha dentro del ciclo → true', () => {
    // Ciclo 2024-03: del 26-feb al 25-mar
    expect(isDateInCycle('2024-03-10', '2024-03')).toBe(true);
  });

  it('fecha en el límite inferior (día 26 del mes anterior) → true', () => {
    expect(isDateInCycle('2024-02-26', '2024-03')).toBe(true);
  });

  it('fecha en el límite superior (día 25) → true', () => {
    expect(isDateInCycle('2024-03-25', '2024-03')).toBe(true);
  });

  it('fecha fuera del ciclo (día 26 del mes del ciclo) → false', () => {
    expect(isDateInCycle('2024-03-26', '2024-03')).toBe(false);
  });

  it('fecha antes del límite inferior → false', () => {
    expect(isDateInCycle('2024-02-25', '2024-03')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isDateInTrimester
// ---------------------------------------------------------------------------
describe('isDateInTrimester', () => {
  it('fecha en el cuatrimestre 1 de 2024 → true', () => {
    expect(isDateInTrimester('2024-02-15', 1, 2024)).toBe(true);
  });

  it('fecha en el cuatrimestre 2 de 2024 → true', () => {
    expect(isDateInTrimester('2024-06-01', 2, 2024)).toBe(true);
  });

  it('fecha en el cuatrimestre 3 de 2024 → true', () => {
    expect(isDateInTrimester('2024-10-01', 3, 2024)).toBe(true);
  });

  it('fecha en cuatrimestre 1 de 2024 no es cuatrimestre 2 → false', () => {
    expect(isDateInTrimester('2024-02-15', 2, 2024)).toBe(false);
  });

  it('fecha con año erróneo → false', () => {
    expect(isDateInTrimester('2023-06-15', 2, 2024)).toBe(false);
  });

  it('diciembre retorna cuatrimestre 1 del año siguiente', () => {
    expect(isDateInTrimester('2024-12-15', 1, 2025)).toBe(true);
    expect(isDateInTrimester('2024-12-15', 1, 2024)).toBe(false);
  });

  it('noviembre 26 retorna cuatrimestre 1 del año siguiente', () => {
    expect(isDateInTrimester('2024-11-26', 1, 2025)).toBe(true);
    expect(isDateInTrimester('2024-11-26', 3, 2024)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getWeekNumber
// ---------------------------------------------------------------------------
describe('getWeekNumber', () => {
  it('retorna un número entero positivo', () => {
    const week = getWeekNumber(new Date(2024, 5, 15));
    expect(week).toBeGreaterThan(0);
    expect(Number.isInteger(week)).toBe(true);
  });

  it('semanas consecutivas difieren en 1', () => {
    const w1 = getWeekNumber(new Date(2024, 0, 8));  // 8 ene
    const w2 = getWeekNumber(new Date(2024, 0, 15)); // 15 ene
    expect(w2 - w1).toBe(1);
  });

  it('primer lunes ISO de 2024 es semana 1', () => {
    // 1 ene 2024 es lunes → semana 1 ISO
    const week = getWeekNumber(new Date(2024, 0, 1));
    expect(week).toBe(1);
  });

  it('acepta un string de fecha', () => {
    const week = getWeekNumber('2024-06-15');
    expect(week).toBeGreaterThan(0);
  });
});
