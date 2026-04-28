import * as usersService from './users.service.mjs';
import { getRequesterProfile } from '../../shared/middleware/requireAuth.mjs';

export async function getAll(req, res) {
  try {
    const users = await usersService.getUsers(req.supabase);
    return res.json(users);
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}

export async function create(req, res) {
  try {
    const requester = await getRequesterProfile(req);
    const user = await usersService.createUser(req.body, requester);
    return res.status(201).json(user);
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}

export async function update(req, res) {
  try {
    const requester = await getRequesterProfile(req);
    await usersService.updateUser(req.params.id, req.body, requester);
    return res.status(204).send();
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}

export async function remove(req, res) {
  try {
    const requester = await getRequesterProfile(req);
    await usersService.deleteUser(req.params.id, requester);
    return res.status(204).send();
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}

export async function resetPassword(req, res) {
  try {
    const requester = await getRequesterProfile(req);
    const { newPassword } = req.body ?? {};
    await usersService.resetPassword(req.params.id, newPassword, requester);
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
//   resetPassword(req, res)
// TODO: implement in Commit 5 (migrate users).
