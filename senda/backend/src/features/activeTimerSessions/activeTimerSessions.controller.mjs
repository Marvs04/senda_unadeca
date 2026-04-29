import { adminSupabase } from '../../shared/config/supabaseClient.mjs';
import { getRequesterProfile } from '../../shared/middleware/requireAuth.mjs';
import * as service from './activeTimerSessions.service.mjs';

export async function getActiveSessions(req, res, next) {
  try {
    const { departmentId } = req.params;
    const profile = await getRequesterProfile(req);
    const sessions = await service.getActiveSessions(departmentId, profile, adminSupabase);
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

export async function startSession(req, res, next) {
  try {
    const { departmentId, description } = req.body;
    const profile = await getRequesterProfile(req);
    const session = await service.startSession(profile.id, departmentId, description ?? '', adminSupabase);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

export async function endSession(req, res, next) {
  try {
    const profile = await getRequesterProfile(req);
    await service.endSession(profile.id, adminSupabase);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function stopSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { departmentId, reason } = req.body;
    const profile = await getRequesterProfile(req);
    await service.stopSessionByHead(sessionId, departmentId, profile, reason, adminSupabase);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
