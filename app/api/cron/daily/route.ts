import { format } from "date-fns";
import { applicationsDueFollowUp, applicationsDueReminder, stampApplication } from "@/lib/db";
import { followUpEmail, reminderEmail, unsubscribeUrl } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";

// Vercel Cron calls this once a day (vercel.json) with `Authorization: Bearer $CRON_SECRET`.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const appUrl = process.env.APP_URL || new URL(request.url).origin;
  const result = { reminders: { sent: 0, failed: 0 }, followUps: { sent: 0, failed: 0 } };

  // Each send is independent: one bad address must not stop everyone else's reminder.
  for (const app of await applicationsDueReminder(today)) {
    try {
      await sendEmail(app.email!, reminderEmail(app, today, appUrl), { unsubscribeUrl: unsubscribeUrl(appUrl, app.id) });
      await stampApplication(app.id, { last_reminder_at: now.toISOString() });
      result.reminders.sent++;
    } catch (err) {
      console.error(`[cron] reminder failed for ${app.id}:`, (err as Error).message);
      result.reminders.failed++;
    }
  }

  for (const app of await applicationsDueFollowUp(now.toISOString())) {
    try {
      await sendEmail(app.email!, followUpEmail(app, appUrl), { unsubscribeUrl: unsubscribeUrl(appUrl, app.id) });
      await stampApplication(app.id, { follow_up_sent: true });
      result.followUps.sent++;
    } catch (err) {
      console.error(`[cron] follow-up failed for ${app.id}:`, (err as Error).message);
      result.followUps.failed++;
    }
  }

  return Response.json(result);
}
