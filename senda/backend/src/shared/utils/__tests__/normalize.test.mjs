import { describe, it, expect } from 'vitest';
import { normalizeOptionalText, normalizeIsoTimestamp, buildAuthEmail } from '../normalize.mjs';

describe('normalizeOptionalText', () => {
  it('retorna undefined cuando el valor es undefined', () => {
    expect(normalizeOptionalText(undefined)).toBe(undefined);
  });

  it('retorna undefined cuando el valor es null', () => {
    expect(normalizeOptionalText(null)).toBe(undefined);
  });

  it('retorna null cuando el string es vacío', () => {
    expect(normalizeOptionalText('')).toBe(null);
  });

  it('retorna null cuando el string es solo espacios', () => {
    expect(normalizeOptionalText('   ')).toBe(null);
  });

  it('retorna el texto sin espacios al inicio y al final', () => {
    expect(normalizeOptionalText('  hola  ')).toBe('hola');
  });

  it('retorna el texto tal cual si no tiene espacios extra', () => {
    expect(normalizeOptionalText('motivo de rechazo')).toBe('motivo de rechazo');
  });

  it('convierte números a string', () => {
    expect(normalizeOptionalText(42)).toBe('42');
  });
});

describe('normalizeIsoTimestamp', () => {
  it('retorna undefined cuando el valor es undefined', () => {
    expect(normalizeIsoTimestamp(undefined)).toBe(undefined);
  });

  it('retorna undefined cuando el valor es null', () => {
    expect(normalizeIsoTimestamp(null)).toBe(undefined);
  });

  it('retorna null cuando el string es vacío', () => {
    expect(normalizeIsoTimestamp('')).toBe(null);
  });

  it('retorna null cuando el string es solo espacios', () => {
    expect(normalizeIsoTimestamp('   ')).toBe(null);
  });

  it('retorna "INVALID" para una fecha no válida', () => {
    expect(normalizeIsoTimestamp('no-es-fecha')).toBe('INVALID');
  });

  it('retorna un string ISO válido para una fecha correcta', () => {
    const result = normalizeIsoTimestamp('2026-01-15T10:00:00.000Z');
    expect(result).toBe('2026-01-15T10:00:00.000Z');
  });

  it('normaliza una fecha sin hora a formato ISO completo', () => {
    const result = normalizeIsoTimestamp('2026-03-20');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('retorna "INVALID" para formato de fecha incompleto', () => {
    expect(normalizeIsoTimestamp('2026-13-45')).toBe('INVALID');
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

  it('colapsa múltiples espacios en un solo guión', () => {
    expect(buildAuthEmail('Juan  Carlos  Perez')).toBe('juan-carlos-perez@senda.internal');
  });
});
