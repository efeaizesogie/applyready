import "server-only";
import { Resend } from "resend";

export async function sendEmail(to: string, email: { subject: string; html: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
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
