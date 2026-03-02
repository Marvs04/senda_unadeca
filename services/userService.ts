/**
 * services/userService.ts
 *
 * Data-access layer for User resources.
 * Swap each mock return for the commented real fetch when backend is ready.
 */

import { User } from '../types';
import { MOCK_USERS } from '../api/__mocks__';
// import { apiClient } from '../api';
// import { supabase, TABLES, mapUser } from '../api'; // ← Supabase

export async function getUsers(): Promise<User[]> {
  // Real (REST):
  // const { data } = await apiClient.get<User[]>('/users');
  // return data;

  // Real (Supabase):
  // const { data, error } = await supabase.from(TABLES.USERS).select('*');
  // if (error) throw new Error(error.message);
  // return data.map(mapUser);

  return Promise.resolve([...MOCK_USERS]);
}

export async function createUser(data: Omit<User, 'id'>): Promise<User> {
  const newUser: User = { ...data, id: crypto.randomUUID() };

  // Real (REST):
  // const { data: created } = await apiClient.post<User>('/users', data);
  // return created;

  // Real (Supabase):
  // const row = { name: data.name, role: data.role, carnet: data.carnet,
  //               department_id: data.departmentId, employee_number: data.employeeNumber };
  // const { data: created, error } = await supabase.from(TABLES.USERS).insert(row).select().single();
  // if (error) throw new Error(error.message);
  // return mapUser(created);

  return Promise.resolve(newUser);
}

export async function patchUser(
  userId: string,
  updates: Partial<User>,
): Promise<Partial<User>> {
  // Real (REST):
  // const { data } = await apiClient.patch<Partial<User>>(`/users/${userId}`, updates);
  // return data;

  // Real (Supabase):
  // const { error } = await supabase.from(TABLES.USERS).update(updates).eq('id', userId);
  // if (error) throw new Error(error.message);
  // return updates;

  return Promise.resolve(updates);
}

export async function deleteUser(userId: string): Promise<void> {
  // Real (REST):
  // await apiClient.del(`/users/${userId}`);

  // Real (Supabase):
  // const { error } = await supabase.from(TABLES.USERS).delete().eq('id', userId);
  // if (error) throw new Error(error.message);

  void userId;
  return Promise.resolve();
}
