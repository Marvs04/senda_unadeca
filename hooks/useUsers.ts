import { useState } from 'react';
import { User } from '../types';
import { MOCK_USERS } from '../constants';

export function useUsers() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

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

  return { users, addUser, deleteUser, updateUser };
}
