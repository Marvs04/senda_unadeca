import * as workLogsService from './workLogs.service.mjs';

export async function getAll(req, res) {
  try {
    const logs = await workLogsService.getWorkLogs(req.supabase);
    return res.json(logs);
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}

export async function create(req, res) {
  try {
    const log = await workLogsService.createWorkLog(req.body, req.authUser, req.supabase);
    return res.status(201).json(log);
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}

export async function updateStatus(req, res) {
  try {
    const log = await workLogsService.updateWorkLogStatus(req.params.id, req.body, req.authUser, req.supabase);
    return res.json(log);
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}

export async function bulkUpdateStatus(req, res) {
  try {
    const { updates } = req.body ?? {};
    const logs = await workLogsService.bulkUpdateWorkLogStatus(updates, req.authUser, req.supabase);
    return res.json(logs);
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}
// Exports:
//   getAll(req, res)
//   create(req, res)
//   updateStatus(req, res)
//   bulkUpdateStatus(req, res)
// TODO: implement in Commit 6 (migrate workLogs).
