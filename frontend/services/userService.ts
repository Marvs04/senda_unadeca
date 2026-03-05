/**
 * services/userService.ts
 *
 * Data-access layer for User resources.
 * Swap each mock return for the commented real fetch when backend is ready.
 */

import { User } from '../types';
import { UserRole } from '../types';
import { apiClient } from '../api';

function getDefaultPassword(user: Omit<User, 'id'>): string {
  if (user.role === UserRole.STUDENT) return user.carnet ?? 'Temp#123456';
  if (user.role === UserRole.DEPT_HEAD) return user.employeeNumber ?? 'Temp#123456';
  return 'Temp#123456';
}

export async function getUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>('/users');
  return data;
}

export async function createUser(data: Omit<User, 'id'>, password?: string): Promise<User> {
  const effectivePassword = password?.trim() || getDefaultPassword(data);
  const { data: created } = await apiClient.post<User>('/users', {
    name: data.name,
    role: data.role,
    carnet: data.carnet ?? null,
    employeeNumber: data.employeeNumber ?? null,
    departmentId: data.departmentId ?? null,
    password: effectivePassword,
  });
  return created;
}

export async function patchUser(
  userId: string,
  updates: Partial<User>,
): Promise<Partial<User>> {
  await apiClient.patch(`/users/${userId}`, updates);
  return updates;
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.del(`/users/${userId}`);
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  await apiClient.post(`/users/${userId}/reset-password`, {
    newPassword,
  });
}
