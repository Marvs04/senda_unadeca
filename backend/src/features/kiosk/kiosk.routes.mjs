import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/requireAuth.mjs';
import { getState, activate, continueKiosk, deactivate, clockIn, clockOut, cancelSession, updateShifts } from './kiosk.controller.mjs';

const router = Router();

// Kiosk endpoints with their respective auth strategies:
// - activate, continue, deactivate, clock-in, clock-out, cancel-session: validate credentials in body (NO JWT required)
// - getState: requires JWT (dept head viewing kiosk state)
// - updateShifts: requires JWT (dept head managing shifts)

router.get('/:departmentId', requireAuth, getState);
router.post('/activate', activate);          // validates identifier + password in body — fails with 409 if kiosk exists
router.post('/continue', continueKiosk);     // validates identifier + password in body — fails with 404 if no kiosk exists
router.post('/deactivate', deactivate);      // validates identifier + password in body
router.post('/clock-in', clockIn);           // validates carnet + password in body
router.post('/clock-out', clockOut);         // validates carnet + password in body
router.post('/cancel-session', cancelSession); // validates identifier + password in body
router.patch('/shifts', requireAuth, updateShifts); // requires JWT

export default router;
// Registers (mounted at /api/v1/kiosk):
//   GET    /:departmentId      — get active kiosk state for a department
//   POST   /activate           — activate kiosk (DEPT_HEAD / SUPER_ADMIN)
//   POST   /deactivate         — deactivate kiosk + flush open sessions
//   POST   /clock-in           — student clock-in
//   POST   /clock-out          — student clock-out → creates PENDING work log
//   POST   /cancel-session     — dept head cancels a session → creates REJECTED work log
//   PATCH  /shifts             — update scheduled shift windows
