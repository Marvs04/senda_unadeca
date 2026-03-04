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
    () =>
      (allUsers ?? []).filter(
        u =>
          u.role === UserRole.STUDENT &&
          ((u.name ?? '').toLowerCase().includes(studentSearch.toLowerCase()) ||
            u.carnet?.includes(studentSearch)),
      ),
    [allUsers, studentSearch],
  );

  const filteredHeads = useMemo(
    () =>
      (allUsers ?? []).filter(
        u =>
          u.role === UserRole.DEPT_HEAD &&
          (u.name ?? '').toLowerCase().includes(deptHeadSearch.toLowerCase()),
      ),
    [allUsers, deptHeadSearch],
  );

  return { filteredStudents, filteredHeads };
}
