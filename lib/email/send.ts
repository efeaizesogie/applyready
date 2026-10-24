import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";

type Email = { subject: string; html: string; text: string };
// Recurring mail (daily reminders, follow-ups) carries a List-Unsubscribe header, which Gmail and Yahoo expect from bulk senders.
type Options = { unsubscribeUrl?: string };

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

export async function sendEmail(to: string, email: Email, options: Options = {}): Promise<string> {
  const headers: Record<string, string> = options.unsubscribeUrl
    ? { "List-Unsubscribe": `<${options.unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
    : {};
  const transport = getSmtp();
  if (transport) {
    // Mail providers only let you send from the account you log in with, so the address is always
    // SMTP_USER; the display name comes from EMAIL_FROM ("ApplyReady <…>") and defaults to ApplyReady.
    const name = process.env.EMAIL_FROM?.split("<")[0].trim().replace(/^"|"$/g, "") || "ApplyReady";
    const info = await transport.sendMail({
      from: { name, address: process.env.SMTP_USER! },
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      headers,
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
    headers,
  });
  if (error) throw new Error(error.message);
  return data!.id;
}
