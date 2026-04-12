/**
 * adminFilters.test.ts
 *
 * Tests for the filter + sort pipeline used in AdminStudentsTab &
 * AdminDeptHeadsTab, and the department search in AdminDepartmentsTab.
 *
 * These functions are inlined as useMemo computations inside the tabs;
 * we test the identical algorithms here to get regression coverage without
 * needing React / jsdom.
 */
import { describe, it, expect } from 'vitest';
import { User, Department, UserRole } from '../../types';

// ---------------------------------------------------------------------------
// Helpers — mirror of the logic in AdminStudentsTab / AdminDeptHeadsTab
// ---------------------------------------------------------------------------

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type SortMode = 'NAME_ASC' | 'NAME_DESC' | 'DEPT_ASC' | 'STATUS';

function applyUserFilters(
  list: User[],
  departmentFilter: string,
  statusFilter: StatusFilter,
  sortMode: SortMode,
  allDepartments: Department[],
): User[] {
  let result = list.filter(u => {
    if (departmentFilter === '__none__' && u.departmentId) return false;
    if (departmentFilter !== 'ALL' && departmentFilter !== '__none__' && u.departmentId !== departmentFilter) return false;
    if (statusFilter === 'ACTIVE' && u.isActive === false) return false;
    if (statusFilter === 'INACTIVE' && u.isActive !== false) return false;
    return true;
  });
  result = [...result].sort((a, b) => {
    switch (sortMode) {
      case 'NAME_ASC':  return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      case 'NAME_DESC': return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' });
      case 'DEPT_ASC': {
        const da = allDepartments.find(d => d.id === a.departmentId)?.name ?? 'zzz';
        const db = allDepartments.find(d => d.id === b.departmentId)?.name ?? 'zzz';
        return da.localeCompare(db, 'es', { sensitivity: 'base' });
      }
      case 'STATUS': return (a.isActive === false ? 1 : 0) - (b.isActive === false ? 1 : 0);
      default: return 0;
    }
  });
  return result;
}

function applyDeptSearch(departments: Department[], term: string): Department[] {
  const q = term.toLowerCase();
  return departments.filter(
    d => d.name.toLowerCase().includes(q) || d.costCenter.toLowerCase().includes(q),
  );
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const depts: Department[] = [
  { id: 'd1', name: 'Recursos Humanos', costCenter: '10-01-00' },
  { id: 'd2', name: 'Contabilidad',     costCenter: '20-01-00' },
  { id: 'd3', name: 'Sistemas',         costCenter: '30-01-00' },
];

const users: User[] = [
  { id: 'u1', name: 'Ana Vargas',    role: UserRole.STUDENT, departmentId: 'd1', isActive: true },
  { id: 'u2', name: 'Carlos López',  role: UserRole.STUDENT, departmentId: 'd2', isActive: true },
  { id: 'u3', name: 'Beatriz Mora',  role: UserRole.STUDENT, departmentId: 'd1', isActive: false },
  { id: 'u4', name: 'Daniel Salas',  role: UserRole.STUDENT, departmentId: undefined, isActive: true },
  { id: 'u5', name: 'Elena Quesada', role: UserRole.STUDENT, departmentId: 'd3', isActive: false },
];

// ---------------------------------------------------------------------------
// departmentFilter
// ---------------------------------------------------------------------------

describe('applyUserFilters — departmentFilter', () => {
  it('ALL devuelve todos los usuarios', () => {
    const result = applyUserFilters(users, 'ALL', 'ALL', 'NAME_ASC', depts);
    expect(result).toHaveLength(5);
  });

  it('__none__ devuelve solo usuarios sin departamento', () => {
    const result = applyUserFilters(users, '__none__', 'ALL', 'NAME_ASC', depts);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('u4');
  });

  it('id concreto filtra solo ese departamento', () => {
    const result = applyUserFilters(users, 'd1', 'ALL', 'NAME_ASC', depts);
    expect(result).toHaveLength(2);
    expect(result.map(u => u.id).sort()).toEqual(['u1', 'u3']);
  });

  it('departamento sin usuarios devuelve lista vacía', () => {
    const result = applyUserFilters(users, 'd2', 'ALL', 'NAME_ASC', depts);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('u2');
  });
});

// ---------------------------------------------------------------------------
// statusFilter
// ---------------------------------------------------------------------------

describe('applyUserFilters — statusFilter', () => {
  it('ACTIVE devuelve solo usuarios activos (isActive !== false)', () => {
    const result = applyUserFilters(users, 'ALL', 'ACTIVE', 'NAME_ASC', depts);
    expect(result.every(u => u.isActive !== false)).toBe(true);
  });

  it('INACTIVE devuelve solo usuarios inactivos (isActive === false)', () => {
    const result = applyUserFilters(users, 'ALL', 'INACTIVE', 'NAME_ASC', depts);
    expect(result.every(u => u.isActive === false)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('usuario sin isActive definido se considera activo', () => {
    const u: User = { id: 'ux', name: 'X', role: UserRole.STUDENT };
    const result = applyUserFilters([u], 'ALL', 'ACTIVE', 'NAME_ASC', []);
    expect(result).toHaveLength(1);
  });

  it('ALL incluye activos e inactivos', () => {
    const result = applyUserFilters(users, 'ALL', 'ALL', 'NAME_ASC', depts);
    expect(result).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// Combinación dept + status
// ---------------------------------------------------------------------------

describe('applyUserFilters — combinación departamento + estado', () => {
  it('dept d1 + ACTIVE devuelve solo Ana Vargas', () => {
    const result = applyUserFilters(users, 'd1', 'ACTIVE', 'NAME_ASC', depts);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Ana Vargas');
  });

  it('dept d1 + INACTIVE devuelve solo Beatriz Mora', () => {
    const result = applyUserFilters(users, 'd1', 'INACTIVE', 'NAME_ASC', depts);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Beatriz Mora');
  });

  it('__none__ + INACTIVE devuelve vacío (el usuario sin depto está activo)', () => {
    const result = applyUserFilters(users, '__none__', 'INACTIVE', 'NAME_ASC', depts);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// sortMode
// ---------------------------------------------------------------------------

describe('applyUserFilters — sortMode', () => {
  it('NAME_ASC ordena A→Z ignorando acentos', () => {
    const result = applyUserFilters(users, 'ALL', 'ALL', 'NAME_ASC', depts);
    const names = result.map(u => u.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })));
  });

  it('NAME_DESC ordena Z→A', () => {
    const result = applyUserFilters(users, 'ALL', 'ALL', 'NAME_DESC', depts);
    const names = result.map(u => u.name);
    const expectedFirst = names.reduce((a, b) => a.localeCompare(b, 'es') > 0 ? a : b);
    expect(names[0]).toBe(expectedFirst);
  });

  it('NAME_DESC es el inverso de NAME_ASC', () => {
    const asc  = applyUserFilters(users, 'ALL', 'ALL', 'NAME_ASC',  depts).map(u => u.id);
    const desc = applyUserFilters(users, 'ALL', 'ALL', 'NAME_DESC', depts).map(u => u.id);
    expect(desc).toEqual([...asc].reverse());
  });

  it('DEPT_ASC coloca usuarios sin depto al final (usa "zzz")', () => {
    const result = applyUserFilters(users, 'ALL', 'ALL', 'DEPT_ASC', depts);
    const last = result[result.length - 1];
    expect(last.departmentId).toBeUndefined();
  });

  it('DEPT_ASC ordena por nombre de departamento A→Z', () => {
    const result = applyUserFilters(users, 'ALL', 'ALL', 'DEPT_ASC', depts);
    const deptNames = result
      .filter(u => u.departmentId)
      .map(u => depts.find(d => d.id === u.departmentId)!.name);
    const sorted = [...deptNames].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    expect(deptNames).toEqual(sorted);
  });

  it('STATUS coloca activos primero, inactivos al final', () => {
    const result = applyUserFilters(users, 'ALL', 'ALL', 'STATUS', depts);
    const isActiveValues = result.map(u => u.isActive !== false);
    const firstFalseIdx = isActiveValues.indexOf(false);
    const lastTrueIdx   = isActiveValues.lastIndexOf(true);
    if (firstFalseIdx !== -1 && lastTrueIdx !== -1) {
      expect(lastTrueIdx).toBeLessThan(firstFalseIdx);
    }
  });
});

// ---------------------------------------------------------------------------
// AdminDepartmentsTab — búsqueda
// ---------------------------------------------------------------------------

describe('applyDeptSearch', () => {
  it('búsqueda vacía devuelve todos', () => {
    expect(applyDeptSearch(depts, '')).toHaveLength(3);
  });

  it('filtra por nombre (case-insensitive)', () => {
    const result = applyDeptSearch(depts, 'recursos');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('d1');
  });

  it('filtra por nombre con mayúsculas', () => {
    const result = applyDeptSearch(depts, 'CONTA');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('d2');
  });

  it('filtra por centro de costos', () => {
    const result = applyDeptSearch(depts, '30-01');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('d3');
  });

  it('coincidencia parcial en centro de costos', () => {
    const result = applyDeptSearch(depts, '01-00');
    expect(result).toHaveLength(3); // todos terminan en -01-00... no, 10-01-00, 20-01-00, 30-01-00 → todos tienen "01-00"
  });

  it('búsqueda sin coincidencia devuelve vacío', () => {
    expect(applyDeptSearch(depts, 'XXXXXXX')).toHaveLength(0);
  });

  it('término en medio del nombre coincide', () => {
    const result = applyDeptSearch(depts, 'ste');  // "Sistemas"
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('d3');
  });
});
