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
import { getDepartments, createDepartment, patchDepartment } from '../services';
import { toast } from 'sonner';

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
    const department: Department = { ...newDepartment, id: crypto.randomUUID() };
    setDepartments(prev => [...prev, department]);
    createDepartment(newDepartment).catch(() => {
      setDepartments(prev => prev.filter(d => d.id !== department.id));
      toast.error('Error al crear el departamento. Intente de nuevo.');
    });
  };

  const updateDepartment = (deptId: string, updates: Partial<Department>) => {
    const snapshot = departments.find(d => d.id === deptId);
    setDepartments(prev => prev.map(d => d.id === deptId ? { ...d, ...updates } : d));
    patchDepartment(deptId, updates).catch(() => {
      if (snapshot) setDepartments(prev => prev.map(d => d.id === deptId ? snapshot : d));
      toast.error('Error al actualizar el departamento. Intente de nuevo.');
    });
  };

  return { departments, isLoading, error, addDepartment, updateDepartment };
}
