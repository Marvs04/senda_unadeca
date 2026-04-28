// ─── kiosk_state ─────────────────────────────────────────────────────────────

/**
 * Fetch the active kiosk_state row for a department (including its sessions + student profiles).
 * Returns { data, error } — data is null if no kiosk is active.
 */
export async function findStateByDept(adminSupa, departmentId) {
  return adminSupa
    .from('kiosk_state')
    .select('*, kiosk_sessions(*, profiles!student_id(id, name, carnet, role, department_id))')
    .eq('department_id', departmentId)
    .maybeSingle();
}

/**
 * Insert a new kiosk_state row.
 * Returns { data, error } — data is the created row.
 */
export async function insertState(adminSupa, payload) {
  return adminSupa
    .from('kiosk_state')
    .insert(payload)
    .select('*')
    .single();
}

/**
 * Update the shifts array on an existing kiosk_state row.
 */
export async function updateStateShifts(adminSupa, kioskId, shifts) {
  return adminSupa
    .from('kiosk_state')
    .update({ shifts })
    .eq('id', kioskId)
    .select('*')
    .single();
}

/**
 * Delete the kiosk_state row (cascades to kiosk_sessions).
 */
export async function deleteState(adminSupa, kioskId) {
  return adminSupa
    .from('kiosk_state')
    .delete()
    .eq('id', kioskId);
}

// ─── kiosk_sessions ──────────────────────────────────────────────────────────

/**
 * Add a student session to an active kiosk.
 */
export async function insertSession(adminSupa, payload) {
  return adminSupa
    .from('kiosk_sessions')
    .insert(payload)
    .select('*')
    .single();
}

/**
 * Remove a single student session from a kiosk.
 * Returns the deleted row.
 */
export async function deleteSession(adminSupa, kioskId, studentId) {
  return adminSupa
    .from('kiosk_sessions')
    .delete()
    .eq('kiosk_id', kioskId)
    .eq('student_id', studentId)
    .select('*')
    .single();
}

/**
 * Remove all sessions for a kiosk (used during deactivate flush).
 * Returns { data, error }.
 */
export async function deleteAllSessions(adminSupa, kioskId) {
  return adminSupa
    .from('kiosk_sessions')
    .delete()
    .eq('kiosk_id', kioskId)
    .select('*');
}
