import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Application } from "@/lib/db";
import { Checklist } from "./Checklist";
import { ReminderPanel } from "./ReminderPanel";
import { SubmitPanel } from "./SubmitPanel";
import Link from "next/link";
import { Chip, ImportanceTag, SectionHeader } from "@/components/ui/Tag";

const TYPE_LABEL: Record<Application["type"], string> = {
  scholarship: "Scholarship",
  job: "Job",
  admission: "Admission",
  grant: "Grant",
  other: "Application",
};

// The dashboard URL can be opened by anyone holding it, so never show the full address.
function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 1)}•••@${domain}`;
}

export function Dashboard({ app, today, authStatus }: { app: Application; today: string; authStatus: string | null }) {
  const daysLeft = app.deadline ? differenceInCalendarDays(parseISO(app.deadline), parseISO(today)) : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <p className="text-xs text-faint">
        <Link href="/applications" className="hover:text-muted">
          My applications
        </Link>{" "}
        / <span className="font-mono">{app.id.slice(0, 8)}</span>
      </p>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{app.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip>{TYPE_LABEL[app.type]}</Chip>
            {app.organization && <Chip>{app.organization}</Chip>}
            {app.deadline && <Chip>Deadline {format(parseISO(app.deadline), "MMM d, yyyy")}</Chip>}
          </div>
        </div>
        <div className="text-right">
          {daysLeft === null ? (
            <p className="text-sm text-muted">No fixed deadline</p>
          ) : (
            <>
              <p className="text-4xl font-semibold leading-none tracking-[-0.03em]">
                <span className="text-accent">{daysLeft}</span> {daysLeft === 1 ? "day" : "days"}
              </p>
              <p className="mt-1 text-xs text-muted">{daysLeft === 0 ? "deadline is today" : "until deadline"}</p>
            </>
          )}
        </div>
      </div>

      {app.deadline === null && (
        <p className="mt-5 rounded-[12px] border border-line bg-surface px-4 py-3 text-sm text-muted">
          <b className="font-medium text-ink">No fixed deadline found.</b> {app.deadlineText ?? "The announcement doesn't state one."} Your
          checklist is below without dates — aim to finish early, since rolling applications can close anytime.
        </p>
      )}
      {app.tight && (
        <p className="mt-5 rounded-[12px] border border-imp/40 bg-surface px-4 py-3 text-sm text-muted">
          <b className="font-medium text-imp">Tight deadline.</b> Some steps need more time than is left, so dates are compressed. Start
          the critical items today.
        </p>
      )}

      <div className="mt-2 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Checklist items={app.items} today={today} />
        </div>

        <div className="space-y-4 lg:mt-5">
          {app.status === "in_progress" && (
            <ReminderPanel
              applicationId={app.id}
              confirmedEmail={app.remindersEnabled && app.email ? maskEmail(app.email) : null}
              authStatus={authStatus}
            />
          )}
          <SubmitPanel
            applicationId={app.id}
            status={app.status}
            submittedAt={app.submittedAt}
            followUpAt={app.followUpAt}
            followUpSent={app.followUpSent}
            allDone={app.items.length > 0 && app.items.every((i) => i.done)}
          />

          <section className="rounded-[12px] border border-line bg-surface">
            <SectionHeader title="Key details" count={app.keyDetails.length} />
            <ul>
              {app.keyDetails.map((d) => (
                <li key={d.label} className="flex items-start justify-between gap-3 border-t border-line px-4 py-3 first:border-t-0">
                  <span>
                    <span className="block text-[11px] font-medium uppercase tracking-[0.06em] text-faint">{d.label}</span>
                    <span className="mt-0.5 block text-sm text-ink">{d.value}</span>
                  </span>
                  <ImportanceTag level={d.importance} />
                </li>
              ))}
            </ul>
          </section>

          {app.guidance.length > 0 && (
            <section className="rounded-[12px] border border-line bg-surface">
              <SectionHeader title="Writing guidance" count={app.guidance.length} />
              {app.guidance.map((g) => (
                <div key={g.piece} className="border-t border-line px-4 py-3 first:border-t-0">
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold text-ink">{g.piece}</span>
                    {g.wordLimit && <span className="shrink-0 text-xs text-faint">{g.wordLimit}</span>}
                  </p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[13px] leading-snug text-muted marker:text-faint">
                    {g.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
