/**
 * hooks/useSuperAdminData.ts
 *
 * Derives filtered user lists for the SuperAdmin portal.
 * Extracted from SuperAdminPortal's four useMemo blocks.
 *
 * Returns:
 *   filteredAdmins   — admin/accounting/dept-head accounts matching adminSearch
 *   filteredStudents — student accounts matching studentSearch
 */

import { useMemo } from 'react';
import { User, UserRole } from '../types';

interface UseSuperAdminDataParams {
  allUsers: User[];
  adminSearch: string;
  studentSearch: string;
}

export function useSuperAdminData({
  allUsers,
  adminSearch,
  studentSearch,
}: UseSuperAdminDataParams) {
  // Non-student, non-super-admin accounts
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

  const filteredAdmins = useMemo(
    () =>
      adminUsers.filter(
        a =>
          (a.name ?? '').toLowerCase().includes(adminSearch.toLowerCase()) ||
          a.employeeNumber?.toLowerCase().includes(adminSearch.toLowerCase()),
      ),
    [adminUsers, adminSearch],
  );

  const students = useMemo(
    () => (allUsers ?? []).filter(u => u.role === UserRole.STUDENT),
    [allUsers],
  );

  const filteredStudents = useMemo(
    () =>
      students.filter(
        s =>
          (s.name ?? '').toLowerCase().includes(studentSearch.toLowerCase()) ||
          s.carnet?.includes(studentSearch),
      ),
    [students, studentSearch],
  );

  return { filteredAdmins, filteredStudents };
}
