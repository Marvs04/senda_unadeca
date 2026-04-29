export async function findByDepartment(supabase, departmentId) {
  const { data, error } = await supabase
    .from('active_timer_sessions')
    .select('id, student_id, department_id, started_at, description, status, profiles!student_id(id, name, carnet)')
    .eq('department_id', departmentId)
    .eq('status', 'ACTIVE')
    .order('started_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function upsert(supabase, payload) {
  const { data, error } = await supabase
    .from('active_timer_sessions')
    .upsert(payload, { onConflict: 'student_id' })
    .select('id, student_id, department_id, started_at, description, status')
    .single();

  if (error) throw error;
  return data;
}

export async function removeByStudent(supabase, studentId) {
  const { error } = await supabase
    .from('active_timer_sessions')
    .delete()
    .eq('student_id', studentId);

  if (error) throw error;
}

export async function stopSession(supabase, sessionId, stoppedBy, reason) {
  const { data, error } = await supabase
    .from('active_timer_sessions')
    .update({
      status: 'STOPPED_BY_HEAD',
      stop_reason: reason || null,
      stopped_by: stoppedBy,
      stopped_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('status', 'ACTIVE')
    .select('id, student_id')
    .maybeSingle();

  if (error) throw error;
  return data; // null if not found or already stopped
}
