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
    bg: 'bg-zinc-950',
    text: 'Super Admin',
    icon: ShieldCheck,
    accent: 'border-zinc-800',
    theme: 'dark',
  },
  [UserRole.ADMIN]: {
    bg: 'bg-white',
    text: 'Administración',
    icon: Lock,
    accent: 'border-zinc-200',
    theme: 'light',
  },
  [UserRole.DEPT_HEAD]: {
    bg: 'bg-white',
    text: 'Jefatura',
    icon: Users,
    accent: 'border-zinc-200',
    theme: 'light',
  },
  [UserRole.STUDENT]: {
    bg: 'bg-slate-950',
    text: 'Estudiante',
    icon: GraduationCap,
    accent: 'border-white/10',
    theme: 'dark',
  },
  [UserRole.ACCOUNTING]: {
    bg: 'bg-white',
    text: 'Contabilidad',
    icon: Briefcase,
    accent: 'border-zinc-200',
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
