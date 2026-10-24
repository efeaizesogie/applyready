import { NextResponse, type NextRequest } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";
import { claimApplication, isUuid } from "@/lib/db";

// Magic link lands here: swap the one-time code for a session, then attach the application to this email.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const claim = url.searchParams.get("claim");
  const back = (path: string, status?: string) => {
    const dest = new URL(path, url.origin);
    if (status) dest.searchParams.set("auth", status);
    return NextResponse.redirect(dest);
  };
  const target = claim && isUuid(claim) ? `/a/${claim}` : "/applications";

  if (!code) return back(target, "missing-code");

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user?.email) {
    console.warn("[auth] code exchange failed:", error?.message);
    // Most common cause: the link was opened in a different browser than the one that requested it.
    return back(target, "link-failed");
  }

  if (claim && isUuid(claim)) {
    const claimed = await claimApplication(claim, data.user.id, data.user.email);
    if (!claimed) return back(target, "claim-failed");
  }
  return back(target, "confirmed");
}
