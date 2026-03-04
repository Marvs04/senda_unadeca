/**
 * services/departmentService.ts
 *
 * Data-access layer for Department resources.
 */

import { Department } from '../types';
import { apiClient } from '../api';

export async function getDepartments(): Promise<Department[]> {
  const { data } = await apiClient.get<Department[]>('/departments');
  return data;
}

export async function createDepartment(
  data: Omit<Department, 'id'>,
): Promise<Department> {
  const { data: created } = await apiClient.post<Department>('/departments', {
    name: data.name,
    headId: data.headId,
  });
  return created;
}

export async function patchDepartment(
  deptId: string,
  updates: Partial<Department>,
): Promise<Partial<Department>> {
  await apiClient.patch(`/departments/${deptId}`, updates);
  return updates;
}

export async function deleteDepartment(deptId: string): Promise<void> {
  await apiClient.del(`/departments/${deptId}`);
}
