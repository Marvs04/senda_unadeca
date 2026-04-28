import * as ratesService from './rates.service.mjs';
import { getRequesterProfile } from '../../shared/middleware/requireAuth.mjs';

export async function getCurrent(req, res) {
  try {
    const result = await ratesService.getCurrentRate(req.supabase);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}

export async function update(req, res) {
  try {
    const requester = await getRequesterProfile(req);
    const { rate } = req.body ?? {};
    const result = await ratesService.updateRate(rate, requester, req.authUser.id);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}
// Exports:
//   getCurrent(req, res)
//   update(req, res)
// TODO: implement in Commit 3 (migrate rates).
