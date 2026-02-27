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
  departmentId?: string;
}

export interface Department {
  id: string;
  name: string;
  headId?: string; // ID of the Dept Head user
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
};

export interface WorkLog {
    id: string;
    studentId: string;
    departmentId: string;
    date: string; // YYYY-MM-DD
    hours: number;
    description: string;
    status: WorkLogStatus;
    rejectionReason?: string;
}