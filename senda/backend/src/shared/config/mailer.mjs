import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SENDER_NAME = 'SENDA-Lab',
} = process.env;

let _transporter = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      tls: { rejectUnauthorized: false },
    });
  }
  return _transporter;
}

async function send({ to, subject, html }) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('[mailer] SMTP no configurado, email omitido:', subject);
    return;
  }
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"${SMTP_SENDER_NAME}" <${SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

// ────────────────────────────────────────────────────────
// Templates
// ────────────────────────────────────────────────────────

const BASE_STYLE = `
  font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;
  background: #f8f9fa; padding: 0; border-radius: 8px; overflow: hidden;
`;
const HEADER_STYLE = `
  background: #1a73e8; color: #fff; padding: 28px 32px; text-align: center;
`;
const BODY_STYLE = `
  background: #fff; padding: 32px;
`;
const FOOTER_STYLE = `
  background: #f1f3f4; padding: 16px 32px; text-align: center;
  font-size: 12px; color: #5f6368;
`;
const BOX_STYLE = `
  background: #f0f4ff; border-left: 4px solid #1a73e8;
  padding: 14px 18px; margin: 20px 0; border-radius: 4px;
`;

function wrap(content) {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:16px;background:#e8eaed;">
  <div style="${BASE_STYLE}">
    <div style="${HEADER_STYLE}">
      <h1 style="margin:0;font-size:24px;letter-spacing:1px;">SENDA</h1>
      <p style="margin:4px 0 0;font-size:13px;opacity:.85;">Sistema de Estadías y Notas Departamentales Automatizado</p>
    </div>
    <div style="${BODY_STYLE}">${content}</div>
    <div style="${FOOTER_STYLE}">
      Este es un correo automático, por favor no respondas a este mensaje.<br>
      &copy; ${new Date().getFullYear()} UNADECA &mdash; SENDA-Lab
    </div>
  </div>
</body>
</html>`;
}

// ── 1. Bienvenida (cuenta nueva con credenciales) ──────
export async function sendWelcome({ to, name, role, identifier, password }) {
  const roleLabel = {
    SUPER_ADMIN: 'Super Administrador',
    ADMIN: 'Administrador',
    DEPT_HEAD: 'Jefe de Departamento',
    ACCOUNTING: 'Contabilidad',
    STUDENT: 'Estudiante',
  }[role] ?? role;

  const html = wrap(`
    <h2 style="color:#1a73e8;margin-top:0;">¡Bienvenido/a a SENDA, ${name}!</h2>
    <p>Tu cuenta ha sido creada exitosamente. A continuación tus credenciales de acceso:</p>
    <div style="${BOX_STYLE}">
      <p style="margin:4px 0;"><strong>Rol:</strong> ${roleLabel}</p>
      <p style="margin:4px 0;"><strong>Usuario / Identificador:</strong> <code>${identifier}</code></p>
      <p style="margin:4px 0;"><strong>Contraseña temporal:</strong> <code>${password}</code></p>
    </div>
    <p style="color:#d93025;font-size:13px;">
      ⚠️ Por seguridad, cambia tu contraseña en tu primer inicio de sesión.
    </p>
    <p>Puedes ingresar al sistema en:</p>
    <p><a href="${process.env.SITE_URL ?? 'https://senda.rlp.lat'}" style="color:#1a73e8;">${process.env.SITE_URL ?? 'https://senda.rlp.lat'}</a></p>
  `);

  await send({ to, subject: '¡Bienvenido/a a SENDA! — Credenciales de acceso', html });
}

// ── 2. Contraseña reseteada por administrador ──────────
export async function sendPasswordReset({ to, name, identifier, newPassword, resetBy }) {
  const html = wrap(`
    <h2 style="color:#1a73e8;margin-top:0;">Contraseña actualizada</h2>
    <p>Hola <strong>${name}</strong>, tu contraseña en SENDA ha sido restablecida por un administrador.</p>
    <div style="${BOX_STYLE}">
      <p style="margin:4px 0;"><strong>Usuario / Identificador:</strong> <code>${identifier}</code></p>
      <p style="margin:4px 0;"><strong>Nueva contraseña:</strong> <code>${newPassword}</code></p>
      ${resetBy ? `<p style="margin:4px 0;"><strong>Restablecida por:</strong> ${resetBy}</p>` : ''}
    </div>
    <p style="color:#d93025;font-size:13px;">
      ⚠️ Si no reconoces esta acción, contacta inmediatamente al administrador del sistema.
    </p>
    <p><a href="${process.env.SITE_URL ?? 'https://senda.rlp.lat'}" style="color:#1a73e8;">Ingresar a SENDA</a></p>
  `);

  await send({ to, subject: 'SENDA — Tu contraseña ha sido restablecida', html });
}

// ── 3. Cuenta desactivada ──────────────────────────────
export async function sendAccountDeactivated({ to, name }) {
  const html = wrap(`
    <h2 style="color:#d93025;margin-top:0;">Cuenta desactivada</h2>
    <p>Hola <strong>${name}</strong>, tu cuenta en SENDA ha sido <strong>desactivada</strong>.</p>
    <p>No podrás iniciar sesión hasta que tu cuenta sea reactivada por un administrador.</p>
    <p>Si crees que esto es un error, comunícate con tu administrador.</p>
  `);

  await send({ to, subject: 'SENDA — Tu cuenta ha sido desactivada', html });
}

// ── 4. Cuenta reactivada ───────────────────────────────
export async function sendAccountActivated({ to, name }) {
  const html = wrap(`
    <h2 style="color:#188038;margin-top:0;">Cuenta reactivada</h2>
    <p>Hola <strong>${name}</strong>, tu cuenta en SENDA ha sido <strong>reactivada</strong>.</p>
    <p>Ya puedes ingresar al sistema con tu usuario y contraseña habituales.</p>
    <p><a href="${process.env.SITE_URL ?? 'https://senda.rlp.lat'}" style="color:#1a73e8;">Ingresar a SENDA</a></p>
  `);

  await send({ to, subject: 'SENDA — Tu cuenta ha sido reactivada', html });
}
