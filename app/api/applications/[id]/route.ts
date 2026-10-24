import { addDays } from "date-fns";
import { z } from "zod";
import { markSubmitted } from "@/lib/db";

const Body = z.object({
  status: z.literal("submitted"),
  followUpDays: z.number().int().min(1).max(90).nullable(),
});

// Mark as submitted: daily reminders stop; optionally schedule one follow-up reminder.
export async function PATCH(request: Request, ctx: RouteContext<"/api/applications/[id]">) {
  const { id } = await ctx.params;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "invalid_input", message: body.error.issues[0].message }, { status: 400 });

  const followUpAt = body.data.followUpDays ? addDays(new Date(), body.data.followUpDays).toISOString() : null;
  const app = await markSubmitted(id, followUpAt);
  if (!app) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ status: app.status, submittedAt: app.submitted_at, followUpAt: app.follow_up_at });
}
