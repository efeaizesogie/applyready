"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SectionHeader } from "@/components/ui/Tag";

type Props = {
  applicationId: string;
  confirmedEmail: string | null; // masked, e.g. "e•••@gmail.com"
  authStatus: string | null;
};

const AUTH_MESSAGES: Record<string, { tone: "ok" | "crit"; text: string }> = {
  confirmed: { tone: "ok", text: "Email confirmed — daily reminders are on." },
  "link-failed": { tone: "crit", text: "That link didn't work. Open it in the same browser you requested it from, or send a new one." },
  "claim-failed": { tone: "crit", text: "This application is already linked to a different email." },
  "missing-code": { tone: "crit", text: "That sign-in link was incomplete. Send a new one." },
};

export function ReminderPanel({ applicationId, confirmedEmail, authStatus }: Props) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState<{ tone: "ok" | "crit"; text: string } | null>(
    authStatus ? (AUTH_MESSAGES[authStatus] ?? null) : null,
  );

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setMessage(null);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?claim=${applicationId}` },
    });
    if (error) {
      setState("idle");
      setMessage({ tone: "crit", text: `Couldn't send the link: ${error.message}` });
    } else {
      setState("sent");
    }
  }

  async function sendNow() {
    setState("sending");
    setMessage(null);
    const res = await fetch(`/api/applications/${applicationId}/remind-now`, { method: "POST" }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setState("idle");
    setMessage(
      res?.ok
        ? { tone: "ok", text: "Sent — check your inbox for today's reminder." }
        : { tone: "crit", text: data?.message ?? "Couldn't send the reminder — try again." },
    );
  }

  return (
    <section className="rounded-[12px] border border-line bg-surface">
      <SectionHeader title="Daily reminders" />
      <div className="px-4 py-4 text-sm">
        {confirmedEmail ? (
          <>
            <p className="text-muted">
              Reminders are on for <span className="text-ink">{confirmedEmail}</span>. Each morning you&apos;ll get what&apos;s left,
              with a link back here.
            </p>
            <button
              type="button"
              onClick={sendNow}
              disabled={state === "sending"}
              className="mt-3 w-full rounded-[6px] border border-line px-4 py-2 font-medium text-ink transition-colors hover:bg-raised disabled:opacity-50"
            >
              {state === "sending" ? "Sending…" : "Send today's reminder now"}
            </button>
          </>
        ) : state === "sent" ? (
          <p className="text-muted">
            <b className="font-medium text-ink">Check your email.</b> We sent a sign-in link to {email}. Open it in this browser to turn
            reminders on.
          </p>
        ) : (
          <form onSubmit={sendMagicLink}>
            <p className="text-muted">Get one email a day listing what&apos;s left, with a link back here. No password needed.</p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-3 w-full rounded-[6px] border border-line bg-bg px-3 py-2 text-ink outline-none placeholder:text-faint focus:border-muted"
            />
            <button
              type="submit"
              disabled={state === "sending"}
              className="mt-2 w-full rounded-[6px] bg-accent px-4 py-2 font-medium text-on-accent disabled:opacity-50"
            >
              {state === "sending" ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
        {message && <p className={`mt-3 text-[13px] ${message.tone === "ok" ? "text-ok" : "text-crit"}`}>{message.text}</p>}
      </div>
    </section>
  );
}
