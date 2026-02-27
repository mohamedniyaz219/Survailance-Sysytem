import nodemailer from 'nodemailer';

let cachedTransporter = null;

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

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'Responder account created',
    text: `Hello ${name},\n\nYour responder account has been created for ${businessCode}.\nTemporary Password: ${temporaryPassword}\n\nPlease login and change your password immediately.`,
    html: `
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your responder account has been created for <strong>${businessCode}</strong>.</p>
      <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      <p>Please login and change your password immediately.</p>
    `
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

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    cc: notifyCc,
    subject: 'Organization registration successful',
    text: `Hello ${adminName},\n\nYour organization has been created successfully.\nOrganization: ${businessName}\nBusiness Code: ${businessCode}\n\nYou can now login and start managing responders, cameras, and incidents.`,
    html: `
      <p>Hello <strong>${adminName}</strong>,</p>
      <p>Your organization has been created successfully.</p>
      <p><strong>Organization:</strong> ${businessName}<br/><strong>Business Code:</strong> ${businessCode}</p>
      <p>You can now login and start managing responders, cameras, and incidents.</p>
    `
  });

  return { skipped: false };
}
