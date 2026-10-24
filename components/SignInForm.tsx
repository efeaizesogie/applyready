"use client";

import { useState } from "react";

// Magic-link sign-in for returning users; lands back on /applications.
export function SignInForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (!res?.ok) {
      setState("idle");
      setError(data?.message ?? "Couldn't send the link — try again.");
    } else setState("sent");
  }

  if (state === "sent") {
    return (
      <p className="text-sm text-muted">
        <b className="font-medium text-ink">Check your email.</b> Open the link we sent to {email} — it works on any device.
      </p>
    );
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="flex-1 rounded-[6px] border border-line bg-bg px-3 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-muted"
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="rounded-[6px] bg-accent px-4 py-2 text-sm font-medium text-on-accent disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "Email me a sign-in link"}
      </button>
      {error && <p className="text-[13px] text-crit sm:basis-full">{error}</p>}
    </form>
  );
}
