/**
 * hooks/useDepartments.ts
 *
 * Gestiona el estado de los departamentos.
 *
 * Ciclo de vida:
 *   isLoading=true → getDepartments() → isLoading=false + departments | error
 */
import { useState, useEffect } from 'react';
import { Department } from '../types';
import { getDepartments } from '../services';

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getDepartments()
      .then(data => {
        if (!cancelled) {
          setDepartments(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar departamentos');
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  // ── Mutaciones optimistas ─────────────────────────────────────────────────

  const addDepartment = (newDepartment: Omit<Department, 'id'>) => {
    const department: Department = { ...newDepartment, id: `dept-${Date.now()}` };
    setDepartments(prev => [...prev, department]);
  };

  const updateDepartment = (deptId: string, updates: Partial<Department>) => {
    setDepartments(prev => prev.map(d => d.id === deptId ? { ...d, ...updates } : d));
  };

  return { departments, isLoading, error, addDepartment, updateDepartment };
}
