import { z } from "zod";
import { setItemDone } from "@/lib/db";

const Body = z.object({ done: z.boolean() });

// Authorised by possession of the item id, which only appears on the application's private page.
export async function PATCH(request: Request, ctx: RouteContext<"/api/items/[itemId]">) {
  const { itemId } = await ctx.params;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "invalid_input" }, { status: 400 });

  const item = await setItemDone(itemId, body.data.done);
  if (!item) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ id: item.id, done: item.done });
}
