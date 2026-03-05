import { AppError } from '../errors/AppError.mjs';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  const status = err.status ?? err.statusCode ?? 500;
  const message = err instanceof Error ? err.message : 'Error interno del servidor.';
  return res.status(status).json({ message });
}
