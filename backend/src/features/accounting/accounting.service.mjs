import * as repo from './accounting.repository.mjs';
import { AppError } from '../../shared/errors/AppError.mjs';

const ALLOWED_ACCOUNTING_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTING']);

function assertAccountingRole(requesterProfile) {
  if (!requesterProfile || !ALLOWED_ACCOUNTING_ROLES.has(requesterProfile.role)) {
    throw new AppError('Acceso denegado.', 403);
  }
}

// Convert snake_case db to camelCase obj
function mapConfig(data) {
  if (!data) return null;
  return {
    id: data.id,
    becasAccount: data.becas_account,
    becasName: data.becas_name,
    diezmoAccount: data.diezmo_account,
    diezmoName: data.diezmo_name,
    payableAccount: data.payable_account,
    payableName: data.payable_name,
    receivableAccount: data.receivable_account,
    receivableName: data.receivable_name,
    closingDay: data.closing_day ?? 25,
    updatedAt: data.updated_at,
  };
}

export async function getConfig(requesterProfile) {
  assertAccountingRole(requesterProfile);

  const { data, error } = await repo.getConfig();
  if (error) {
    throw new AppError('Error al obtener configuración contable: ' + error.message, 500);
  }
  return mapConfig(data);
}

export async function updateConfig(requesterProfile, payload) {
  assertAccountingRole(requesterProfile);

  if (!payload || typeof payload !== 'object') {
    throw new AppError('Payload inválido para actualizar configuración.', 400);
  }

  // Map incoming camelCase back to snake_case payload
  const updates = {};
  if (payload.becasAccount !== undefined) updates.becas_account = payload.becasAccount;
  if (payload.becasName !== undefined) updates.becas_name = payload.becasName;
  if (payload.diezmoAccount !== undefined) updates.diezmo_account = payload.diezmoAccount;
  if (payload.diezmoName !== undefined) updates.diezmo_name = payload.diezmoName;
  if (payload.payableAccount !== undefined) updates.payable_account = payload.payableAccount;
  if (payload.payableName !== undefined) updates.payable_name = payload.payableName;
  if (payload.receivableAccount !== undefined) updates.receivable_account = payload.receivableAccount;
  if (payload.receivableName !== undefined) updates.receivable_name = payload.receivableName;
  if (payload.closingDay !== undefined) {
    const day = Number(payload.closingDay);
    if (!Number.isInteger(day) || day < 1 || day > 28) {
      throw new AppError('El día de cierre debe ser un entero entre 1 y 28.', 400);
    }
    updates.closing_day = day;
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No hay campos para actualizar.', 400);
  }

  const { data, error } = await repo.updateConfig(updates);
  if (error) {
    throw new AppError('Error al actualizar configuración contable: ' + error.message, 400);
  }
  
  return mapConfig(data);
}

export async function upsertReceivable(requesterProfile, payload) {
  assertAccountingRole(requesterProfile);

  if (!payload || typeof payload !== 'object') {
    throw new AppError('Payload inválido para registrar cuenta por cobrar.', 400);
  }

  const { studentId, periodKey, amount } = payload;
  if (!studentId || !periodKey || amount === undefined) {
    throw new AppError('Faltan campos requeridos.', 400);
  }

  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount < 0) {
    throw new AppError('Monto de cuenta por cobrar inválido.', 400);
  }

  const { data, error } = await repo.upsertReceivable({
    student_id: String(studentId),
    period_key: String(periodKey),
    amount: normalizedAmount,
    created_by: requesterProfile.id,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new AppError('Error al guardar cuenta por cobrar: ' + error.message, 500);
  }

  return {
    id: data.id,
    studentId: data.student_id,
    periodKey: data.period_key,
    amount: Number(data.amount),
  };
}

export async function upsertManyReceivables(requesterProfile, payload) {
  assertAccountingRole(requesterProfile);

  if (!Array.isArray(payload) || payload.length === 0) {
    throw new AppError('Se esperaba un arreglo de filas no vacío.', 400);
  }
  if (payload.length > 500) {
    throw new AppError('Límite de 500 filas por importación.', 400);
  }

  const now = new Date().toISOString();
  const records = payload.map((row, i) => {
    const { studentId, periodKey, amount } = row ?? {};
    if (!studentId || !periodKey || amount === undefined) {
      throw new AppError(`Fila ${i + 1}: faltan campos requeridos (studentId, periodKey, amount).`, 400);
    }
    const num = Number(amount);
    if (!Number.isFinite(num) || num < 0) {
      throw new AppError(`Fila ${i + 1}: monto inválido.`, 400);
    }
    return {
      student_id: String(studentId),
      period_key: String(periodKey),
      amount: num,
      created_by: requesterProfile.id,
      updated_at: now,
    };
  });

  const { data, error } = await repo.upsertManyReceivables(records);
  if (error) {
    throw new AppError('Error al importar cuentas por cobrar: ' + error.message, 500);
  }

  return { imported: data?.length ?? 0 };
}
