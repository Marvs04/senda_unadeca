import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCurrencyPdf,
  formatIsoDate,
  truncate,
  buildAuthEmail,
  getCostaRicaISODate,
} from '../utils';

describe('formatCurrency', () => {
  it('formatea un número entero con símbolo de colón', () => {
    expect(formatCurrency(1000)).toBe('₡1,000');
  });

  it('redondea decimales', () => {
    expect(formatCurrency(1500.75)).toBe('₡1,501');
  });

  it('maneja cero', () => {
    expect(formatCurrency(0)).toBe('₡0');
  });

  it('formatea números grandes con comas', () => {
    expect(formatCurrency(1000000)).toBe('₡1,000,000');
  });
});

describe('formatCurrencyPdf', () => {
  it('usa la letra C en lugar del símbolo de colón', () => {
    expect(formatCurrencyPdf(1000)).toBe('C1,000');
  });

  it('redondea decimales igual que formatCurrency', () => {
    expect(formatCurrencyPdf(1500.75)).toBe('C1,501');
  });

  it('no contiene el símbolo ₡', () => {
    expect(formatCurrencyPdf(500)).not.toContain('₡');
  });
});

describe('formatIsoDate', () => {
  it('convierte YYYY-MM-DD a DD/MM/YYYY', () => {
    expect(formatIsoDate('2026-03-15')).toBe('15/03/2026');
  });

  it('rellena con cero días y meses de un solo dígito', () => {
    expect(formatIsoDate('2026-01-05')).toBe('05/01/2026');
  });

  it('retorna el valor original si le faltan partes (sin suficientes guiones)', () => {
    expect(formatIsoDate('sinformato')).toBe('sinformato');
  });
});

describe('truncate', () => {
  it('no trunca si el texto es más corto que el límite', () => {
    expect(truncate('hola', 10)).toBe('hola');
  });

  it('no trunca si el texto tiene exactamente el límite', () => {
    expect(truncate('hola', 4)).toBe('hola');
  });

  it('trunca y agrega "..." si el texto excede el límite', () => {
    expect(truncate('hola mundo', 4)).toBe('hola...');
  });

  it('retorna string vacío para null', () => {
    expect(truncate(null, 10)).toBe('');
  });

  it('retorna string vacío para undefined', () => {
    expect(truncate(undefined, 10)).toBe('');
  });
});

describe('buildAuthEmail', () => {
  it('convierte el identificador a minúsculas y agrega el dominio', () => {
    expect(buildAuthEmail('JuanPerez')).toBe('juanperez@senda.internal');
  });

  it('elimina espacios al inicio y al final', () => {
    expect(buildAuthEmail('  alumno  ')).toBe('alumno@senda.internal');
  });

  it('reemplaza espacios internos con guiones', () => {
    expect(buildAuthEmail('Juan Perez')).toBe('juan-perez@senda.internal');
  });
});

describe('getCostaRicaISODate', () => {
  it('retorna un string con formato YYYY-MM-DD', () => {
    const result = getCostaRicaISODate(new Date('2026-03-15T12:00:00Z'));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('retorna string vacío para fecha inválida', () => {
    expect(getCostaRicaISODate('fecha-invalida')).toBe('');
  });

  it('acepta un string de fecha ISO', () => {
    const result = getCostaRicaISODate('2026-06-01T00:00:00Z');
    expect(result).toMatch(/^2026-/);
  });
});
