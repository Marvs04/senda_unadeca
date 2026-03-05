import * as departmentsService from './departments.service.mjs';
import { getRequesterProfile } from '../../shared/middleware/requireAuth.mjs';

export async function getAll(req, res) {
  try {
    const departments = await departmentsService.getDepartments(req.supabase);
    return res.json(departments);
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}

export async function create(req, res) {
  try {
    const requester = await getRequesterProfile(req);
    const department = await departmentsService.createDepartment(req.body, requester);
    return res.status(201).json(department);
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}

export async function update(req, res) {
  try {
    const requester = await getRequesterProfile(req);
    await departmentsService.updateDepartment(req.params.id, req.body, requester);
    return res.status(204).send();
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}

export async function remove(req, res) {
  try {
    const requester = await getRequesterProfile(req);
    await departmentsService.deleteDepartment(req.params.id, requester);
    return res.status(204).send();
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}
// Exports:
//   getAll(req, res)
//   create(req, res)
//   update(req, res)
//   remove(req, res)
// TODO: implement in Commit 4 (migrate departments).
