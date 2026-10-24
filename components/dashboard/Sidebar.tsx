import Link from "next/link";
import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Application } from "@/lib/db";
import { PasteBox } from "@/components/landing/PasteBox";
import { SignOutButton } from "@/components/SignOutButton";

type Props = { currentId: string; applications: Application[] | null; today: string };

function daysLabel(app: Application, today: string) {
  if (app.status === "submitted") return "✓";
  if (!app.deadline) return "—";
  const d = differenceInCalendarDays(parseISO(app.deadline), parseISO(today));
  return d < 0 ? "closed" : `${d}d`;
}

export function Sidebar({ currentId, applications, today }: Props) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-6 space-y-6">
        <div>
          <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">New scan</h2>
          <PasteBox compact />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">My applications</h2>
            {applications && <span className="text-[11px] text-faint">{applications.length}</span>}
          </div>
          {applications ? (
            <ul className="space-y-0.5">
              {applications.map((a) => {
                const active = a.id === currentId;
                return (
                  <li key={a.id}>
                    <Link
                      href={`/a/${a.id}`}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between gap-3 rounded-[6px] px-2.5 py-1.5 text-[13px] transition-colors ${
                        active ? "bg-raised text-ink" : "text-muted hover:bg-raised/60 hover:text-ink"
                      }`}
                    >
                      <span className="truncate">{a.title}</span>
                      <span className="shrink-0 text-[11px] text-faint">{daysLabel(a, today)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-2.5 text-[13px] text-faint">
              <Link href="/applications" className="hover:text-ink">
                Sign in
              </Link>{" "}
              to see them.
            </p>
          )}
        </div>

        {applications && <SignOutButton />}
      </div>
    </aside>
  );
}
