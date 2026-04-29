import { adminSupabase } from '../../shared/config/supabaseClient.mjs';

export async function findByDepartment(supabase, departmentId) {
  const { data: sessions, error } = await adminSupabase
    .from('active_timer_sessions')
    .select('id, student_id, department_id, started_at, description, status')
    .eq('department_id', departmentId)
    .eq('status', 'ACTIVE')
    .order('started_at', { ascending: true });

  if (error) throw error;
  if (!sessions || sessions.length === 0) return [];

  // Fetch profiles separately (active_timer_sessions.student_id FK is on auth.users, not profiles)
  const studentIds = [...new Set(sessions.map(s => s.student_id))];
  const { data: profiles } = await adminSupabase
    .from('profiles')
    .select('id, name, carnet')
    .in('id', studentIds);

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  return sessions.map(s => ({ ...s, profiles: profileMap.get(s.student_id) ?? null }));
}

export async function upsert(supabase, payload) {
  const { data, error } = await adminSupabase
    .from('active_timer_sessions')
    .upsert(payload, { onConflict: 'student_id' })
    .select('id, student_id, department_id, started_at, description, status')
    .single();

  if (error) throw error;
  return data;
}

export async function findByStudent(supabase, studentId) {
  const { data, error } = await adminSupabase
    .from('active_timer_sessions')
    .select('id, student_id, department_id, started_at, description, status')
    .eq('student_id', studentId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function removeByStudent(supabase, studentId) {
  const { error } = await adminSupabase
    .from('active_timer_sessions')
    .delete()
    .eq('student_id', studentId);

  if (error) throw error;
}

export async function stopSession(supabase, sessionId, stoppedBy, reason, stoppedAt) {
  const { data, error } = await adminSupabase
    .from('active_timer_sessions')
    .update({
      status: 'STOPPED_BY_HEAD',
      stop_reason: reason || null,
      stopped_by: stoppedBy,
      stopped_at: stoppedAt ?? new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('status', 'ACTIVE')
    .select('id, student_id, department_id, started_at')
    .maybeSingle();

  if (error) throw error;
  return data; // null if not found or already stopped
}
