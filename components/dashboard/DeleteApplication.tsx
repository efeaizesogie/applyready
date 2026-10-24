"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteApplication({ applicationId, title }: { applicationId: string; title: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/applications/${applicationId}`, { method: "DELETE" }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (!res?.ok) {
      setDeleting(false);
      setError(data?.message ?? "Couldn't delete — try again.");
      return;
    }
    router.push("/applications");
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full rounded-[6px] px-4 py-2 text-left text-[13px] text-faint transition-colors hover:text-crit"
      >
        Delete this application…
      </button>
    );
  }

  return (
    <section className="rounded-[12px] border border-crit/40 bg-surface px-4 py-4 text-sm" role="alertdialog" aria-label="Confirm delete">
      <p className="font-medium text-ink">Delete “{title}”?</p>
      <p className="mt-1 text-muted">This permanently removes the checklist and stops all its reminders. It can&apos;t be undone.</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={remove}
          disabled={deleting}
          className="flex-1 rounded-[6px] bg-crit px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete permanently"}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="rounded-[6px] border border-line px-4 py-2 text-muted">
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-[13px] text-crit">{error}</p>}
    </section>
  );
}
