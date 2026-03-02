/**
 * services/departmentService.ts
 *
 * Data-access layer for Department resources.
 */

import { Department } from '../types';
import { MOCK_DEPARTMENTS } from '../api/__mocks__';
// import { apiClient } from '../api';
// import { supabase, TABLES, mapDepartment } from '../api'; // ← Supabase

export async function getDepartments(): Promise<Department[]> {
  // Real (REST):
  // const { data } = await apiClient.get<Department[]>('/departments');
  // return data;

  // Real (Supabase):
  // const { data, error } = await supabase.from(TABLES.DEPARTMENTS).select('*');
  // if (error) throw new Error(error.message);
  // return data.map(mapDepartment);

  return Promise.resolve([...MOCK_DEPARTMENTS]);
}

export async function createDepartment(
  data: Omit<Department, 'id'>,
): Promise<Department> {
  const dept: Department = { ...data, id: crypto.randomUUID() };

  // Real (REST):
  // const { data: created } = await apiClient.post<Department>('/departments', data);
  // return created;

  // Real (Supabase):
  // const row = { name: data.name, head_id: data.headId ?? null };
  // const { data: created, error } = await supabase.from(TABLES.DEPARTMENTS).insert(row).select().single();
  // if (error) throw new Error(error.message);
  // return mapDepartment(created);

  return Promise.resolve(dept);
}

export async function patchDepartment(
  deptId: string,
  updates: Partial<Department>,
): Promise<Partial<Department>> {
  // Real (REST):
  // const { data } = await apiClient.patch<Partial<Department>>(`/departments/${deptId}`, updates);
  // return data;

  // Real (Supabase):
  // const row = { name: updates.name, head_id: updates.headId };
  // const { error } = await supabase.from(TABLES.DEPARTMENTS).update(row).eq('id', deptId);
  // if (error) throw new Error(error.message);
  // return updates;

  return Promise.resolve(updates);
}
