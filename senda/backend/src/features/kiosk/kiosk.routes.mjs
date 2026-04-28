import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/requireAuth.mjs';
import { getState, activate, deactivate, clockIn, clockOut, cancelSession, updateShifts } from './kiosk.controller.mjs';

const router = Router();

// All kiosk endpoints require a valid JWT
router.get('/:departmentId', requireAuth, getState);
router.post('/activate', requireAuth, activate);
router.post('/deactivate', requireAuth, deactivate);
router.post('/clock-in', requireAuth, clockIn);
router.post('/clock-out', requireAuth, clockOut);
router.post('/cancel-session', requireAuth, cancelSession);
router.patch('/shifts', requireAuth, updateShifts);

export default router;
// Registers (mounted at /api/v1/kiosk):
//   GET    /:departmentId      — get active kiosk state for a department
//   POST   /activate           — activate kiosk (DEPT_HEAD / SUPER_ADMIN)
//   POST   /deactivate         — deactivate kiosk + flush open sessions
//   POST   /clock-in           — student clock-in
//   POST   /clock-out          — student clock-out → creates PENDING work log
//   POST   /cancel-session     — dept head cancels a session → creates REJECTED work log
//   PATCH  /shifts             — update scheduled shift windows
