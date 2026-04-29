import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/requireAuth.mjs';
import * as controller from './activeTimerSessions.controller.mjs';

const router = Router();

// GET  /api/v1/active-sessions/dept/:departmentId — dept head fetches live sessions
router.get('/dept/:departmentId', requireAuth, controller.getActiveSessions);

// POST /api/v1/active-sessions — student starts timer (upserts their active session)
router.post('/', requireAuth, controller.startSession);

// DELETE /api/v1/active-sessions — student ends timer (deletes their active session)
router.delete('/', requireAuth, controller.endSession);

// POST /api/v1/active-sessions/:sessionId/stop — dept head stops a student's session
router.post('/:sessionId/stop', requireAuth, controller.stopSession);

export default router;
