"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { SectionHeader } from "@/components/ui/Tag";

type Props = {
  applicationId: string;
  status: "in_progress" | "submitted";
  submittedAt: string | null;
  followUpAt: string | null;
  followUpSent: boolean;
  allDone: boolean;
};

export function SubmitPanel({ applicationId, status, submittedAt, followUpAt, followUpSent, allDone }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "choose" | "saving">("idle");
  const [wantFollowUp, setWantFollowUp] = useState(true);
  const [days, setDays] = useState(14);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setStep("saving");
    setError(null);
    const res = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "submitted", followUpDays: wantFollowUp ? days : null }),
    }).catch(() => null);
    if (!res?.ok) {
      setStep("choose");
      setError("Couldn't save — try again.");
      return;
    }
    router.refresh();
  }

  if (status === "submitted") {
    return (
      <section className="rounded-[12px] border border-ok/40 bg-surface">
        <SectionHeader title="Submitted" />
        <div className="space-y-1 px-4 py-4 text-sm text-muted">
          <p>
            You submitted this on <span className="text-ink">{submittedAt ? format(parseISO(submittedAt), "MMM d, yyyy") : "—"}</span>.
            Daily reminders have stopped.
          </p>
          <p>
            {followUpAt
              ? followUpSent
                ? "Your follow-up reminder has been sent."
                : `We'll remind you to follow up on ${format(parseISO(followUpAt), "MMM d")} if you haven't heard back.`
              : "No follow-up reminder scheduled."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[12px] border border-line bg-surface">
      <SectionHeader title="Submit" />
      <div className="px-4 py-4 text-sm">
        {step === "idle" ? (
          <>
            <p className="text-muted">
              {allDone ? "Everything is ticked. Submitted it? Mark it here to stop daily reminders." : "Already sent it? Mark it submitted to stop daily reminders."}
            </p>
            <button
              type="button"
              onClick={() => setStep("choose")}
              className={`mt-3 w-full rounded-[6px] px-4 py-2 font-medium ${allDone ? "bg-accent text-on-accent" : "border border-line text-ink hover:bg-raised"}`}
            >
              Mark as submitted
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="font-medium text-ink">Remind you to follow up?</p>
            <label className="flex items-center gap-2 text-muted">
              <input type="radio" checked={wantFollowUp} onChange={() => setWantFollowUp(true)} className="accent-[var(--accent)]" />
              Yes, if I haven&apos;t heard back after
              <input
                type="number"
                min={1}
                max={90}
                value={days}
                onChange={(e) => setDays(Math.max(1, Math.min(90, Number(e.target.value) || 14)))}
                className="w-14 rounded-[6px] border border-line bg-bg px-2 py-1 text-ink"
              />
              days
            </label>
            <label className="flex items-center gap-2 text-muted">
              <input type="radio" checked={!wantFollowUp} onChange={() => setWantFollowUp(false)} className="accent-[var(--accent)]" />
              No follow-up reminder
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={submit}
                disabled={step === "saving"}
                className="flex-1 rounded-[6px] bg-accent px-4 py-2 font-medium text-on-accent disabled:opacity-50"
              >
                {step === "saving" ? "Saving…" : "Confirm submitted"}
              </button>
              <button type="button" onClick={() => setStep("idle")} className="rounded-[6px] border border-line px-4 py-2 text-muted">
                Cancel
              </button>
            </div>
            {error && <p className="text-[13px] text-crit">{error}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
