import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";

type Email = { subject: string; html: string; text: string };

let smtp: Transporter | null = null;

// Your own mailbox over SMTP (e.g. Gmail with an app password) when SMTP_HOST is set; Resend otherwise.
function getSmtp() {
  if (!process.env.SMTP_HOST) return null;
  smtp ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return smtp;
}

export async function sendEmail(to: string, email: Email): Promise<string> {
  const transport = getSmtp();
  if (transport) {
    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    return info.messageId;
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("No email provider configured: set SMTP_* or RESEND_API_KEY");
  const { data, error } = await new Resend(key).emails.send({
    from: process.env.EMAIL_FROM || "ApplyReady <onboarding@resend.dev>",
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  if (error) throw new Error(error.message);
  return data!.id;
}
