/**
 * uiConfig.ts
 * Configuraciones de UI compartidas entre componentes.
 * Centraliza estilos por rol y por estado de WorkLog para evitar duplicación.
 */
import { ShieldCheck, Lock, Users, GraduationCap, Briefcase, type LucideIcon } from 'lucide-react';
import { UserRole, WorkLogStatus } from '../types';

// ─── Role Configuration ────────────────────────────────────────────────────────

interface RoleConfig {
  bg: string;
  text: string;
  icon: LucideIcon;
  accent: string;
  theme: 'dark' | 'light';
}

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  [UserRole.SUPER_ADMIN]: {
    bg: 'bg-dark',
    text: 'Super Admin',
    icon: ShieldCheck,
    accent: 'border-border-dark',
    theme: 'dark',
  },
  [UserRole.ADMIN]: {
    bg: 'bg-card',
    text: 'Administración',
    icon: Lock,
    accent: 'border-border',
    theme: 'light',
  },
  [UserRole.DEPT_HEAD]: {
    bg: 'bg-card',
    text: 'Jefatura',
    icon: Users,
    accent: 'border-border',
    theme: 'light',
  },
  [UserRole.STUDENT]: {
    bg: 'bg-student',
    text: 'Estudiante',
    icon: GraduationCap,
    accent: 'border-border-dark',
    theme: 'dark',
  },
  [UserRole.ACCOUNTING]: {
    bg: 'bg-card',
    text: 'Contabilidad',
    icon: Briefcase,
    accent: 'border-border',
    theme: 'light',
  },
};

// ─── Status Badge Configuration ───────────────────────────────────────────────

interface StatusConfig {
  label: string;
  className: string;
}

export const STATUS_CONFIG: Record<WorkLogStatus, StatusConfig> = {
  [WorkLogStatus.PENDING]: {
    label: 'Pendiente',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  [WorkLogStatus.APPROVED]: {
    label: 'Aprobado',
    className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  },
  [WorkLogStatus.PROCESSED]: {
    label: 'Procesado',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  [WorkLogStatus.REJECTED]: {
    label: 'Rechazado',
    className: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  },
};
