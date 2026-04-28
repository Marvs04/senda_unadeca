import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/requireAuth.mjs';
import { getCurrent, update } from './rates.controller.mjs';

const router = Router();

router.get('/', requireAuth, getCurrent);
router.put('/', requireAuth, update);

export default router;
// Registers:
//   GET /
//   PUT /
// Mounted at /api/v1/rate in app.mjs.
// TODO: implement in Commit 3 (migrate rates).
