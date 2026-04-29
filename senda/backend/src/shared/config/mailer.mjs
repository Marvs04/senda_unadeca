import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SENDER_NAME = 'SENDA-Lab',
  SMTP_FROM,
} = process.env;

const FROM_ADDRESS = SMTP_FROM ?? SMTP_USER;

let _transporter = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: Number(SMTP_PORT) === 465,
      requireTLS: Number(SMTP_PORT) !== 465,
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
    from: `"${SMTP_SENDER_NAME}" <${FROM_ADDRESS}>`,
    to,
    subject,
    html,
  });
}

// ────────────────────────────────────────────────────────
// Templates
// ────────────────────────────────────────────────────────

const BASE_STYLE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  max-width: 600px; margin: 0 auto; background: #ffffff;
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
`;
const HEADER_STYLE = `
  background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
  color: #fff; padding: 36px 40px; text-align: center;
`;
const BODY_STYLE = `
  background: #fff; padding: 40px;
`;
const FOOTER_STYLE = `
  background: #f8f9fa; padding: 20px 40px; text-align: center;
  font-size: 12px; color: #80868b; border-top: 1px solid #e8eaed;
`;
const BOX_STYLE = `
  background: #f0f7ff; border: 1px solid #c2d9f8;
  padding: 20px 24px; margin: 24px 0; border-radius: 12px;
`;
const BTN_STYLE = `
  display: inline-block; background: #1a73e8; color: #ffffff !important;
  text-decoration: none; padding: 14px 36px; border-radius: 50px;
  font-size: 15px; font-weight: 700; letter-spacing: 0.3px;
  margin: 8px 0;
`;

function wrap(content) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SENDA</title>
</head>
<body style="margin:0;padding:24px 16px;background:#e8eaed;">
  <div style="${BASE_STYLE}">
    <div style="${HEADER_STYLE}">
      <div style="font-size:32px;font-weight:900;letter-spacing:3px;margin-bottom:6px;">SENDA</div>
      <div style="font-size:12px;opacity:.80;letter-spacing:0.5px;">Sistema de Estadías y Notas Departamentales Automatizado</div>
      <div style="margin-top:12px;width:40px;height:3px;background:rgba(255,255,255,.4);border-radius:2px;display:inline-block;"></div>
    </div>
    <div style="${BODY_STYLE}">${content}</div>
    <div style="${FOOTER_STYLE}">
      <p style="margin:0 0 4px;">Este es un correo automático — por favor no respondas a este mensaje.</p>
      <p style="margin:0;">&copy; ${new Date().getFullYear()} UNADECA &mdash; SENDA-Lab</p>
    </div>
  </div>
</body>
</html>`;
}

// ── 1. Bienvenida (cuenta nueva con credenciales) ──────
export async function sendWelcome({ to, name, identifier, password }) {
  const siteUrl = process.env.SITE_URL ?? 'https://senda.rlp.lat';

  const html = wrap(`
    <h2 style="color:#1a73e8;margin:0 0 8px;font-size:22px;">¡Bienvenido/a, ${name}!</h2>
    <p style="color:#5f6368;margin:0 0 24px;font-size:14px;line-height:1.6;">Tu cuenta en <strong>SENDA</strong> ha sido creada exitosamente. A continuación tus credenciales de acceso:</p>
    <div style="${BOX_STYLE}">
      <p style="margin:0 0 10px;font-size:13px;"><span style="color:#5f6368;">Usuario / Identificador:</span>&nbsp;&nbsp;<strong style="font-family:monospace;font-size:15px;color:#1a73e8;">${identifier}</strong></p>
      <p style="margin:0;font-size:13px;"><span style="color:#5f6368;">Contraseña temporal:</span>&nbsp;&nbsp;<strong style="font-family:monospace;font-size:15px;color:#1a73e8;">${password}</strong></p>
    </div>
    <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:14px 18px;margin:0 0 28px;font-size:13px;color:#795548;">
      <strong>⚠️ Por seguridad</strong>, se te pedirá que cambies tu contraseña en tu primer inicio de sesión.
    </div>
    <div style="text-align:center;">
      <a href="${siteUrl}" style="${BTN_STYLE}">Ingresar a SENDA</a>
    </div>
  `);

  await send({ to, subject: '¡Bienvenido/a a SENDA! — Credenciales de acceso', html });
}

// ── 2. Contraseña reseteada por administrador ──────────
export async function sendPasswordReset({ to, name, identifier, newPassword, resetBy }) {
  const siteUrl = process.env.SITE_URL ?? 'https://senda.rlp.lat';
  const html = wrap(`
    <h2 style="color:#1a73e8;margin:0 0 8px;font-size:22px;">Contraseña actualizada</h2>
    <p style="color:#5f6368;margin:0 0 24px;font-size:14px;line-height:1.6;">Hola <strong>${name}</strong>, tu contraseña en SENDA ha sido restablecida por un administrador.</p>
    <div style="${BOX_STYLE}">
      <p style="margin:0 0 10px;font-size:13px;"><span style="color:#5f6368;">Usuario / Identificador:</span>&nbsp;&nbsp;<strong style="font-family:monospace;font-size:15px;color:#1a73e8;">${identifier}</strong></p>
      <p style="margin:0 0 10px;font-size:13px;"><span style="color:#5f6368;">Nueva contraseña:</span>&nbsp;&nbsp;<strong style="font-family:monospace;font-size:15px;color:#1a73e8;">${newPassword}</strong></p>
      ${resetBy ? `<p style="margin:0;font-size:13px;"><span style="color:#5f6368;">Restablecida por:</span>&nbsp;&nbsp;<strong>${resetBy}</strong></p>` : ''}
    </div>
    <div style="background:#fce8e6;border:1px solid #f5c6c2;border-radius:10px;padding:14px 18px;margin:0 0 28px;font-size:13px;color:#c62828;">
      <strong>⚠️</strong> Si no reconoces esta acción, contacta inmediatamente al administrador del sistema.
    </div>
    <div style="text-align:center;">
      <a href="${siteUrl}" style="${BTN_STYLE}">Ingresar a SENDA</a>
    </div>
  `);

  await send({ to, subject: 'SENDA — Tu contraseña ha sido restablecida', html });
}

// ── 3. Cuenta desactivada ──────────────────────────────
export async function sendAccountDeactivated({ to, name }) {
  const html = wrap(`
    <h2 style="color:#d93025;margin:0 0 8px;font-size:22px;">Cuenta desactivada</h2>
    <p style="color:#5f6368;margin:0 0 16px;font-size:14px;line-height:1.6;">Hola <strong>${name}</strong>, tu cuenta en SENDA ha sido <strong>desactivada</strong>.</p>
    <p style="color:#5f6368;font-size:14px;line-height:1.6;margin:0;">No podrás iniciar sesión hasta que tu cuenta sea reactivada por un administrador. Si crees que esto es un error, comunícate con tu administrador.</p>
  `);

  await send({ to, subject: 'SENDA — Tu cuenta ha sido desactivada', html });
}

// ── 4. Cuenta reactivada ───────────────────────────────
export async function sendAccountActivated({ to, name }) {
  const siteUrl = process.env.SITE_URL ?? 'https://senda.rlp.lat';
  const html = wrap(`
    <h2 style="color:#188038;margin:0 0 8px;font-size:22px;">Cuenta reactivada</h2>
    <p style="color:#5f6368;margin:0 0 28px;font-size:14px;line-height:1.6;">Hola <strong>${name}</strong>, tu cuenta en SENDA ha sido <strong>reactivada</strong>. Ya puedes ingresar al sistema con tu usuario y contraseña habituales.</p>
    <div style="text-align:center;">
      <a href="${siteUrl}" style="${BTN_STYLE}">Ingresar a SENDA</a>
    </div>
  `);

  await send({ to, subject: 'SENDA — Tu cuenta ha sido reactivada', html });
}
