import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/requireAuth.mjs';
import { login, me, logout, changePassword } from './auth.controller.mjs';

const router = Router();

router.post('/login', login);
router.get('/me', requireAuth, me);
router.post('/logout', logout);
router.post('/change-password', requireAuth, changePassword);

export default router;
// Registers:
//   POST /login
//   GET  /me
//   POST /logout
// Mounted at /api/v1/auth in app.mjs.
// TODO: implement in Commit 2 (migrate auth).
