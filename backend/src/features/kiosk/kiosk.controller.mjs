import { adminSupabase } from '../../shared/config/supabaseClient.mjs';
import { getRequesterProfile } from '../../shared/middleware/requireAuth.mjs';
import * as kioskService from './kiosk.service.mjs';

function handleError(res, error) {
  return res.status(error.statusCode ?? 500).json({
    message: error instanceof Error ? error.message : 'Error interno.',
  });
}

// GET /api/v1/kiosk/:departmentId
export async function getState(req, res) {
  try {
    const profile = await getRequesterProfile(req);
    const state = await kioskService.getState(profile, req.params.departmentId, adminSupabase);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

// POST /api/v1/kiosk/activate
export async function activate(req, res) {
  try {
    const state = await kioskService.activateKiosk(req.body, adminSupabase);
    return res.status(201).json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

// POST /api/v1/kiosk/continue
export async function continueKiosk(req, res) {
  try {
    const state = await kioskService.continueKiosk(req.body, adminSupabase);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

// POST /api/v1/kiosk/deactivate
export async function deactivate(req, res) {
  try {
    const result = await kioskService.deactivateKiosk(req.body, adminSupabase);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

// POST /api/v1/kiosk/clock-in
export async function clockIn(req, res) {
  try {
    const result = await kioskService.clockIn(req.body, adminSupabase);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

// POST /api/v1/kiosk/clock-out
export async function clockOut(req, res) {
  try {
    const result = await kioskService.clockOut(req.body, adminSupabase);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

// POST /api/v1/kiosk/cancel-session
export async function cancelSession(req, res) {
  try {
    const result = await kioskService.cancelSession(req.body, adminSupabase);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

// PATCH /api/v1/kiosk/shifts
export async function updateShifts(req, res) {
  try {
    const result = await kioskService.updateShifts(req.body, adminSupabase);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}
