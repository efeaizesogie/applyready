import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { magicLinkEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";

const Body = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  claim: z.string().uuid().nullish(),
});

// One link per email per minute, so this endpoint can't be used to flood someone's inbox.
// In-memory is enough for a single-region proof of concept.
const COOLDOWN_MS = 60_000;
const lastSent = new Map<string, number>();

/**
 * Supabase generates the one-time token (and creates the user if needed); we email the link ourselves.
 * That sidesteps Supabase's built-in mailer rate limit, and because the link carries a token hash
 * rather than a PKCE code, it works in any browser.
 */
export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "invalid_input", message: body.error.issues[0].message }, { status: 400 });
  const { email, claim } = body.data;

  const wait = (lastSent.get(email) ?? 0) + COOLDOWN_MS - Date.now();
  if (wait > 0) {
    return Response.json(
      { error: "cooldown", message: `We just sent a link to that address. Try again in ${Math.ceil(wait / 1000)}s.` },
      { status: 429 },
    );
  }

  const { data, error } = await createAdminClient().auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) {
    console.error("[magic-link] generateLink failed:", error?.message);
    return Response.json({ error: "link_failed", message: "Couldn't create a sign-in link — try again." }, { status: 502 });
  }

  const appUrl = process.env.APP_URL || new URL(request.url).origin;
  const link = new URL("/auth/confirm", appUrl);
  link.searchParams.set("token_hash", data.properties.hashed_token);
  if (claim) link.searchParams.set("claim", claim);

  try {
    await sendEmail(email, magicLinkEmail(link.toString()));
  } catch (err) {
    return Response.json({ error: "send_failed", message: `Couldn't send the email: ${(err as Error).message}` }, { status: 502 });
  }
  lastSent.set(email, Date.now());
  return Response.json({ sent: true });
}
