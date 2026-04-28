import {
  findAll,
  findById,
  findByIdLight,
  createAuthUser,
  updateProfileField,
  update,
  remove,
  updateAuthPassword,
} from './users.repository.mjs';
import { VALID_ROLES, ADMIN_CREATABLE_ROLES } from './users.schemas.mjs';
import { toUser } from '../../shared/utils/mappers.mjs';
import { normalizeOptionalText } from '../../shared/utils/normalize.mjs';
import { INSTITUTIONAL_EMAIL_REGEX } from '../../shared/utils/regex.mjs';
import { buildAuthEmail } from '../../shared/utils/normalize.mjs';
import {
  sendWelcome,
  sendPasswordReset,
  sendAccountDeactivated,
  sendAccountActivated,
} from '../../shared/config/mailer.mjs';

export async function getUsers(supabase) {
  const { data, error } = await findAll(supabase);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
  return (data ?? []).map(toUser);
}

export async function createUser(body, requester) {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(requester.role)) {
    const err = new Error('No autorizado para crear usuarios.');
    err.statusCode = 403;
    throw err;
  }

  const {
    name,
    role,
    carnet,
    employeeNumber,
    institutionalEmail,
    departmentId,
    password,
  } = body ?? {};

  const normalizedName = String(name ?? '').trim();
  const normalizedRole = String(role ?? '').trim().toUpperCase();
  const normalizedCarnet = normalizeOptionalText(carnet);
  const normalizedEmployeeNumber = normalizeOptionalText(employeeNumber);
  const normalizedDepartmentId = normalizeOptionalText(departmentId);
  const normalizedInstitutionalEmail = normalizeOptionalText(institutionalEmail);

  if (!normalizedName || !normalizedRole) {
    const err = new Error('name y role son requeridos.');
    err.statusCode = 400;
    throw err;
  }
  if (!VALID_ROLES.includes(normalizedRole)) {
    const err = new Error('role invalido.');
    err.statusCode = 400;
    throw err;
  }
  if (requester.role === 'ADMIN' && !ADMIN_CREATABLE_ROLES.includes(normalizedRole)) {
    const err = new Error('Admin solo puede crear cuentas DEPT_HEAD y STUDENT.');
    err.statusCode = 403;
    throw err;
  }
  if (normalizedRole === 'DEPT_HEAD' && !normalizedEmployeeNumber) {
    const err = new Error('Numero de empleado es requerido para DEPT_HEAD.');
    err.statusCode = 400;
    throw err;
  }
  if (normalizedRole === 'STUDENT' && !normalizedCarnet) {
    const err = new Error('Carnet es requerido para STUDENT.');
    err.statusCode = 400;
    throw err;
  }
  if (!normalizedInstitutionalEmail) {
    const err = new Error('El correo institucional es requerido.');
    err.statusCode = 400;
    throw err;
  }
  if (!INSTITUTIONAL_EMAIL_REGEX.test(normalizedInstitutionalEmail)) {
    const err = new Error('El correo institucional debe tener el formato usuario@unadeca.net');
    err.statusCode = 400;
    throw err;
  }

  const identifier = normalizedCarnet ?? normalizedEmployeeNumber ?? normalizedName;
  const email = buildAuthEmail(identifier);

  const { data: createdAuth, error: createError } = await createAuthUser(email, password, {
    name: normalizedName,
    role: normalizedRole,
    carnet: normalizedCarnet,
    employee_number: normalizedEmployeeNumber,
    institutional_email: normalizedInstitutionalEmail,
    department_id: normalizedDepartmentId,
  });

  if (createError || !createdAuth.user) {
    const err = new Error(createError?.message ?? 'No fue posible crear usuario.');
    err.statusCode = 400;
    throw err;
  }

  const { data: profile, error: profileError } = await updateProfileField(createdAuth.user.id, {
    institutional_email: normalizedInstitutionalEmail ?? null,
  });
  if (profileError) {
    const err = new Error(profileError.message);
    err.statusCode = 400;
    throw err;
  }

  sendWelcome({
    to: normalizedInstitutionalEmail,
    name: normalizedName,
    role: normalizedRole,
    identifier: normalizedCarnet ?? normalizedEmployeeNumber ?? normalizedName,
    password,
  }).catch((e) => console.error('[mailer] sendWelcome error:', e.message));

  return toUser(profile);
}

export async function updateUser(id, body, requester) {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(requester.role)) {
    const err = new Error('No autorizado para editar usuarios.');
    err.statusCode = 403;
    throw err;
  }

  const { data: target, error: targetError } = await findById(id);
  if (targetError || !target) {
    const err = new Error('Usuario no encontrado.');
    err.statusCode = 404;
    throw err;
  }
  if (requester.role === 'ADMIN' && !['STUDENT', 'DEPT_HEAD'].includes(target.role)) {
    const err = new Error('Admin solo puede editar estudiantes y jefes de departamento.');
    err.statusCode = 403;
    throw err;
  }
  if (target.role === 'SUPER_ADMIN') {
    const err = new Error('No se permite editar cuentas SUPER_ADMIN.');
    err.statusCode = 403;
    throw err;
  }

  const { name, role, carnet, employeeNumber, institutionalEmail, departmentId, isActive } = body ?? {};

  if (role !== undefined) {
    const err = new Error('Cambiar rol no está habilitado por esta ruta.');
    err.statusCode = 400;
    throw err;
  }

  const nextName = name !== undefined ? String(name).trim() : String(target.name ?? '').trim();
  const nextCarnet = carnet !== undefined ? normalizeOptionalText(carnet) : normalizeOptionalText(target.carnet);
  const nextEmployeeNumber = employeeNumber !== undefined ? normalizeOptionalText(employeeNumber) : normalizeOptionalText(target.employee_number);
  const nextInstitutionalEmail = institutionalEmail !== undefined ? normalizeOptionalText(institutionalEmail) : normalizeOptionalText(target.institutional_email);

  if (!nextName) {
    const err = new Error('El nombre es requerido.');
    err.statusCode = 400;
    throw err;
  }
  if (target.role === 'STUDENT' && !nextCarnet) {
    const err = new Error('Carnet es requerido para STUDENT.');
    err.statusCode = 400;
    throw err;
  }
  if (target.role === 'DEPT_HEAD' && !nextEmployeeNumber) {
    const err = new Error('Numero de empleado es requerido para DEPT_HEAD.');
    err.statusCode = 400;
    throw err;
  }
  if (nextInstitutionalEmail && !INSTITUTIONAL_EMAIL_REGEX.test(nextInstitutionalEmail)) {
    const err = new Error('El correo institucional debe tener el formato usuario@unadeca.net');
    err.statusCode = 400;
    throw err;
  }

  const updates = {};
  if (name !== undefined) updates.name = nextName;
  if (carnet !== undefined) updates.carnet = nextCarnet;
  if (employeeNumber !== undefined) updates.employee_number = nextEmployeeNumber;
  if (institutionalEmail !== undefined) updates.institutional_email = nextInstitutionalEmail;
  if (departmentId !== undefined) updates.department_id = normalizeOptionalText(departmentId);
  if (isActive !== undefined) updates.is_active = Boolean(isActive);

  if (Object.keys(updates).length === 0) {
    const err = new Error('No hay cambios para actualizar.');
    err.statusCode = 400;
    throw err;
  }

  const { error } = await update(id, updates);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  const targetEmail = target.institutional_email ?? nextInstitutionalEmail;
  if (isActive !== undefined && targetEmail) {
    const fn = Boolean(isActive) ? sendAccountActivated : sendAccountDeactivated;
    fn({ to: targetEmail, name: target.name })
      .catch((e) => console.error('[mailer] sendAccount status error:', e.message));
  }
}

export async function deleteUser(id, requester) {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(requester.role)) {
    const err = new Error('No autorizado para eliminar usuarios.');
    err.statusCode = 403;
    throw err;
  }

  const { data: target, error: targetError } = await findByIdLight(id);
  if (targetError || !target) {
    const err = new Error('Usuario no encontrado.');
    err.statusCode = 404;
    throw err;
  }
  if (target.role === 'SUPER_ADMIN') {
    const err = new Error('No se permite eliminar cuentas SUPER_ADMIN.');
    err.statusCode = 403;
    throw err;
  }
  if (requester.role === 'ADMIN' && !['STUDENT', 'DEPT_HEAD'].includes(target.role)) {
    const err = new Error('Admin solo puede eliminar estudiantes y jefes de departamento.');
    err.statusCode = 403;
    throw err;
  }

  const { error } = await remove(id);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
}

export async function resetPassword(id, newPassword, requester) {
  if (requester.role !== 'SUPER_ADMIN') {
    const err = new Error('Solo SUPER_ADMIN puede resetear contraseñas.');
    err.statusCode = 403;
    throw err;
  }
  if (typeof newPassword !== 'string' || newPassword.trim().length < 8) {
    const err = new Error('newPassword debe tener al menos 8 caracteres.');
    err.statusCode = 400;
    throw err;
  }

  const { data: target, error: targetError } = await findByIdLight(id);
  if (targetError || !target) {
    const err = new Error('Usuario no encontrado.');
    err.statusCode = 404;
    throw err;
  }
  if (target.role === 'SUPER_ADMIN' && target.id !== requester.id) {
    const err = new Error('No se permite resetear otro usuario SUPER_ADMIN.');
    err.statusCode = 403;
    throw err;
  }

  const { error } = await updateAuthPassword(id, newPassword.trim());
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  const recipientEmail = target.institutional_email;
  if (recipientEmail) {
    const identifier = target.carnet ?? target.employee_number ?? target.name;
    sendPasswordReset({
      to: recipientEmail,
      name: target.name,
      identifier,
      newPassword: newPassword.trim(),
      resetBy: requester.name ?? requester.role,
    }).catch((e) => console.error('[mailer] sendPasswordReset error:', e.message));
  }
}
// Exports:
//   getUsers(supabase)
//   createUser(body, requester)
//   updateUser(id, body, requester)
//   deleteUser(id, requester)
//   resetPassword(id, newPassword, requester)
// Contains all role checks and business validation.
// TODO: implement in Commit 5 (migrate users).
