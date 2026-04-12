/**
 * hooks/useSuperAdminData.ts
 *
 * Derives filtered, sorted, and paginated user lists for the SuperAdmin portal.
 */

import { useMemo } from 'react';
import { User, UserRole } from '../types';

export type SortField = 'name' | 'role' | 'createdAt';
export type SortDir = 'asc' | 'desc';
export type ActiveFilter = 'all' | 'active' | 'inactive';

interface UseSuperAdminDataParams {
  allUsers: User[];
  adminSearch: string;
  studentSearch: string;
  adminSort?: SortField;
  adminSortDir?: SortDir;
  adminActiveFilter?: ActiveFilter;
  studentSort?: SortField;
  studentSortDir?: SortDir;
  studentActiveFilter?: ActiveFilter;
}

function sortUsers(users: User[], field: SortField, dir: SortDir): User[] {
  const sorted = [...users].sort((a, b) => {
    if (field === 'name') return (a.name ?? '').localeCompare(b.name ?? '');
    if (field === 'role') return (a.role ?? '').localeCompare(b.role ?? '');
    if (field === 'createdAt') {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return da - db;
    }
    return 0;
  });
  return dir === 'desc' ? sorted.reverse() : sorted;
}

function filterByActive(users: User[], filter: ActiveFilter): User[] {
  if (filter === 'active') return users.filter(u => u.isActive !== false);
  if (filter === 'inactive') return users.filter(u => u.isActive === false);
  return users;
}

export function useSuperAdminData({
  allUsers,
  adminSearch,
  studentSearch,
  adminSort = 'name',
  adminSortDir = 'asc',
  adminActiveFilter = 'all',
  studentSort = 'name',
  studentSortDir = 'asc',
  studentActiveFilter = 'all',
}: UseSuperAdminDataParams) {
  // ── Role counts ───────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const all = allUsers ?? [];
    return {
      total: all.length,
      students: all.filter(u => u.role === UserRole.STUDENT).length,
      admins: all.filter(u => u.role === UserRole.ADMIN).length,
      deptHeads: all.filter(u => u.role === UserRole.DEPT_HEAD).length,
      accounting: all.filter(u => u.role === UserRole.ACCOUNTING).length,
      active: all.filter(u => u.isActive !== false).length,
      inactive: all.filter(u => u.isActive === false).length,
    };
  }, [allUsers]);

  // ── Admin accounts ────────────────────────────────────────────────────────
  const adminUsers = useMemo(
    () =>
      (allUsers ?? []).filter(
        u =>
          u.role === UserRole.ADMIN ||
          u.role === UserRole.ACCOUNTING ||
          u.role === UserRole.DEPT_HEAD,
      ),
    [allUsers],
  );

  const filteredAdmins = useMemo(() => {
    let result = adminUsers.filter(
      a =>
        (a.name ?? '').toLowerCase().includes(adminSearch.toLowerCase()) ||
        a.employeeNumber?.toLowerCase().includes(adminSearch.toLowerCase()),
    );
    result = filterByActive(result, adminActiveFilter);
    return sortUsers(result, adminSort, adminSortDir);
  }, [adminUsers, adminSearch, adminActiveFilter, adminSort, adminSortDir]);

  // ── Students ──────────────────────────────────────────────────────────────
  const students = useMemo(
    () => (allUsers ?? []).filter(u => u.role === UserRole.STUDENT),
    [allUsers],
  );

  const filteredStudents = useMemo(() => {
    let result = students.filter(
      s =>
        (s.name ?? '').toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.carnet?.includes(studentSearch),
    );
    result = filterByActive(result, studentActiveFilter);
    return sortUsers(result, studentSort, studentSortDir);
  }, [students, studentSearch, studentActiveFilter, studentSort, studentSortDir]);

  return { filteredAdmins, filteredStudents, counts };
}
