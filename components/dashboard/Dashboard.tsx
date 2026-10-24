import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Application } from "@/lib/db";
import { Checklist } from "./Checklist";
import { Chip, ImportanceTag } from "@/components/ui/Tag";

const TYPE_LABEL: Record<Application["type"], string> = {
  scholarship: "Scholarship",
  job: "Job",
  admission: "Admission",
  grant: "Grant",
  other: "Application",
};

export function Dashboard({ app, today }: { app: Application; today: string }) {
  const daysLeft = app.deadline ? differenceInCalendarDays(parseISO(app.deadline), parseISO(today)) : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <p className="text-xs text-faint">
        My applications / <span className="font-mono">{app.id.slice(0, 8)}</span>
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
          <section className="rounded-[12px] border border-line bg-surface">
            <header className="border-b border-line px-4 py-3 text-sm font-medium">Key details</header>
            <ul>
              {app.keyDetails.map((d) => (
                <li key={d.label} className="flex items-start justify-between gap-3 border-t border-line px-4 py-2.5 first:border-t-0">
                  <span className="text-sm">
                    <span className="block font-medium">{d.label}</span>
                    <span className="block text-muted">{d.value}</span>
                  </span>
                  <ImportanceTag level={d.importance} />
                </li>
              ))}
            </ul>
          </section>

          {app.guidance.length > 0 && (
            <section className="rounded-[12px] border border-line bg-surface">
              <header className="border-b border-line px-4 py-3 text-sm font-medium">Writing guidance</header>
              {app.guidance.map((g) => (
                <div key={g.piece} className="border-t border-line px-4 py-3 first:border-t-0">
                  <p className="text-sm font-medium">
                    {g.piece}
                    {g.wordLimit && <span className="font-normal text-muted"> · {g.wordLimit}</span>}
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted">
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
