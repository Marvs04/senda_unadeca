import { apiClient, ApiError, TokenManager } from '../api';
import { User } from '../types';

export async function login(identifier: string, password: string): Promise<User> {
  const { data } = await apiClient.post<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    user: User;
  }>('/auth/login', {
    identifier,
    password,
  });

  TokenManager.set(data.accessToken);
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout', {});
  } finally {
    TokenManager.clear();
  }
}

export async function changePassword(newPassword: string): Promise<void> {
  await apiClient.post('/auth/change-password', { newPassword });
}

export async function getSessionProfile(): Promise<User | null> {
  if (!TokenManager.get()) return null;
  try {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  } catch (err) {
    // Only clear token on 401 (invalid/expired); keep it for transient errors
    if (err instanceof ApiError && err.status === 401) {
      TokenManager.clear();
    }
    return null;
  }
}
