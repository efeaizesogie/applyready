import { z } from "zod";
import { fetchAnnouncement } from "@/lib/fetchPage";

const Body = z.object({ url: z.string().url() });

export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "invalid_input", message: "That doesn't look like a link." }, { status: 400 });

  const result = await fetchAnnouncement(body.data.url);
  if (!result.ok) {
    // 200 with blocked: true — a blocked page is an expected outcome, not a server error.
    return Response.json({ blocked: true, reason: result.reason });
  }
  return Response.json({ blocked: false, text: result.text, title: result.title });
}
