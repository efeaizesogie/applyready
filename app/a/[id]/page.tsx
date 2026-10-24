import { Suspense } from "react";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getApplication } from "@/lib/db";
import { Dashboard } from "@/components/dashboard/Dashboard";

async function ApplicationDashboard({ params }: { params: PageProps<"/a/[id]">["params"] }) {
  const { id } = await params;
  const app = await getApplication(id);
  if (!app) notFound();
  return <Dashboard app={app} today={format(new Date(), "yyyy-MM-dd")} />;
}

export default function ApplicationPage({ params }: PageProps<"/a/[id]">) {
  return (
    <main className="flex-1">
      <Suspense fallback={<p className="mx-auto w-full max-w-5xl px-4 py-8 text-sm text-muted">Loading your application…</p>}>
        <ApplicationDashboard params={params} />
      </Suspense>
    </main>
  );
}
