/**
 * api/__mocks__.ts
 *
 * ⚠️  DATOS DE PRUEBA — TEMPORAL
 * ─────────────────────────────────────────────────────────────────────────────
 * Este archivo contiene únicamente datos ficticios usados mientras el backend
 * no está disponible. Cuando el backend esté listo:
 *
 *   1. Borrar este archivo por completo.
 *   2. En cada servicio, descomentar el bloque "Real (Supabase):" y eliminar
 *      el "return Promise.resolve(MOCK_*);" correspondiente.
 *   3. El resto del código (hooks, componentes, portales) NO necesita cambios.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * CICLOS CUBIERTOS (la vista por defecto arranca en el ciclo actual):
 *   Ciclo 2026-03 → Feb 26 – Mar 25, 2026  (ciclo activo hoy)
 *   Ciclo 2026-02 → Ene 26 – Feb 25, 2026
 *   Ciclo 2026-01 → Dic 26, 2025 – Ene 25, 2026
 *   Ciclos 2025-XX → datos históricos previos
 */

import { User, Department, WorkLog, UserRole, WorkLogStatus } from '../types';

// ─── Departments ──────────────────────────────────────────────────────────────

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'dept-uv',   name: 'U Virtual',      headId: 'user-head-1' },
  { id: 'dept-maint', name: 'Mantenimiento', headId: 'user-head-2' },
  { id: 'dept-lib',  name: 'Biblioteca',     headId: undefined      },
];

// ─── Users ────────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  // Super Admin
  { id: 'user-sadmin-1', name: 'Director TI',         role: UserRole.SUPER_ADMIN },
  // Admins
  { id: 'user-admin-1',  name: 'Ivonne Ramírez',      role: UserRole.ADMIN },
  { id: 'user-admin-2',  name: 'Rector Flores',       role: UserRole.ADMIN },
  // Department Heads
  {
    id: 'user-head-1',
    name: 'Ing. Edy Echenique',
    role: UserRole.DEPT_HEAD,
    departmentId: 'dept-uv',
    employeeNumber: 'EMP-001',
  },
  {
    id: 'user-head-2',
    name: 'Bismark Tinoco',
    role: UserRole.DEPT_HEAD,
    departmentId: 'dept-maint',
    employeeNumber: 'EMP-002',
  },
  // Students
  { id: 'user-student-1', name: 'Marvin Moncada',  role: UserRole.STUDENT, carnet: '20240101', departmentId: 'dept-uv' },
  { id: 'user-student-2', name: 'Santiago Zuniga', role: UserRole.STUDENT, carnet: '20240202', departmentId: 'dept-uv' },
  { id: 'user-student-3', name: 'Yefry Benitez',   role: UserRole.STUDENT, carnet: '20240303', departmentId: 'dept-maint' },
  // Accounting
  { id: 'user-acc-1', name: 'Alejandra Peña', role: UserRole.ACCOUNTING },
];

// ─── Work Logs ────────────────────────────────────────────────────────────────

export const MOCK_WORK_LOGS: WorkLog[] = ([

  // ══════════════════════════════════════════════════════════════════
  // CICLO 2026-03  (Feb 26 – Mar 25, 2026)  ← ciclo activo por defecto
  // ══════════════════════════════════════════════════════════════════

  // — Marvin Moncada · U Virtual —
  { id: 'log-26-03-01', studentId: 'user-student-1', departmentId: 'dept-uv',   date: '2026-02-26', hours: 4,   description: 'Actualización de plataforma Moodle y migración de cursos.',    status: WorkLogStatus.APPROVED },
  { id: 'log-26-03-02', studentId: 'user-student-1', departmentId: 'dept-uv',   date: '2026-02-28', hours: 5,   description: 'Soporte técnico en videoconferencia para docentes.',           status: WorkLogStatus.PENDING },
  { id: 'log-26-03-03', studentId: 'user-student-1', departmentId: 'dept-uv',   date: '2026-03-03', hours: 6,   description: 'Diseño de material educativo digital para Teología.',         status: WorkLogStatus.REJECTED,  rejectionReason: 'Las horas registradas no coinciden con el horario acordado.' },
  { id: 'log-26-03-04', studentId: 'user-student-1', departmentId: 'dept-uv',   date: '2026-03-07', hours: 3,   description: 'Revisión y configuración de exámenes en Moodle.',             status: WorkLogStatus.PENDING },

  // — Santiago Zuniga · U Virtual —
  { id: 'log-26-03-05', studentId: 'user-student-2', departmentId: 'dept-uv',   date: '2026-02-27', hours: 6,   description: 'Diseño de interfaz para nuevo módulo de matrículas.',         status: WorkLogStatus.APPROVED },
  { id: 'log-26-03-06', studentId: 'user-student-2', departmentId: 'dept-uv',   date: '2026-03-01', hours: 4,   description: 'Reunión de planificación semestral con coordinadores.',       status: WorkLogStatus.APPROVED },
  { id: 'log-26-03-07', studentId: 'user-student-2', departmentId: 'dept-uv',   date: '2026-03-05', hours: 5,   description: 'Revisión de contenidos del cuatrimestre de Comunicación.',   status: WorkLogStatus.PENDING },
  { id: 'log-26-03-08', studentId: 'user-student-2', departmentId: 'dept-uv',   date: '2026-03-10', hours: 3,   description: 'Capacitación en herramientas digitales para docentes.',       status: WorkLogStatus.PENDING },

  // — Yefry Benitez · Mantenimiento —
  { id: 'log-26-03-09', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2026-02-26', hours: 8,  description: 'Pintura de aulas del edificio central y pasillos.',            status: WorkLogStatus.PROCESSED },
  { id: 'log-26-03-10', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2026-03-02', hours: 7,  description: 'Reparación de luminarias en pasillos y salones.',              status: WorkLogStatus.APPROVED },
  { id: 'log-26-03-11', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2026-03-08', hours: 6,  description: 'Jardinería y mantenimiento de áreas verdes del campus.',      status: WorkLogStatus.APPROVED },
  { id: 'log-26-03-12', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2026-03-12', hours: 5,  description: 'Instalación de extintores nuevos en edificios A y B.',        status: WorkLogStatus.PENDING },

  // ══════════════════════════════════════════════════════════════════
  // CICLO 2026-02  (Ene 26 – Feb 25, 2026)  — historial pagado
  // ══════════════════════════════════════════════════════════════════

  { id: 'log-26-02-01', studentId: 'user-student-1', departmentId: 'dept-uv',   date: '2026-01-28', hours: 8,   description: 'Migración de cursos a nueva versión de Moodle.',              status: WorkLogStatus.PROCESSED },
  { id: 'log-26-02-02', studentId: 'user-student-1', departmentId: 'dept-uv',   date: '2026-02-10', hours: 6,   description: 'Soporte a estudiantes en proceso de matrícula en línea.',    status: WorkLogStatus.PROCESSED },
  { id: 'log-26-02-03', studentId: 'user-student-1', departmentId: 'dept-uv',   date: '2026-02-20', hours: 5,   description: 'Actualización de contenidos multimedia del portal.',          status: WorkLogStatus.PROCESSED },

  { id: 'log-26-02-04', studentId: 'user-student-2', departmentId: 'dept-uv',   date: '2026-01-30', hours: 7,   description: 'Diseño de evaluaciones en línea para cursos cuatrimestrales.', status: WorkLogStatus.PROCESSED },
  { id: 'log-26-02-05', studentId: 'user-student-2', departmentId: 'dept-uv',   date: '2026-02-12', hours: 8,   description: 'Desarrollo de recursos educativos para curso propedéutico.',  status: WorkLogStatus.PROCESSED },
  { id: 'log-26-02-06', studentId: 'user-student-2', departmentId: 'dept-uv',   date: '2026-02-22', hours: 4,   description: 'Apoyo logístico en jornada de inducción estudiantil.',        status: WorkLogStatus.PROCESSED },

  { id: 'log-26-02-07', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2026-01-27', hours: 10, description: 'Revisión y mantenimiento del sistema eléctrico del campus.', status: WorkLogStatus.PROCESSED },
  { id: 'log-26-02-08', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2026-02-15', hours: 9,  description: 'Pintura de paredes y estructuras externas del edificio A.',   status: WorkLogStatus.PROCESSED },
  { id: 'log-26-02-09', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2026-02-22', hours: 6,  description: 'Reparación de mobiliario roto en aulas 301–310.',             status: WorkLogStatus.PROCESSED },

  // ══════════════════════════════════════════════════════════════════
  // CICLO 2026-01  (Dic 26, 2025 – Ene 25, 2026)  — historial pagado
  // ══════════════════════════════════════════════════════════════════

  { id: 'log-26-01-01', studentId: 'user-student-1', departmentId: 'dept-uv',   date: '2026-01-05', hours: 6,   description: 'Configuración de nueva instancia Moodle para cuatrimestre.',  status: WorkLogStatus.PROCESSED },
  { id: 'log-26-01-02', studentId: 'user-student-1', departmentId: 'dept-uv',   date: '2026-01-15', hours: 4,   description: 'Soporte técnico remoto a docentes de modalidad virtual.',     status: WorkLogStatus.PROCESSED },

  { id: 'log-26-01-03', studentId: 'user-student-2', departmentId: 'dept-uv',   date: '2026-01-10', hours: 8,   description: 'Desarrollo de material audiovisual para nuevos cursos.',      status: WorkLogStatus.PROCESSED },
  { id: 'log-26-01-04', studentId: 'user-student-2', departmentId: 'dept-uv',   date: '2026-01-20', hours: 5,   description: 'Revisión y corrección de curso de Metodología en línea.',    status: WorkLogStatus.PROCESSED },

  { id: 'log-26-01-05', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2025-12-27', hours: 8,  description: 'Mantenimiento preventivo de equipos del laboratorio.',        status: WorkLogStatus.PROCESSED },
  { id: 'log-26-01-06', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2026-01-08', hours: 10, description: 'Reparación de techos con infiltraciones en edificio B.',      status: WorkLogStatus.PROCESSED },
  { id: 'log-26-01-07', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2026-01-18', hours: 7,  description: 'Limpieza profunda y pintura de estacionamiento principal.',   status: WorkLogStatus.PROCESSED },

  // ══════════════════════════════════════════════════════════════════
  // DATOS HISTÓRICOS 2025 (mantenidos sin cambios)
  // ══════════════════════════════════════════════════════════════════

  // ── Febrero 2025 ─────────────────────────────────────
  { id: 'log-1',  studentId: 'user-student-1', departmentId: 'dept-uv',   date: '2025-02-15', hours: 4,  description: 'Actualización de plataforma Moodle.',                         status: WorkLogStatus.PROCESSED },
  { id: 'log-2',  studentId: 'user-student-1', departmentId: 'dept-uv',   date: '2025-02-16', hours: 5,  description: 'Soporte a docente en videoconferencia.',                      status: WorkLogStatus.APPROVED },
  { id: 'log-11', studentId: 'user-student-1', departmentId: 'dept-uv',   date: '2025-02-22', hours: 3,  description: 'Creación de material multimedia.',                           status: WorkLogStatus.PENDING },

  { id: 'log-3',  studentId: 'user-student-2', departmentId: 'dept-uv',   date: '2025-02-15', hours: 6,  description: 'Diseño de interfaz para nuevo curso.',                       status: WorkLogStatus.PROCESSED },
  { id: 'log-4',  studentId: 'user-student-2', departmentId: 'dept-uv',   date: '2025-02-18', hours: 4,  description: 'Reunión de planificación.',                                  status: WorkLogStatus.APPROVED },
  { id: 'log-12', studentId: 'user-student-2', departmentId: 'dept-uv',   date: '2025-02-23', hours: 5,  description: 'Revisión de contenido del curso de teología.',               status: WorkLogStatus.PENDING },

  { id: 'log-5',  studentId: 'user-student-3', departmentId: 'dept-maint', date: '2025-02-17', hours: 8, description: 'Pintura en edificio administrativo.',                       status: WorkLogStatus.PROCESSED },
  { id: 'log-6',  studentId: 'user-student-3', departmentId: 'dept-maint', date: '2025-02-19', hours: 6, description: 'Reparación de luminarias en aulas.',                        status: WorkLogStatus.APPROVED },
  { id: 'log-13', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2025-02-24', hours: 7, description: 'Jardinería y limpieza de áreas verdes.',                    status: WorkLogStatus.REJECTED,  rejectionReason: 'Horas no coinciden con el registro de entrada.' },
  { id: 'log-14', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2025-02-25', hours: 8, description: 'Limpieza de canoas.',                                       status: WorkLogStatus.PENDING },

  // ── Enero 2025 ────────────────────────────────────────
  { id: 'log-jan-1', studentId: 'user-student-1', departmentId: 'dept-uv',    date: '2025-01-10', hours: 5, description: 'Capacitación sobre nuevas herramientas.',                status: WorkLogStatus.PROCESSED },
  { id: 'log-jan-2', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2025-01-20', hours: 8, description: 'Mantenimiento de aire acondicionado.',                   status: WorkLogStatus.PROCESSED },

  // ── Diciembre 2024 ────────────────────────────────────
  { id: 'log-dec-1', studentId: 'user-student-2', departmentId: 'dept-uv',    date: '2024-12-15', hours: 10, description: 'Desarrollo de curso propedéutico.',                     status: WorkLogStatus.PROCESSED },
  { id: 'log-dec-2', studentId: 'user-student-3', departmentId: 'dept-maint', date: '2024-12-22', hours: 5,  description: 'Apoyo en evento institucional.',                        status: WorkLogStatus.PROCESSED },

] as WorkLog[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
