import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/requireAuth.mjs';
import * as controller from './sessionLocks.controller.mjs';

const router = Router();

// GET /api/v1/session-locks/:departmentId — get all locks for a department
router.get('/:departmentId', requireAuth, controller.getLocks);

// GET /api/v1/session-locks/:departmentId/check — check if there's an active lock
router.get('/:departmentId/check', requireAuth, controller.checkIsLocked);

// POST /api/v1/session-locks/:departmentId — create a lock
router.post('/:departmentId', requireAuth, controller.createLock);

// DELETE /api/v1/session-locks/:lockId — delete a lock
router.delete('/:lockId', requireAuth, controller.deleteLock);

export default router;

// Routes:
//   GET    /:departmentId          — get all locks for a department (requireAuth)
//   GET    /:departmentId/check    — check if currently locked (no auth)
//   POST   /:departmentId          — create a lock (requireAuth)
//   DELETE /:lockId                — delete a lock (requireAuth)
