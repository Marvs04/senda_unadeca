import * as service from './accounting.service.mjs';
import { getRequesterProfile } from '../../shared/middleware/requireAuth.mjs';

export async function getConfig(req, res, next) {
  try {
    const requesterProfile = await getRequesterProfile(req);
    const config = await service.getConfig(requesterProfile);
    res.json(config);
  } catch (err) {
    next(err);
  }
}

export async function updateConfig(req, res, next) {
  try {
    const requesterProfile = await getRequesterProfile(req);
    const config = await service.updateConfig(requesterProfile, req.body);
    res.json(config);
  } catch (err) {
    next(err);
  }
}

export async function upsertReceivable(req, res, next) {
  try {
    const requesterProfile = await getRequesterProfile(req);
    const result = await service.upsertReceivable(requesterProfile, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
