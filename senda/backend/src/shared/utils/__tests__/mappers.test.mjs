import { describe, it, expect } from 'vitest';
import { toUser, toDepartment, toWorkLog, toRate } from '../mappers.mjs';

describe('toUser', () => {
  const baseRow = {
    id: 'u1',
    name: 'María López',
    role: 'STUDENT',
    carnet: '20210001',
    employee_number: null,
    institutional_email: null,
    department_id: 'dept-1',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  };

  it('mapea los campos básicos correctamente', () => {
    const user = toUser(baseRow);
    expect(user.id).toBe('u1');
    expect(user.name).toBe('María López');
    expect(user.role).toBe('STUDENT');
  });

  it('mapea carnet cuando existe', () => {
    expect(toUser(baseRow).carnet).toBe('20210001');
  });

  it('omite carnet cuando es null', () => {
    expect(toUser({ ...baseRow, carnet: null }).carnet).toBe(undefined);
  });

  it('isActive es true cuando is_active es true', () => {
    expect(toUser(baseRow).isActive).toBe(true);
  });

  it('isActive es false cuando is_active es false', () => {
    expect(toUser({ ...baseRow, is_active: false }).isActive).toBe(false);
  });

  it('isActive es true cuando is_active es null (default activo)', () => {
    expect(toUser({ ...baseRow, is_active: null }).isActive).toBe(true);
  });

  it('mapea departmentId desde department_id', () => {
    expect(toUser(baseRow).departmentId).toBe('dept-1');
  });

  it('omite departmentId cuando department_id es null', () => {
    expect(toUser({ ...baseRow, department_id: null }).departmentId).toBe(undefined);
  });
});

describe('toDepartment', () => {
  it('mapea los campos correctamente', () => {
    const row = { id: 'd1', name: 'Informatica', head_id: 'u1', cost_center: '01-02-03' };
    const dept = toDepartment(row);
    expect(dept.id).toBe('d1');
    expect(dept.name).toBe('Informatica');
    expect(dept.headId).toBe('u1');
    expect(dept.costCenter).toBe('01-02-03');
  });

  it('headId es undefined cuando head_id es null', () => {
    const dept = toDepartment({ id: 'd1', name: 'Sin jefe', head_id: null, cost_center: '01-01-01' });
    expect(dept.headId).toBe(undefined);
  });

  it('costCenter es string vacío cuando cost_center es null', () => {
    const dept = toDepartment({ id: 'd1', name: 'Test', head_id: null, cost_center: null });
    expect(dept.costCenter).toBe('');
  });
});

describe('toWorkLog', () => {
  const baseRow = {
    id: 'wl1',
    student_id: 'u1',
    department_id: 'd1',
    date: '2026-03-15',
    hours: '2.5',
    description: 'Apoyo en laboratorio',
    status: 'PENDING',
    entry_source: 'MANUAL',
    start_time: null,
    end_time: null,
    approved_by: null,
    approved_at: null,
    rejected_by: null,
    rejected_at: null,
    rejection_reason: null,
  };

  it('mapea los campos básicos', () => {
    const log = toWorkLog(baseRow);
    expect(log.id).toBe('wl1');
    expect(log.studentId).toBe('u1');
    expect(log.departmentId).toBe('d1');
    expect(log.status).toBe('PENDING');
  });

  it('convierte hours a número', () => {
    expect(toWorkLog(baseRow).hours).toBe(2.5);
    expect(typeof toWorkLog(baseRow).hours).toBe('number');
  });

  it('omite startTime cuando start_time es null', () => {
    expect(toWorkLog(baseRow).startTime).toBe(undefined);
  });

  it('mapea startTime cuando start_time tiene valor', () => {
    const ts = '2026-03-15T09:00:00.000Z';
    expect(toWorkLog({ ...baseRow, start_time: ts }).startTime).toBe(ts);
  });

  it('omite rejectionReason cuando es null', () => {
    expect(toWorkLog(baseRow).rejectionReason).toBe(undefined);
  });

  it('mapea rejectionReason cuando tiene valor', () => {
    const log = toWorkLog({ ...baseRow, rejection_reason: 'Horas incorrectas' });
    expect(log.rejectionReason).toBe('Horas incorrectas');
  });
});

describe('toRate', () => {
  it('mapea rate y effectiveDate correctamente', () => {
    const row = { rate: 1500, effective_date: '2026-01-01' };
    const rate = toRate(row);
    expect(rate.rate).toBe(1500);
    expect(rate.effectiveDate).toBe('2026-01-01');
  });
});
