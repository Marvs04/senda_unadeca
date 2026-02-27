import { User, Department, WorkLog, UserRole, WorkLogStatus } from './types';

export const HOURLY_RATE = 1500; // 1500 colones
export const TITHE_PERCENTAGE = 0.10; // 10%

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'dept-uv', name: 'U Virtual', headId: 'user-head-1' },
  { id: 'dept-maint', name: 'Mantenimiento', headId: 'user-head-2' },
  { id: 'dept-lib', name: 'Biblioteca' },
];

export const MOCK_USERS: User[] = [
  // Super Admin
  { id: 'user-sadmin-1', name: 'Director TI', role: UserRole.SUPER_ADMIN },
  // Admins
  { id: 'user-admin-1', name: 'Ivonne', role: UserRole.ADMIN },
  { id: 'user-admin-2', name: 'Rector', role: UserRole.ADMIN },
  // Department Heads
  { id: 'user-head-1', name: 'Ing. Edy Echenique', role: UserRole.DEPT_HEAD, departmentId: 'dept-uv', employeeNumber: 'EMP-001' },
  { id: 'user-head-2', name: 'Bismark Tinoco', role: UserRole.DEPT_HEAD, departmentId: 'dept-maint', employeeNumber: 'EMP-002' },
  // Students
  { id: 'user-student-1', name: 'Marvin Moncada', role: UserRole.STUDENT, carnet: '20240101', departmentId: 'dept-uv' },
  { id: 'user-student-2', name: 'Santiago Zuniga', role: UserRole.STUDENT, carnet: '20240202', departmentId: 'dept-uv' },
  { id: 'user-student-3', name: 'Yefry Benitez', role: UserRole.STUDENT, carnet: '20240303', departmentId: 'dept-maint' },
  // Accounting
  { id: 'user-acc-1', name: 'Alejandra Peña', role: UserRole.ACCOUNTING },
];

export const MOCK_WORK_LOGS: WorkLog[] = [
  // Current Month Logs (February 2025)
  { id: 'log-1', studentId: 'user-student-1', departmentId: 'dept-uv', date: '2025-02-15', hours: 4, description: 'Actualización de plataforma Moodle.', status: WorkLogStatus.PROCESSED },
  { id: 'log-2', studentId: 'user-student-1', departmentId: 'dept-uv', date: '2025-02-16', hours: 5, description: 'Soporte a docente en videoconferencia.', status: WorkLogStatus.APPROVED },
  { id: 'log-11', studentId: 'user-student-1', departmentId: 'dept-uv', date: '2025-02-22', hours: 3, description: 'Creación de material multimedia.', status: WorkLogStatus.PENDING },

  { id: 'log-3', studentId: 'user-student-2', departmentId: 'dept-uv', date: '2025-02-15', hours: 6, description: 'Diseño de interfaz para nuevo curso.', status: WorkLogStatus.PROCESSED },
  { id: 'log-4', studentId: 'user-student-2', departmentId: 'dept-uv', date: '2025-02-18', hours: 4, description: 'Reunión de planificación.', status: WorkLogStatus.APPROVED },
  { id: 'log-12', studentId: 'user-student-2', departmentId: 'dept-uv', date: '2025-02-23', hours: 5, description: 'Revisión de contenido del curso de teología.', status: WorkLogStatus.PENDING },
  
  { id: 'log-5', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2025-02-17', hours: 8, description: 'Pintura en edificio administrativo.', status: WorkLogStatus.PROCESSED },
  { id: 'log-6', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2025-02-19', hours: 6, description: 'Reparación de luminarias en aulas.', status: WorkLogStatus.APPROVED },
  { id: 'log-13', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2025-02-24', hours: 7, description: 'Jardinería y limpieza de áreas verdes.', status: WorkLogStatus.REJECTED, rejectionReason: 'Horas no coinciden con el registro de entrada.' },
  { id: 'log-14', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2025-02-25', hours: 8, description: 'Limpieza de canoas.', status: WorkLogStatus.PENDING },
  
  // Previous Month Logs (January 2025)
  { id: 'log-jan-1', studentId: 'user-student-1', departmentId: 'dept-uv', date: '2025-01-10', hours: 5, description: 'Capacitación sobre nuevas herramientas.', status: WorkLogStatus.PROCESSED },
  { id: 'log-jan-2', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2025-01-20', hours: 8, description: 'Mantenimiento de aire acondicionado.', status: WorkLogStatus.PROCESSED },

  // Previous Month Logs (December 2024)
  { id: 'log-dec-1', studentId: 'user-student-2', departmentId: 'dept-uv', date: '2024-12-15', hours: 10, description: 'Desarrollo de curso propedéutico.', status: WorkLogStatus.PROCESSED },
  { id: 'log-dec-2', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2024-12-22', hours: 5, description: 'Apoyo en evento institucional.', status: WorkLogStatus.PROCESSED },

].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());