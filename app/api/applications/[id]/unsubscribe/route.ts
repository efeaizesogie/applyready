import { setRemindersEnabled } from "@/lib/db";

// Target of the List-Unsubscribe header (one-click POST from the mail client) and the footer link (GET).
// Holding the application id is enough: the worst a link-holder can do is stop reminders.
async function unsubscribe(ctx: RouteContext<"/api/applications/[id]/unsubscribe">) {
  const { id } = await ctx.params;
  return setRemindersEnabled(id, false);
}

export async function POST(_request: Request, ctx: RouteContext<"/api/applications/[id]/unsubscribe">) {
  const ok = await unsubscribe(ctx);
  return Response.json({ unsubscribed: ok }, { status: ok ? 200 : 404 });
}

export async function GET(request: Request, ctx: RouteContext<"/api/applications/[id]/unsubscribe">) {
  const { id } = await ctx.params;
  const ok = await unsubscribe(ctx);
  const back = new URL(`/a/${id}`, request.url).toString();
  const html = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reminders stopped</title>
<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#F1EDE5;color:#212227;font-family:system-ui,sans-serif">
<div style="max-width:420px;padding:24px;text-align:center">
<h1 style="font-size:20px;margin:0 0 8px">${ok ? "Reminders stopped" : "Application not found"}</h1>
<p style="color:#6A655E;margin:0 0 16px">${ok ? "You won't get daily emails for this application any more. You can turn them back on from its page." : "It may have been deleted."}</p>
${ok ? `<a href="${back}" style="color:#601E1D">Open the application</a>` : ""}
</div></body>`;
  return new Response(html, { status: ok ? 200 : 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
