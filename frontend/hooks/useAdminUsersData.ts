/**
 * hooks/useAdminUsersData.ts
 *
 * Derives filtered user lists for the Admin portal tabs.
 * Covers both AdminStudentsTab (filteredStudents) and
 * AdminDeptHeadsTab (filteredHeads) to avoid two nearly-identical hooks.
 *
 * Returns:
 *   filteredStudents — student accounts matching studentSearch
 *   filteredHeads    — dept-head accounts matching deptHeadSearch
 */

import { useMemo } from 'react';
import { User, UserRole } from '../types';

interface UseAdminUsersDataParams {
  allUsers: User[];
  studentSearch: string;
  deptHeadSearch: string;
}

export function useAdminUsersData({
  allUsers,
  studentSearch,
  deptHeadSearch,
}: UseAdminUsersDataParams) {
  const filteredStudents = useMemo(
    () => {
      const query = studentSearch.toLowerCase().trim();
      return (allUsers ?? []).filter(u => {
        if (u.role !== UserRole.STUDENT) return false;
        if (!query) return true;
        return (
          (u.name ?? '').toLowerCase().includes(query) ||
          (u.carnet ?? '').toLowerCase().includes(query) ||
          (u.institutionalEmail ?? '').toLowerCase().includes(query)
        );
      });
    },
    [allUsers, studentSearch],
  );

  const filteredHeads = useMemo(
    () => {
      const query = deptHeadSearch.toLowerCase().trim();
      return (allUsers ?? []).filter(u => {
        if (u.role !== UserRole.DEPT_HEAD) return false;
        if (!query) return true;
        return (
          (u.name ?? '').toLowerCase().includes(query) ||
          (u.employeeNumber ?? '').toLowerCase().includes(query) ||
          (u.institutionalEmail ?? '').toLowerCase().includes(query)
        );
      });
    },
    [allUsers, deptHeadSearch],
  );

  return { filteredStudents, filteredHeads };
}
