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

// ─────────────────────────────────────────────────────────────────────
// Design tokens — inspirados en la UI del sistema (azul institucional)
// ─────────────────────────────────────────────────────────────────────
const COLOR = {
  primary:      '#1a3a6b',   // azul oscuro institucional
  primaryLight: '#2563a8',
  accent:       '#f59e0b',   // ámbar dorado — toque académico
  success:      '#15803d',
  danger:       '#b91c1c',
  warn:         '#92400e',
  textMain:     '#1e293b',
  textSub:      '#64748b',
  textMuted:    '#94a3b8',
  bgPage:       '#f1f5f9',
  bgCard:       '#ffffff',
  bgInfo:       '#eff6ff',
  borderInfo:   '#bfdbfe',
  bgWarn:       '#fffbeb',
  borderWarn:   '#fde68a',
  bgDanger:     '#fef2f2',
  borderDanger: '#fecaca',
  bgSuccess:    '#f0fdf4',
  borderSuccess:'#bbf7d0',
  divider:      '#e2e8f0',
};

// Fuente con fallback seguro para clientes de correo
const FONT = `'Georgia', 'Times New Roman', serif`;
const FONT_SANS = `'Helvetica Neue', Arial, sans-serif`;

function wrap(content, accentColor = COLOR.primary) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SENDA</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${COLOR.bgPage};font-family:${FONT_SANS};">

  <!-- Page wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.bgPage};padding:32px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${COLOR.bgCard};border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(15,23,42,0.10);">

        <!-- ── Header ── -->
        <tr>
          <td style="background:linear-gradient(150deg, ${COLOR.primary} 0%, ${COLOR.primaryLight} 100%);padding:0;">

            <!-- Accent bar top -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="height:4px;background:linear-gradient(90deg,${COLOR.accent} 0%,#fbbf24 50%,${COLOR.accent} 100%);"></td>
              </tr>
            </table>

            <!-- Logo row -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:32px 40px 28px;">

                  <!-- Logo badge + wordmark -->
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <!-- Icon badge -->
                      <td style="vertical-align:middle;padding-right:16px;">
                        <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.30);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;">
                          <span style="font-family:${FONT};font-size:20px;font-weight:700;color:#fff;letter-spacing:1px;line-height:48px;display:block;text-align:center;width:48px;">S</span>
                        </div>
                      </td>
                      <!-- Wordmark -->
                      <td style="vertical-align:middle;">
                        <div style="font-family:${FONT};font-size:28px;font-weight:700;color:#ffffff;letter-spacing:4px;line-height:1;">SENDA</div>
                        <div style="font-family:${FONT_SANS};font-size:10px;color:rgba(255,255,255,0.65);letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;">Sistema Académico · UNADECA</div>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- Divider line -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:0 40px;">
                  <div style="height:1px;background:rgba(255,255,255,0.15);"></div>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- ── Body ── -->
        <tr>
          <td style="padding:40px 40px 32px;color:${COLOR.textMain};">
            ${content}
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid ${COLOR.divider};padding:24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-family:${FONT_SANS};font-size:11px;color:${COLOR.textMuted};line-height:1.7;">
                  <p style="margin:0 0 4px;">Este es un mensaje automático generado por SENDA — por favor no respondas a este correo.</p>
                  <p style="margin:0;">Para asistencia, contacta a tu coordinador académico o al administrador del sistema.</p>
                </td>
                <td align="right" style="vertical-align:bottom;padding-left:16px;">
                  <div style="font-family:${FONT};font-size:13px;font-weight:700;color:${COLOR.primary};letter-spacing:2px;white-space:nowrap;">SENDA &copy; ${new Date().getFullYear()}</div>
                  <div style="font-family:${FONT_SANS};font-size:10px;color:${COLOR.textMuted};letter-spacing:0.5px;">UNADECA · SENDA-Lab</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td></tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// Helpers compartidos
// ─────────────────────────────────────────────

function credentialBox(items) {
  const rows = items.map(({ label, value }) => `
    <tr>
      <td style="padding:10px 20px;font-family:${FONT_SANS};font-size:12px;color:${COLOR.textSub};white-space:nowrap;border-bottom:1px solid ${COLOR.divider};">${label}</td>
      <td style="padding:10px 20px;font-family:'Courier New', Courier, monospace;font-size:15px;color:${COLOR.primary};font-weight:700;border-bottom:1px solid ${COLOR.divider};">${value}</td>
    </tr>
  `).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.bgInfo};border:1px solid ${COLOR.borderInfo};border-radius:12px;overflow:hidden;margin:24px 0;">
      <tr>
        <td colspan="2" style="padding:12px 20px;background:${COLOR.primary};">
          <span style="font-family:${FONT_SANS};font-size:10px;font-weight:700;color:rgba(255,255,255,0.85);letter-spacing:1.5px;text-transform:uppercase;">Credenciales de acceso</span>
        </td>
      </tr>
      ${rows}
    </table>`;
}

function alertBox({ color, borderColor, bg, icon = '', title, body }) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bg};border-left:4px solid ${borderColor};border-radius:0 8px 8px 0;margin:0 0 28px;">
      <tr>
        <td style="padding:14px 18px;">
          <span style="font-family:${FONT_SANS};font-size:13px;color:${color};">
            <strong>${icon} ${title}</strong><br>
            <span style="font-weight:400;">${body}</span>
          </span>
        </td>
      </tr>
    </table>`;
}

function ctaButton(label, url) {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 0;">
      <tr>
        <td align="center" style="background:${COLOR.primary};border-radius:50px;padding:0;">
          <a href="${url}" style="display:inline-block;font-family:${FONT_SANS};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;padding:14px 40px;letter-spacing:0.5px;">${label} &rarr;</a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top:10px;">
          <span style="font-family:${FONT_SANS};font-size:11px;color:${COLOR.textMuted};">${url}</span>
        </td>
      </tr>
    </table>`;
}

function sectionDivider() {
  return `<div style="height:1px;background:${COLOR.divider};margin:28px 0;"></div>`;
}

// ─────────────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────────────

// ── 1. Bienvenida ──────────────────────────────────────────────────
export async function sendWelcome({ to, name, identifier, password }) {
  const siteUrl = process.env.SITE_URL ?? 'https://senda.rlp.lat';

  const html = wrap(`
    <!-- Greeting -->
    <h1 style="font-family:${FONT};font-size:26px;font-weight:700;color:${COLOR.primary};margin:0 0 6px;letter-spacing:0.5px;">¡Bienvenido/a, ${name}!</h1>
    <p style="font-family:${FONT_SANS};font-size:14px;color:${COLOR.textSub};margin:0 0 28px;line-height:1.7;">Tu cuenta en el <strong>Sistema de Estadías y Notas Departamentales Automatizado</strong> ha sido creada exitosamente. A continuación encontrarás tus credenciales para el primer acceso.</p>

    ${credentialBox([
      { label: 'Usuario / Carnet', value: identifier },
      { label: 'Contraseña temporal', value: password },
    ])}

    ${alertBox({
      color: COLOR.warn,
      borderColor: COLOR.accent,
      bg: COLOR.bgWarn,
      icon: '⚠️',
      title: 'Contraseña temporal',
      body: 'Al iniciar sesión por primera vez se te solicitará establecer una contraseña segura. Guarda tus credenciales en un lugar privado.',
    })}

    ${sectionDivider()}

    <p style="font-family:${FONT_SANS};font-size:13px;color:${COLOR.textSub};margin:0;line-height:1.7;">Si tienes dudas sobre el uso del sistema, comunícate con el coordinador de tu departamento académico.</p>

    ${ctaButton('Ingresar a SENDA', siteUrl)}
  `);

  await send({ to, subject: 'SENDA — Bienvenido/a: tus credenciales de acceso', html });
}

// ── 2. Contraseña reseteada por administrador ──────────────────────
export async function sendPasswordReset({ to, name, identifier, newPassword, resetBy }) {
  const siteUrl = process.env.SITE_URL ?? 'https://senda.rlp.lat';

  const extraRow = resetBy ? [{ label: 'Restablecida por', value: resetBy }] : [];

  const html = wrap(`
    <h1 style="font-family:${FONT};font-size:26px;font-weight:700;color:${COLOR.primary};margin:0 0 6px;letter-spacing:0.5px;">Contraseña restablecida</h1>
    <p style="font-family:${FONT_SANS};font-size:14px;color:${COLOR.textSub};margin:0 0 28px;line-height:1.7;">Hola <strong>${name}</strong>, un administrador ha restablecido la contraseña de tu cuenta en SENDA. Utiliza las credenciales a continuación para ingresar al sistema.</p>

    ${credentialBox([
      { label: 'Usuario / Carnet', value: identifier },
      { label: 'Nueva contraseña', value: newPassword },
      ...extraRow,
    ])}

    ${alertBox({
      color: COLOR.danger,
      borderColor: '#ef4444',
      bg: COLOR.bgDanger,
      icon: '🔒',
      title: '¿No reconoces esta acción?',
      body: 'Si no solicitaste este cambio, comunícate de inmediato con el administrador del sistema para proteger tu cuenta.',
    })}

    ${sectionDivider()}

    <p style="font-family:${FONT_SANS};font-size:13px;color:${COLOR.textSub};margin:0;line-height:1.7;">Te recomendamos cambiar tu contraseña nuevamente desde la configuración de tu perfil una vez que hayas iniciado sesión.</p>

    ${ctaButton('Ingresar a SENDA', siteUrl)}
  `);

  await send({ to, subject: 'SENDA — Tu contraseña ha sido restablecida', html });
}

// ── 3. Cuenta desactivada ──────────────────────────────────────────
export async function sendAccountDeactivated({ to, name }) {
  const html = wrap(`
    <!-- Status icon -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td style="width:48px;height:48px;background:${COLOR.bgDanger};border-radius:50%;text-align:center;vertical-align:middle;font-size:22px;line-height:48px;">🚫</td>
        <td style="padding-left:16px;vertical-align:middle;">
          <h1 style="font-family:${FONT};font-size:24px;font-weight:700;color:${COLOR.danger};margin:0;letter-spacing:0.5px;">Cuenta desactivada</h1>
        </td>
      </tr>
    </table>

    <p style="font-family:${FONT_SANS};font-size:14px;color:${COLOR.textSub};margin:0 0 20px;line-height:1.7;">Hola <strong>${name}</strong>, te informamos que tu cuenta en SENDA ha sido <strong>desactivada</strong> temporalmente.</p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fef2f2;border:1px solid ${COLOR.borderDanger};border-radius:12px;margin:0 0 24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="font-family:${FONT_SANS};font-size:13px;color:${COLOR.danger};margin:0 0 8px;font-weight:700;">¿Qué significa esto?</p>
          <ul style="font-family:${FONT_SANS};font-size:13px;color:${COLOR.textSub};margin:0;padding-left:18px;line-height:1.8;">
            <li>No podrás iniciar sesión en el sistema mientras tu cuenta esté inactiva.</li>
            <li>Tus datos y registros se conservan de forma íntegra.</li>
            <li>La cuenta puede ser reactivada en cualquier momento por un administrador.</li>
          </ul>
        </td>
      </tr>
    </table>

    ${sectionDivider()}

    <p style="font-family:${FONT_SANS};font-size:13px;color:${COLOR.textSub};margin:0;line-height:1.7;">Si consideras que esto es un error, comunícate con el coordinador de tu departamento o con el administrador del sistema.</p>
  `);

  await send({ to, subject: 'SENDA — Tu cuenta ha sido desactivada', html });
}

// ── 4. Cuenta reactivada ───────────────────────────────────────────
export async function sendAccountActivated({ to, name }) {
  const siteUrl = process.env.SITE_URL ?? 'https://senda.rlp.lat';

  const html = wrap(`
    <!-- Status icon -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td style="width:48px;height:48px;background:${COLOR.bgSuccess};border-radius:50%;text-align:center;vertical-align:middle;font-size:22px;line-height:48px;">✅</td>
        <td style="padding-left:16px;vertical-align:middle;">
          <h1 style="font-family:${FONT};font-size:24px;font-weight:700;color:${COLOR.success};margin:0;letter-spacing:0.5px;">Cuenta reactivada</h1>
        </td>
      </tr>
    </table>

    <p style="font-family:${FONT_SANS};font-size:14px;color:${COLOR.textSub};margin:0 0 20px;line-height:1.7;">Hola <strong>${name}</strong>, tu cuenta en SENDA ha sido <strong>reactivada</strong> exitosamente. Ya puedes ingresar al sistema con tu usuario y contraseña habituales.</p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.bgSuccess};border:1px solid ${COLOR.borderSuccess};border-radius:12px;margin:0 0 28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="font-family:${FONT_SANS};font-size:13px;color:${COLOR.success};margin:0 0 8px;font-weight:700;">Acceso restaurado</p>
          <p style="font-family:${FONT_SANS};font-size:13px;color:${COLOR.textSub};margin:0;line-height:1.7;">Tienes acceso completo al sistema nuevamente. Si detectas algún inconveniente con tu cuenta o tus registros, comunícate con el administrador.</p>
        </td>
      </tr>
    </table>

    ${sectionDivider()}

    ${ctaButton('Ingresar a SENDA', siteUrl)}
  `);

  await send({ to, subject: 'SENDA — Tu cuenta ha sido reactivada', html });
}