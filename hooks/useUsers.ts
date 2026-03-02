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
import { getUsers, createUser, patchUser, deleteUser as apiDeleteUser } from '../services';
import { toast } from 'sonner';

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
    const user: User = { ...newUser, id: crypto.randomUUID() };
    setUsers(prev => [...prev, user]);
    createUser(newUser).catch(() => {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast.error('Error al crear el usuario. Intente de nuevo.');
    });
  };

  const deleteUser = (userId: string) => {
    const snapshot = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    apiDeleteUser(userId).catch(() => {
      if (snapshot) setUsers(prev => [...prev, snapshot]);
      toast.error('Error al eliminar el usuario. Intente de nuevo.');
    });
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    const snapshot = users.find(u => u.id === userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    patchUser(userId, updates).catch(() => {
      if (snapshot) setUsers(prev => prev.map(u => u.id === userId ? snapshot : u));
      toast.error('Error al actualizar el usuario. Intente de nuevo.');
    });
  };

  return { users, isLoading, error, addUser, deleteUser, updateUser };
}
