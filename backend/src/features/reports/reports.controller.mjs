/**
 * features/reports/reports.controller.mjs
 */

import { adminSupabase }        from '../../shared/config/supabaseClient.mjs';
import { getRequesterProfile }  from '../../shared/middleware/requireAuth.mjs';
import * as reportsService      from './reports.service.mjs';

export async function getPayroll(req, res, next) {
  try {
    const requesterProfile = await getRequesterProfile(req);
    const result = await reportsService.getPayrollReport(requesterProfile, req.query, adminSupabase);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
