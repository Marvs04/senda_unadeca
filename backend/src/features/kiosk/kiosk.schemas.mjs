// ─── Kiosk constants & validators ────────────────────────────────────────────

/** Roles that can activate or deactivate a kiosk. */
export const KIOSK_MANAGER_ROLES = new Set(['SUPER_ADMIN', 'DEPT_HEAD']);

/** Regex for a shift time string in "HH:MM" 24-hour format. */
const SHIFT_TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Validate a single KioskShift object.
 * Returns an error string or null if valid.
 * @param {{ startTime: string, endTime: string }} shift
 */
export function validateShift(shift) {
  if (!shift || typeof shift !== 'object') return 'Turno inválido.';
  if (!SHIFT_TIME_REGEX.test(shift.startTime)) return `startTime "${shift.startTime}" no tiene formato HH:MM válido.`;
  if (!SHIFT_TIME_REGEX.test(shift.endTime))   return `endTime "${shift.endTime}" no tiene formato HH:MM válido.`;
  const [sh, sm] = shift.startTime.split(':').map(Number);
  const [eh, em] = shift.endTime.split(':').map(Number);
  if (sh * 60 + sm >= eh * 60 + em) return 'startTime debe ser anterior a endTime.';
  return null;
}
