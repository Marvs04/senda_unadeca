export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  DEPT_HEAD = 'DEPT_HEAD',
  STUDENT = 'STUDENT',
  ACCOUNTING = 'ACCOUNTING',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  carnet?: string;
  employeeNumber?: string;
  institutionalEmail?: string;
  departmentId?: string;
  isActive?: boolean;
}

export interface Department {
  id: string;
  name: string;
  headId?: string; // ID of the Dept Head user
  costCenter: string;
}

export enum WorkLogStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSED = 'PROCESSED',
  REJECTED = 'REJECTED',
}

export interface HourlyRate {
  id: string;
  rate: number;
  effectiveDate: string; // YYYY-MM-DD
}

export const LIMITS = {
  DESCRIPTION: 200,
  REJECTION_REASON: 150,
  KIOSK_CANCEL_REASON: 150,
  /** Maximum hours a Dept Head can log in a single entry. Backend should mirror this with a CHECK constraint. */
  MAX_HOURS: 12,
};

// ─── Kiosk ────────────────────────────────────────────────────────────────────

/** A single student actively clocked in through the kiosk. */
export interface KioskSession {
  studentId: string;
  startedAt: string; // ISO timestamp
}

/** Shift window configuration for scheduled kiosk activation. */
export interface KioskShift {
  startTime: string; // "HH:MM" 24h
  endTime: string;   // "HH:MM" 24h
}

/** Full kiosk state for a department. */
export interface KioskState {
  departmentId: string;
  activatedBy: string;      // userId of whoever enabled it
  activatedAt: string;      // ISO timestamp
  sessions: KioskSession[]; // currently clocked-in students
  shifts: KioskShift[];     // scheduled auto-activation windows
}

export interface WorkLog {
  id: string;
  studentId: string;
  departmentId: string;
  date: string; // YYYY-MM-DD
  hours: number;
  description: string;
  status: WorkLogStatus;
  entrySource?: 'MANUAL' | 'KIOSK';
  startTime?: string;
  endTime?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}