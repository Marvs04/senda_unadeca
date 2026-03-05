/**
 * hooks/useUsers.ts
 *
 * Gestiona el estado de todos los usuarios del sistema.
 *
 * Ciclo de vida:
 *   isLoading=true → getUsers() → isLoading=false + users | error
 *
 * Las mutaciones son optimistas: actualizan el estado local de inmediato.
 */
import { useState, useEffect } from 'react';
import { User } from '../types';
import {
  getUsers,
  createUser,
  patchUser,
  deleteUser as apiDeleteUser,
  resetUserPassword as apiResetUserPassword,
} from '../services';
import { subscribeToTableChanges } from '../lib/realtime';
import { toast } from 'sonner';

export function useUsers() {
  const [users, setUsers]         = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: number | null = null;

    const syncUsers = async (isInitialLoad: boolean) => {
      if (isInitialLoad) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const data = await getUsers();
        if (cancelled) return;
        setUsers(data);
        if (isInitialLoad) setIsLoading(false);
      } catch (err: unknown) {
        if (cancelled) return;
        if (isInitialLoad) {
          setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
          setIsLoading(false);
          return;
        }
        // Keep the last good state when realtime refresh fails.
        console.warn('[Realtime] No se pudo sincronizar usuarios', err);
      }
    };

    const scheduleBackgroundSync = () => {
      if (refreshTimer !== null) return;
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        void syncUsers(false);
      }, 250);
    };

    void syncUsers(true);

    const unsubscribeRealtime = subscribeToTableChanges({
      table: 'profiles',
      onChange: scheduleBackgroundSync,
    });

    return () => {
      cancelled = true;
      unsubscribeRealtime();
      if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer);
      }
    };
  }, []);

  // ── Mutaciones optimistas ─────────────────────────────────────────────────

  const addUser = async (newUser: Omit<User, 'id'>, password?: string) => {
    const tempId = crypto.randomUUID();
    const optimisticUser: User = { ...newUser, id: tempId };
    setUsers(prev => [...prev, optimisticUser]);

    try {
      const created = await createUser(newUser, password);
      setUsers(prev => prev.map(u => (u.id === tempId ? created : u)));
    } catch (err: unknown) {
      setUsers(prev => prev.filter(u => u.id !== tempId));
      const message = err instanceof Error ? err.message : 'Error al crear el usuario. Intente de nuevo.';
      toast.error(message);
      throw err;
    }
  };

  const deleteUser = async (userId: string) => {
    const snapshot = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    try {
      await apiDeleteUser(userId);
    } catch (err: unknown) {
      if (snapshot) setUsers(prev => [...prev, snapshot]);
      const message = err instanceof Error ? err.message : 'Error al eliminar el usuario. Intente de nuevo.';
      toast.error(message);
      throw err;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    const snapshot = users.find(u => u.id === userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));

    try {
      await patchUser(userId, updates);
    } catch (err: unknown) {
      if (snapshot) setUsers(prev => prev.map(u => u.id === userId ? snapshot : u));
      const message = err instanceof Error ? err.message : 'Error al actualizar el usuario. Intente de nuevo.';
      toast.error(message);
      throw err;
    }
  };

  const resetUserPassword = async (userId: string, newPassword: string) => {
    try {
      await apiResetUserPassword(userId, newPassword);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al resetear la contraseña. Intente de nuevo.';
      toast.error(message);
      throw err;
    }
  };

  return { users, isLoading, error, addUser, deleteUser, updateUser, resetUserPassword };
}
