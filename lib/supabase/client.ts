import { createBrowserClient } from "@supabase/ssr";

// Browser client: used to request the magic link, so the PKCE verifier cookie is set in this browser.
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
