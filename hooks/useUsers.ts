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
import { getUsers } from '../services';

export function useUsers() {
  const [users, setUsers]         = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getUsers()
      .then(data => {
        if (!cancelled) {
          setUsers(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  // ── Mutaciones optimistas ─────────────────────────────────────────────────

  const addUser = (newUser: Omit<User, 'id'>) => {
    const user: User = { ...newUser, id: `user-${Date.now()}` };
    setUsers(prev => [...prev, user]);
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  };

  return { users, isLoading, error, addUser, deleteUser, updateUser };
}
