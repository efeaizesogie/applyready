import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { format } from "date-fns";
import { getApplication, listApplicationsForUser } from "@/lib/db";
import { getSessionUser } from "@/lib/supabase/server";
import { Dashboard } from "@/components/dashboard/Dashboard";

type Props = PageProps<"/a/[id]">;

async function ApplicationDashboard({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  await connection(); // countdown and overdue flags depend on today's date
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [app, user] = await Promise.all([getApplication(id), getSessionUser()]);
  if (!app) notFound();
  const myApplications = user ? await listApplicationsForUser(user.id) : null;
  const auth = typeof query.auth === "string" ? query.auth : null;
  return <Dashboard app={app} today={format(new Date(), "yyyy-MM-dd")} authStatus={auth} myApplications={myApplications} />;
}

export default function ApplicationPage({ params, searchParams }: Props) {
  return (
    <main className="flex-1">
      <Suspense fallback={<p className="mx-auto w-full max-w-5xl px-4 py-8 text-sm text-muted">Loading your application…</p>}>
        <ApplicationDashboard params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
