/**
 * features/reports/reports.routes.mjs
 *
 * GET /api/v1/reports/payroll
 *   Query params:
 *     mode       = 'cycle' | 'trimester'
 *     cycle      = 'YYYY-MM'      (required when mode=cycle)
 *     trimester  = 1 | 2 | 3     (required when mode=trimester)
 *     year       = YYYY
 *     deptId     = 'all' | <uuid>
 *     search     = string
 *     rate       = number
 */

import { Router }       from 'express';
import { requireAuth }  from '../../shared/middleware/requireAuth.mjs';
import { getPayroll, getStudentReport }   from './reports.controller.mjs';

const router = Router();

router.get('/payroll', requireAuth, getPayroll);
router.get('/student/:studentId', requireAuth, getStudentReport);

export default router;
