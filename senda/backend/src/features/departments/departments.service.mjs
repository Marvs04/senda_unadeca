import {
  findAll,
  findById,
  insert,
  update,
  remove,
  countWorkLogsByDepartment,
  findDeptByHead,
  setDeptHead,
} from './departments.repository.mjs';
import { findHeadOfDept, updateProfileField } from '../users/users.repository.mjs';
import { COST_CENTER_REGEX } from './departments.schemas.mjs';
import { toDepartment } from '../../shared/utils/mappers.mjs';
import { normalizeOptionalText } from '../../shared/utils/normalize.mjs';

/**
 * Mantiene sincronizados departments.head_id ↔ profiles.department_id.
 * Llama cuando el headId de un departamento va a cambiar.
 *
 * @param {string} deptId  - ID del departamento que cambia
 * @param {string|null} oldHeadId - head_id actual (antes del cambio)
 * @param {string|null} newHeadId - nuevo head_id (puede ser null)
 */
async function syncHeadChange(deptId, oldHeadId, newHeadId) {
  // 1. Desasignar jefe anterior si cambia
  if (oldHeadId && oldHeadId !== newHeadId) {
    await updateProfileField(oldHeadId, { department_id: null }).catch(() => null);
  }

  if (newHeadId) {
    // 2. Si el nuevo jefe ya estaba asignado a OTRO departamento, limpiar ese dept
    const { data: prevDept } = await findDeptByHead(newHeadId);
    if (prevDept && prevDept.id !== deptId) {
      await setDeptHead(prevDept.id, null).catch(() => null);
    }
    // 3. Asignar department_id al nuevo jefe
    await updateProfileField(newHeadId, { department_id: deptId }).catch(() => null);
  }
}

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
    const err = new Error('Centro de costos inválido. Use formato NN-NN-NN.');
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

  // Sincronizar profiles.department_id con el jefe asignado al crear
  if (normalizedHeadId) {
    await syncHeadChange(data.id, null, normalizedHeadId);
  }

  return toDepartment(data);
}

export async function updateDepartment(id, body, requester) {
  if (!['ADMIN', 'SUPER_ADMIN', 'ACCOUNTING'].includes(requester.role)) {
    const err = new Error('No autorizado para actualizar departamentos.');
    err.statusCode = 403;
    throw err;
  }
  const { name, headId, costCenter } = body ?? {};

  if (requester.role === 'ACCOUNTING' && (name !== undefined || headId !== undefined)) {
    const err = new Error('No autorizado para actualizar nombre o jefe de departamento.');
    err.statusCode = 403;
    throw err;
  }

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
    // Allow empty string (department not yet configured); only validate format when non-empty
    if (normalizedCostCenter && !COST_CENTER_REGEX.test(normalizedCostCenter)) {
      const err = new Error('Centro de costos inválido. Use formato NN-NN-NN (ej. 10-00-01).');
      err.statusCode = 400;
      throw err;
    }
    updates.cost_center = normalizedCostCenter || null;
  }
  if (Object.keys(updates).length === 0) {
    const err = new Error('No hay campos para actualizar.');
    err.statusCode = 400;
    throw err;
  }

  // Leer el headId actual antes de modificar para poder sincronizar
  let currentHeadId = null;
  if (headId !== undefined) {
    const { data: currentDept } = await findById(id);
    currentHeadId = currentDept?.head_id ?? null;
  }

  const { error } = await update(id, updates);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  // Sincronizar profiles ↔ departments si cambió el jefe
  if (headId !== undefined) {
    const newHeadId = updates.head_id ?? null;
    await syncHeadChange(id, currentHeadId, newHeadId);
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
