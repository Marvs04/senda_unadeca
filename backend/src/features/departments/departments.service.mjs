import {
  findAll,
  findById,
  insert,
  update,
  remove,
  countWorkLogsByDepartment,
} from './departments.repository.mjs';
import { COST_CENTER_REGEX } from './departments.schemas.mjs';
import { toDepartment } from '../../shared/utils/mappers.mjs';
import { normalizeOptionalText } from '../../shared/utils/normalize.mjs';

export async function getDepartments(supabase) {
  const { data, error } = await findAll(supabase);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
  return (data ?? []).map(toDepartment);
}

export async function createDepartment(body, requester) {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(requester.role)) {
    const err = new Error('No autorizado para crear departamentos.');
    err.statusCode = 403;
    throw err;
  }
  const { name, headId, costCenter } = body ?? {};
  const normalizedName = String(name ?? '').trim();
  const normalizedHeadId = normalizeOptionalText(headId);
  const normalizedCostCenter = String(costCenter ?? '').trim();

  if (!normalizedName) {
    const err = new Error('El nombre del departamento es requerido.');
    err.statusCode = 400;
    throw err;
  }
  if (!COST_CENTER_REGEX.test(normalizedCostCenter)) {
    const err = new Error('Centro de costos invalido. Use formato NN-NNNN.');
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await insert({
    name: normalizedName,
    head_id: normalizedHeadId,
    cost_center: normalizedCostCenter,
  });
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
  return toDepartment(data);
}

export async function updateDepartment(id, body, requester) {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(requester.role)) {
    const err = new Error('No autorizado para actualizar departamentos.');
    err.statusCode = 403;
    throw err;
  }
  const { name, headId, costCenter } = body ?? {};
  const updates = {};

  if (name !== undefined) {
    const normalizedName = String(name).trim();
    if (!normalizedName) {
      const err = new Error('El nombre del departamento no puede estar vacío.');
      err.statusCode = 400;
      throw err;
    }
    updates.name = normalizedName;
  }
  if (headId !== undefined) {
    updates.head_id = normalizeOptionalText(headId);
  }
  if (costCenter !== undefined) {
    const normalizedCostCenter = String(costCenter).trim();
    if (!COST_CENTER_REGEX.test(normalizedCostCenter)) {
      const err = new Error('Centro de costos invalido. Use formato NN-NNNN.');
      err.statusCode = 400;
      throw err;
    }
    updates.cost_center = normalizedCostCenter;
  }
  if (Object.keys(updates).length === 0) {
    const err = new Error('No hay campos para actualizar.');
    err.statusCode = 400;
    throw err;
  }

  const { error } = await update(id, updates);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
}

export async function deleteDepartment(id, requester) {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(requester.role)) {
    const err = new Error('No autorizado para eliminar departamentos.');
    err.statusCode = 403;
    throw err;
  }

  const { data: dept, error: deptError } = await findById(id);
  if (deptError || !dept) {
    const err = new Error('Departamento no encontrado.');
    err.statusCode = 404;
    throw err;
  }

  const { count, error: logsError } = await countWorkLogsByDepartment(id);
  if (logsError) {
    const err = new Error(logsError.message);
    err.statusCode = 400;
    throw err;
  }
  if ((count ?? 0) > 0) {
    const err = new Error(`No se puede eliminar "${dept.name}" porque tiene registros de horas asociados.`);
    err.statusCode = 409;
    throw err;
  }

  const { error } = await remove(id);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
}
// Exports:
//   getDepartments(supabase)
//   createDepartment(body, requester)
//   updateDepartment(id, body, requester)
//   deleteDepartment(id, requester)   — validates no work_logs exist for this dept before deleting
// TODO: implement in Commit 4 (migrate departments).
