/**
 * Email notification service using Nodemailer.
 *
 * Configure via .env:
 *   EMAIL_HOST=smtp.gmail.com
 *   EMAIL_PORT=587
 *   EMAIL_USER=your@gmail.com
 *   EMAIL_PASS=your-app-password        ← Gmail App Password (not your account password)
 *   EMAIL_FROM="IMS Notifications <your@gmail.com>"
 *
 * If EMAIL_HOST is not set the service runs in dry-run mode — it logs the
 * email to the console instead of sending, so development works with no SMTP.
 */

import nodemailer from 'nodemailer';

const DRY_RUN = !process.env.EMAIL_HOST;

let transporter = null;

if (!DRY_RUN) {
  transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   parseInt(process.env.EMAIL_PORT ?? '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

const FROM = process.env.EMAIL_FROM ?? 'IMS Notifications <noreply@internsystem.local>';
const BASE_URL = process.env.APP_URL ?? 'http://localhost:3001';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function send({ to, subject, html }) {
  if (DRY_RUN) {
    console.log('\n📧 [EMAIL DRY-RUN]');
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:    ${html.replace(/<[^>]+>/g, '').trim().slice(0, 200)}…\n`);
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('Failed to send email:', err.message);
  }
}

function card(content) {
  return `
  <!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="background:linear-gradient(135deg,#0d2044,#0e4d7a);padding:24px 32px;">
          <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">Intern Management System</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.5);font-size:12px;">Eullafied Tech Solutions</p>
        </td></tr>
        <tr><td style="padding:32px;">${content}</td></tr>
        <tr><td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">
            © ${new Date().getFullYear()} Eullafied Tech Solutions · This is an automated notification.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
  </body></html>`;
}

function btn(text, url, color = '#1d6fa4') {
  return `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:${color};color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">${text}</a>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Notify an intern that their account has been approved.
 */
export async function notifyInternApproved({ internEmail, firstName, internCode }) {
  await send({
    to: internEmail,
    subject: '✅ Your IMS account has been approved!',
    html: card(`
      <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Welcome, ${firstName}! 🎉</h2>
      <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
        Your intern registration has been <strong style="color:#16a34a;">approved</strong>.
        You can now log in to the Intern Portal and start using the system.
      </p>
      <table style="width:100%;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:16px 0;" cellpadding="8">
        <tr><td style="font-size:12px;color:#15803d;font-weight:600;">Intern Code</td><td style="font-size:13px;font-family:monospace;color:#166534;">${internCode}</td></tr>
        <tr><td style="font-size:12px;color:#15803d;font-weight:600;">Portal</td><td style="font-size:13px;color:#166534;">Intern Portal</td></tr>
      </table>
      ${btn('Sign In to Intern Portal', `${BASE_URL}/intern/login`, '#16a34a')}
    `),
  });
}

/**
 * Notify an intern that their account has been rejected.
 */
export async function notifyInternRejected({ internEmail, firstName }) {
  await send({
    to: internEmail,
    subject: 'Your IMS registration status update',
    html: card(`
      <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Hi ${firstName},</h2>
      <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
        Thank you for registering with the Intern Management System. Unfortunately, your application
        has not been approved at this time.
      </p>
      <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
        If you believe this is a mistake or would like more information, please contact your
        administrator directly.
      </p>
    `),
  });
}

/**
 * Notify an intern that their ticket status has changed.
 */
export async function notifyTicketUpdated({ internEmail, firstName, ticketNumber, ticketTitle, newStatus, resolutionNotes }) {
  const statusLabel = {
    open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed', cancelled: 'Cancelled',
  }[newStatus] ?? newStatus;

  const statusColor = {
    resolved: '#16a34a', closed: '#64748b', cancelled: '#ef4444', in_progress: '#d97706', open: '#1d6fa4',
  }[newStatus] ?? '#1d6fa4';

  await send({
    to: internEmail,
    subject: `Ticket ${ticketNumber} — Status updated to ${statusLabel}`,
    html: card(`
      <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Ticket Update</h2>
      <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
        Hi ${firstName}, your support ticket status has been updated.
      </p>
      <table style="width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:16px 0;" cellpadding="8">
        <tr><td style="font-size:12px;color:#64748b;font-weight:600;">Ticket</td><td style="font-size:13px;font-family:monospace;color:#1e293b;">${ticketNumber}</td></tr>
        <tr><td style="font-size:12px;color:#64748b;font-weight:600;">Title</td><td style="font-size:13px;color:#1e293b;">${ticketTitle}</td></tr>
        <tr><td style="font-size:12px;color:#64748b;font-weight:600;">Status</td>
            <td><span style="background:${statusColor}20;color:${statusColor};font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;">${statusLabel}</span></td></tr>
        ${resolutionNotes ? `<tr><td style="font-size:12px;color:#64748b;font-weight:600;vertical-align:top;">Resolution</td><td style="font-size:13px;color:#1e293b;line-height:1.5;">${resolutionNotes}</td></tr>` : ''}
      </table>
      ${btn('View Ticket', `${BASE_URL}/tickets`, '#1d6fa4')}
    `),
  });
}

/**
 * Notify an admin that a new intern has registered and needs approval.
 */
export async function notifyAdminNewIntern({ adminEmail, internName, internEmail, internCode }) {
  await send({
    to: adminEmail,
    subject: `New intern registration — ${internName}`,
    html: card(`
      <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">New Intern Registration</h2>
      <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
        A new intern has registered and is awaiting your approval.
      </p>
      <table style="width:100%;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin:16px 0;" cellpadding="8">
        <tr><td style="font-size:12px;color:#1d4ed8;font-weight:600;">Name</td><td style="font-size:13px;color:#1e3a8a;">${internName}</td></tr>
        <tr><td style="font-size:12px;color:#1d4ed8;font-weight:600;">Email</td><td style="font-size:13px;color:#1e3a8a;">${internEmail}</td></tr>
        <tr><td style="font-size:12px;color:#1d4ed8;font-weight:600;">Code</td><td style="font-size:13px;font-family:monospace;color:#1e3a8a;">${internCode}</td></tr>
      </table>
      ${btn('Review Application', `${BASE_URL}/admin/interns`, '#1d6fa4')}
    `),
  });
}
