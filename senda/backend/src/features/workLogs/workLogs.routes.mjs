import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/requireAuth.mjs';
import { getAll, create, updateStatus, bulkUpdateStatus } from './workLogs.controller.mjs';

const router = Router();

router.get('/', requireAuth, getAll);
router.post('/', requireAuth, create);
// bulk-status must be declared before /:id/status to avoid route conflict
router.patch('/bulk-status', requireAuth, bulkUpdateStatus);
router.patch('/:id/status', requireAuth, updateStatus);

export default router;
// Registers:
//   GET    /
//   POST   /
//   PATCH  /bulk-status       ← must be declared BEFORE /:id/status to avoid route conflict
//   PATCH  /:id/status
// Mounted at /api/v1/work-logs in app.mjs.
// TODO: implement in Commit 6 (migrate workLogs).
