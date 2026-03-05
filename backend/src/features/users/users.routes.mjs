import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/requireAuth.mjs';
import { getAll, create, update, remove, resetPassword } from './users.controller.mjs';

const router = Router();

router.get('/', requireAuth, getAll);
router.post('/', requireAuth, create);
router.patch('/:id', requireAuth, update);
router.delete('/:id', requireAuth, remove);
router.post('/:id/reset-password', requireAuth, resetPassword);

export default router;
// Registers:
//   GET    /
//   POST   /
//   PATCH  /:id
//   DELETE /:id
//   POST   /:id/reset-password
// Mounted at /api/v1/users in app.mjs.
// TODO: implement in Commit 5 (migrate users).
