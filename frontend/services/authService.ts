import { apiClient, TokenManager } from '../api';
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

export async function getSessionProfile(): Promise<User | null> {
  if (!TokenManager.get()) return null;
  try {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  } catch {
    TokenManager.clear();
    return null;
  }
}
