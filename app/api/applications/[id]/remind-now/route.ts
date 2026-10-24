import { format } from "date-fns";
import { getApplication } from "@/lib/db";
import { reminderEmail, unsubscribeUrl } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";

// Demo trigger: sends today's reminder immediately using the same builder as the daily cron.
export async function POST(request: Request, ctx: RouteContext<"/api/applications/[id]/remind-now">) {
  const { id } = await ctx.params;
  const app = await getApplication(id);
  if (!app) return Response.json({ error: "not_found", message: "Application not found." }, { status: 404 });
  if (!app.remindersEnabled || !app.email) {
    return Response.json({ error: "not_confirmed", message: "Confirm your email first to turn reminders on." }, { status: 409 });
  }

  const appUrl = process.env.APP_URL || new URL(request.url).origin;
  try {
    const sentId = await sendEmail(app.email, reminderEmail(app, format(new Date(), "yyyy-MM-dd"), appUrl), {
      unsubscribeUrl: unsubscribeUrl(appUrl, app.id),
    });
    return Response.json({ sent: true, id: sentId, to: app.email });
  } catch (err) {
    return Response.json(
      { error: "send_failed", message: `Reminder couldn't be sent: ${(err as Error).message}` },
      { status: 502 },
    );
  }
}
