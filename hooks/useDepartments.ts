import { useState } from 'react';
import { Department } from '../types';
import { MOCK_DEPARTMENTS } from '../constants';

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);

  const addDepartment = (newDepartment: Omit<Department, 'id'>) => {
    const department: Department = { ...newDepartment, id: `dept-${Date.now()}` };
    setDepartments(prev => [...prev, department]);
  };

  const updateDepartment = (deptId: string, updates: Partial<Department>) => {
    setDepartments(prev => prev.map(d => d.id === deptId ? { ...d, ...updates } : d));
  };

  return { departments, addDepartment, updateDepartment };
}
