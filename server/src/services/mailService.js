import nodemailer from 'nodemailer';

let cachedTransporter = null;

const EMAIL_THEME = {
  bg: '#f4f2f0',
  surface: '#ffffff',
  panel: '#f5f2f0',
  border: '#eae5e1',
  title: '#1e1915',
  text: '#504c49',
  muted: '#766556',
  accent: '#694a30',
  accentSoft: '#efe5dc',
  valueBg: '#f9f2ec',
  valueBorder: '#e7c9b1',
  valueText: '#3b332b'
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildInfoRows(items) {
  return items
    .map(
      ({ label, value }) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_THEME.border}; width: 40%; color: ${EMAIL_THEME.muted}; font-size: 14px;">${escapeHtml(label)}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_THEME.border}; width: 60%; color: ${EMAIL_THEME.valueText}; font-size: 14px; font-weight: 600;">${escapeHtml(value)}</td>
        </tr>
      `
    )
    .join('');
}

function buildEmailTemplate({
  preheader,
  title,
  subtitle,
  greetingName,
  intro,
  infoRowsHtml,
  highlightLabel,
  highlightValue,
  footerNote
}) {
  const year = new Date().getFullYear();

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin: 0; padding: 0; background: ${EMAIL_THEME.bg}; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${EMAIL_THEME.text};">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">${escapeHtml(preheader)}</div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: ${EMAIL_THEME.bg}; padding: 24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; background: ${EMAIL_THEME.surface}; border: 1px solid ${EMAIL_THEME.border}; border-radius: 14px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px 28px; background: linear-gradient(140deg, ${EMAIL_THEME.accentSoft} 0%, #ffffff 75%); border-bottom: 1px solid ${EMAIL_THEME.border};">
                    <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: ${EMAIL_THEME.accent}; font-weight: 700;">Surveillance.io</p>
                    <h1 style="margin: 8px 0 0; font-size: 24px; line-height: 1.35; color: ${EMAIL_THEME.title};">${escapeHtml(title)}</h1>
                    <p style="margin: 8px 0 0; font-size: 14px; line-height: 1.6; color: ${EMAIL_THEME.muted};">${escapeHtml(subtitle)}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 24px 28px 10px;">
                    <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.6; color: ${EMAIL_THEME.text};">Hello <strong>${escapeHtml(greetingName)}</strong>,</p>
                    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.65; color: ${EMAIL_THEME.text};">${escapeHtml(intro)}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 0 28px 10px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">${infoRowsHtml}</table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 12px 28px 0;">
                    <div style="background: ${EMAIL_THEME.valueBg}; border: 1px solid ${EMAIL_THEME.valueBorder}; border-radius: 10px; padding: 14px;">
                      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: ${EMAIL_THEME.muted}; font-weight: 700;">${escapeHtml(highlightLabel)}</p>
                      <p style="margin: 8px 0 0; font-size: 18px; color: ${EMAIL_THEME.valueText}; font-weight: 700;">${escapeHtml(highlightValue)}</p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 16px 28px 24px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${EMAIL_THEME.muted};">${escapeHtml(footerNote)}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 16px 28px; border-top: 1px solid ${EMAIL_THEME.border}; background: ${EMAIL_THEME.panel};">
                    <p style="margin: 0; font-size: 12px; color: ${EMAIL_THEME.muted};">© ${year} Surveillance.io</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.MAIL_FROM
  );
}

function getTransporter() {
  if (!isMailConfigured()) return null;

  if (!cachedTransporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true',
      ...(smtpUser && smtpPass
        ? {
            auth: {
              user: smtpUser,
              pass: smtpPass
            }
          }
        : {})
    });
  }

  return cachedTransporter;
}

export async function sendResponderWelcomeEmail({ to, name, businessCode, temporaryPassword }) {
  const transporter = getTransporter();

  if (!transporter) {
    return { skipped: true, reason: 'SMTP not configured' };
  }

  const infoRowsHtml = buildInfoRows([
    { label: 'Organization Code', value: businessCode },
    { label: 'Responder Email', value: to }
  ]);

  const html = buildEmailTemplate({
    preheader: `Responder account created for ${businessCode}`,
    title: 'Responder Account Created',
    subtitle: 'Your access has been provisioned successfully.',
    greetingName: name,
    intro: 'Your responder account is now active. Use the temporary password below to sign in and complete setup.',
    infoRowsHtml,
    highlightLabel: 'Temporary Password',
    highlightValue: temporaryPassword,
    footerNote: 'For security, change this password immediately after your first login.'
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'Responder account created',
    text: `Hello ${name},\n\nYour responder account has been created for ${businessCode}.\nTemporary Password: ${temporaryPassword}\n\nPlease login and change your password immediately.`,
    html
  });

  return { skipped: false };
}

export async function sendOrganizationRegistrationEmail({
  to,
  adminName,
  businessName,
  businessCode
}) {
  const transporter = getTransporter();

  if (!transporter) {
    return { skipped: true, reason: 'SMTP not configured' };
  }

  const notifyCc = process.env.MAIL_NOTIFY_ORG_REGISTRATION_TO || undefined;

  const infoRowsHtml = buildInfoRows([
    { label: 'Organization', value: businessName },
    { label: 'Business Code', value: businessCode },
    { label: 'Admin Email', value: to }
  ]);

  const html = buildEmailTemplate({
    preheader: `Organization ${businessName} registered successfully`,
    title: 'Registration Successful',
    subtitle: 'Your organization is now ready to use the platform.',
    greetingName: adminName,
    intro: 'Your organization has been created successfully. You can now sign in and start managing responders, cameras, and incidents.',
    infoRowsHtml,
    highlightLabel: 'Business Code',
    highlightValue: businessCode,
    footerNote: 'Keep your business code safe and share it only with authorized team members.'
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    cc: notifyCc,
    subject: 'Organization registration successful',
    text: `Hello ${adminName},\n\nYour organization has been created successfully.\nOrganization: ${businessName}\nBusiness Code: ${businessCode}\n\nYou can now login and start managing responders, cameras, and incidents.`,
    html
  });

  return { skipped: false };
}
