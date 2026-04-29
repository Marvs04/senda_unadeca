import * as authService from './auth.service.mjs';

export async function login(req, res) {
  try {
    const { identifier, password } = req.body ?? {};
    if (!identifier || !password) {
      return res.status(400).json({ message: 'identifier y password son requeridos.' });
    }
    const result = await authService.login(identifier, password);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}

export async function me(req, res) {
  try {
    const user = await authService.getSessionProfile(req.supabase, req.authUser.id);
    return res.json(user);
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}

export async function changePassword(req, res) {
  try {
    const { newPassword } = req.body ?? {};
    if (!newPassword) {
      return res.status(400).json({ message: 'newPassword es requerido.' });
    }
    const session = await authService.changePassword(req.authUser.id, newPassword);
    return session ? res.json(session) : res.status(204).send();
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error instanceof Error ? error.message : 'Error interno.' });
  }
}

export function logout(_req, res) {
  return res.status(204).send();
}
// Exports:
//   login(req, res)   — reads { identifier, password }, calls authService.login
//   me(req, res)      — calls authService.getSessionProfile
//   logout(req, res)  — responds 204
// TODO: implement in Commit 2 (migrate auth).
