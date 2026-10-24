import { NextResponse, type NextRequest } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";
import { attachApplicationsByEmail, claimApplication, isUuid } from "@/lib/db";

// Our own magic links land here: verify the one-time token, start the session, then gather the user's applications.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const claim = url.searchParams.get("claim");
  const target = claim && isUuid(claim) ? `/a/${claim}` : "/applications";
  const back = (status: string) => {
    const dest = new URL(target, url.origin);
    dest.searchParams.set("auth", status);
    return NextResponse.redirect(dest);
  };

  if (!tokenHash) return back("missing-code");

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.verifyOtp({ type: "email", token_hash: tokenHash });
  if (error || !data.user?.email) {
    console.warn("[auth] verifyOtp failed:", error?.message);
    return back("link-failed");
  }

  if (claim && isUuid(claim)) {
    const claimed = await claimApplication(claim, data.user.id, data.user.email);
    if (!claimed) return back("claim-failed");
  }
  // Anything previously saved under this email (e.g. from another device) now belongs to this account too.
  await attachApplicationsByEmail(data.user.id, data.user.email);
  return back("confirmed");
}
