import { addDays } from "date-fns";
import { z } from "zod";
import { deleteApplication, getApplication, markSubmitted } from "@/lib/db";
import { getSessionUser } from "@/lib/supabase/server";

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

// Delete a scan made in error. Unclaimed: the private link is enough. Claimed: only the signed-in owner.
export async function DELETE(_request: Request, ctx: RouteContext<"/api/applications/[id]">) {
  const { id } = await ctx.params;
  const app = await getApplication(id);
  if (!app) return Response.json({ error: "not_found", message: "Application not found." }, { status: 404 });

  if (app.userId) {
    const user = await getSessionUser();
    if (user?.id !== app.userId) {
      return Response.json(
        { error: "forbidden", message: "Sign in with the email this application is linked to before deleting it." },
        { status: 403 },
      );
    }
  }

  await deleteApplication(id);
  return Response.json({ deleted: true });
}
