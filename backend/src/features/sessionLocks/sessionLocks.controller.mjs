import { adminSupabase } from '../../shared/config/supabaseClient.mjs';
import * as service from './sessionLocks.service.mjs';
import { getRequesterProfile } from '../../shared/middleware/requireAuth.mjs';

export async function getLocks(req, res, next) {
  try {
    const { departmentId } = req.params;
    const requesterProfile = await getRequesterProfile(req);
    const locks = await service.getLocks(departmentId, requesterProfile, adminSupabase);
    res.json(locks);
  } catch (err) {
    next(err);
  }
}

export async function createLock(req, res, next) {
  try {
    const { departmentId } = req.params;
    const { startDateTime, endDateTime, reason } = req.body;
    const requesterProfile = await getRequesterProfile(req);
    const lock = await service.createLock(
      departmentId,
      startDateTime,
      endDateTime,
      reason,
      requesterProfile,
      adminSupabase,
    );
    res.status(201).json(lock);
  } catch (err) {
    next(err);
  }
}

export async function deleteLock(req, res, next) {
  try {
    const { lockId } = req.params;
    const requesterProfile = await getRequesterProfile(req);
    await service.deleteLock(lockId, requesterProfile, adminSupabase);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function checkIsLocked(req, res, next) {
  try {
    const { departmentId } = req.params;
    const isLocked = await service.checkIsSessionLocked(departmentId, adminSupabase);
    const reason = isLocked ? await service.getActiveLockReason(departmentId, adminSupabase) : null;
    res.json({ isLocked, reason });
  } catch (err) {
    next(err);
  }
}
