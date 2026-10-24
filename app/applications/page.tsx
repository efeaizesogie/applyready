import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { getSessionUser } from "@/lib/supabase/server";
import { listApplicationsForUser, type Application } from "@/lib/db";
import { SignInForm } from "@/components/SignInForm";
import { SignOutButton } from "@/components/SignOutButton";

function daysLeft(app: Application) {
  return app.deadline ? differenceInCalendarDays(parseISO(app.deadline), new Date()) : null;
}

function StatusLabel({ app }: { app: Application }) {
  const left = daysLeft(app);
  if (app.status === "submitted") return <span className="text-ok">Submitted</span>;
  if (left !== null && left < 0) return <span className="text-faint">Closed</span>;
  return <span className="text-muted">In progress</span>;
}

async function ApplicationList() {
  await connection(); // days-left depends on today's date, so always render per request
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="mt-6 rounded-[12px] border border-line bg-surface p-5">
        <p className="mb-3 text-sm text-muted">Enter the email you use for reminders to see your applications. No password needed.</p>
        <SignInForm />
      </div>
    );
  }

  const apps = await listApplicationsForUser(user.id);
  const signedIn = (
    <div className="mt-2 flex items-center gap-1 text-[13px] text-faint">
      Signed in as <span className="text-muted">{user.email}</span> · <SignOutButton />
    </div>
  );
  if (apps.length === 0) {
    return (
      <>
        {signedIn}
        <div className="mt-6 rounded-[12px] border border-line bg-surface p-8 text-center">
          <p className="font-medium">No applications yet</p>
          <p className="mt-1 text-sm text-muted">Paste an announcement to build your first plan.</p>
          <Link href="/" className="mt-4 inline-block rounded-[6px] bg-accent px-4 py-2 text-sm font-medium text-on-accent">
            Scan an announcement
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {signedIn}
      <ul className="mt-6 overflow-hidden rounded-[12px] border border-line bg-surface">
        {apps.map((app) => {
          const left = daysLeft(app);
          const done = app.items.filter((i) => i.done).length;
          return (
            <li key={app.id} className="border-t border-line first:border-t-0">
              <Link
                href={`/a/${app.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-accent-soft"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{app.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    <span className="capitalize">{app.type}</span> · <StatusLabel app={app} /> · {done}/{app.items.length} done
                  </p>
                  <div className="mt-2 h-1 w-full max-w-60 overflow-hidden rounded-full bg-raised">
                    <div className="h-full bg-accent" style={{ width: `${app.items.length ? (done / app.items.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  {left === null ? (
                    <p className="text-xs text-muted">No deadline</p>
                  ) : left < 0 ? (
                    <p className="text-xs text-faint">Closed</p>
                  ) : (
                    <p className="text-lg font-semibold">
                      <span className={app.status === "submitted" ? "text-muted" : "text-accent"}>{left}</span>
                      <span className="text-sm font-normal text-muted"> days</span>
                    </p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function ApplicationsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-[-0.02em]">My applications</h1>
        <Link href="/" className="rounded-[6px] border border-line px-3 py-1.5 text-sm text-ink hover:bg-raised">
          + New
        </Link>
      </div>
      <Suspense fallback={<p className="mt-6 text-sm text-muted">Loading…</p>}>
        <ApplicationList />
      </Suspense>
    </main>
  );
}
