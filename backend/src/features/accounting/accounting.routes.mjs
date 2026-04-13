import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/requireAuth.mjs';
import { getConfig, updateConfig, upsertReceivable, upsertManyReceivables } from './accounting.controller.mjs';

const router = Router();

router.get('/config', requireAuth, getConfig);
router.put('/config', requireAuth, updateConfig);
router.put('/receivables', requireAuth, upsertReceivable);
router.put('/receivables/batch', requireAuth, upsertManyReceivables);

export default router;
