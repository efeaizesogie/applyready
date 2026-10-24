import { format } from "date-fns";
import { z } from "zod";
import { extractAnnouncement, ExtractionError } from "@/lib/ai/extract";
import { buildPlan } from "@/lib/plan";
import { createApplication } from "@/lib/db";

const Body = z.object({
  text: z.string().trim().min(40, "Paste the full announcement text."),
  sourceUrl: z.string().url().nullish(),
});

export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json({ error: "invalid_input", message: body.error.issues[0].message }, { status: 400 });
  }

  const today = format(new Date(), "yyyy-MM-dd");

  let extraction;
  try {
    extraction = await extractAnnouncement(body.data.text, today);
  } catch (err) {
    if (err instanceof ExtractionError) {
      const message =
        err.code === "unreadable"
          ? "We couldn't read that announcement — try pasting the text again."
          : err.message;
      return Response.json({ error: err.code, message }, { status: err.code === "config" ? 500 : 502 });
    }
    throw err;
  }

  if (!extraction.isApplication) {
    return Response.json(
      {
        error: "not_application",
        message: "This doesn't look like an application or opportunity.",
        reason: extraction.notApplicationReason,
      },
      { status: 422 },
    );
  }

  const plan = buildPlan(extraction.checklist, extraction.deadline, today);
  if (plan.status === "closed") {
    return Response.json(
      { error: "deadline_passed", message: "Deadline passed — this application is closed.", deadline: plan.deadline },
      { status: 422 },
    );
  }

  try {
    const id = await createApplication(extraction, plan, body.data.sourceUrl ?? null);
    return Response.json({ id });
  } catch (err) {
    console.error("[scan] save failed", err);
    return Response.json({ error: "save_failed", message: "We built your plan but couldn't save it. Try again." }, { status: 500 });
  }
}
