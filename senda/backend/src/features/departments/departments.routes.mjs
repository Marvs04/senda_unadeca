import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/requireAuth.mjs';
import { getAll, create, update, remove } from './departments.controller.mjs';

const router = Router();

router.get('/', requireAuth, getAll);
router.post('/', requireAuth, create);
router.patch('/:id', requireAuth, update);
router.delete('/:id', requireAuth, remove);

export default router;
// Registers:
//   GET    /
//   POST   /
//   PATCH  /:id
//   DELETE /:id
// Mounted at /api/v1/departments in app.mjs.
// TODO: implement in Commit 4 (migrate departments).
