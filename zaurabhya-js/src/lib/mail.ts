import nodemailer, { type Transporter } from "nodemailer";

function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD,
  );
}

let transporter: Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderRecord(record: Record<string, unknown>) {
  return Object.entries(record)
    .map(
      ([key, value]) =>
        `<tr><td style="padding:6px 16px;font-weight:600;color:#1a1a1a;border-bottom:1px solid #eee">${escapeHtml(key)}</td><td style="padding:6px 16px;color:#1a1a1a;border-bottom:1px solid #eee">${escapeHtml(String(value))}</td></tr>`,
    )
    .join("");
}

export async function sendLeadNotification(
  subject: string,
  record: Record<string, unknown>,
) {
  if (!isMailConfigured()) {
    console.warn(`SMTP not configured; skipping email notification: ${subject}`);
    return;
  }

  const recipient = process.env.WHOLESALE_NOTIFICATION_EMAIL || process.env.SMTP_USER!;

  try {
    await getTransporter().sendMail({
      from: `"ZAURABHYA Website" <${process.env.SMTP_USER}>`,
      to: recipient,
      subject,
      html: `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">${renderRecord(record)}</table>`,
    });
  } catch (err) {
    console.error(`Failed to send lead notification email (${subject}):`, err);
  }
}

const ALERT_EMAIL = process.env.ALERT_NOTIFICATION_EMAIL || "lscctony@gmail.com";

export async function sendErrorAlert(subject: string, record: Record<string, unknown>) {
  if (!isMailConfigured()) {
    console.warn(`SMTP not configured; skipping error alert: ${subject}`);
    return;
  }

  try {
    await getTransporter().sendMail({
      from: `"ZAURABHYA Website" <${process.env.SMTP_USER}>`,
      to: ALERT_EMAIL,
      subject: `[ZAURABHYA Alert] ${subject}`,
      html: `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">${renderRecord(record)}</table>`,
    });
  } catch (err) {
    console.error(`Failed to send error alert email (${subject}):`, err);
  }
}

export async function sendAutoReply(to: string, name: string, message: string) {
  if (!isMailConfigured()) {
    console.warn(`SMTP not configured; skipping auto-reply to ${to}`);
    return;
  }

  try {
    await getTransporter().sendMail({
      from: `"ZAURABHYA" <${process.env.SMTP_USER}>`,
      to,
      subject: "We've received your enquiry - ZAURABHYA",
      html: `<div style="font-family:sans-serif;font-size:15px;color:#1a1a1a;line-height:1.6">
        <p>Hi ${escapeHtml(name)},</p>
        <p>${escapeHtml(message)}</p>
        <p>Our team typically responds within 24 hours.</p>
        <p>Thanks,<br/>ZAURABHYA Team</p>
      </div>`,
    });
  } catch (err) {
    console.error(`Failed to send auto-reply to ${to}:`, err);
  }
}
