"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Temporary paste box until the landing page (slice 5): scan, save, open the dashboard.
export function ScanPreview() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function scan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push(`/a/${data.id}`);
    } catch {
      setError("Network error — try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-[12px] border border-line bg-surface p-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the full announcement text…"
          className="min-h-40 w-full resize-y bg-transparent p-3 outline-none placeholder:text-faint"
        />
        <div className="flex justify-end p-1">
          <button
            onClick={scan}
            disabled={loading || text.trim().length < 40}
            className="rounded-[6px] bg-accent px-4 py-2 text-sm font-medium text-on-accent disabled:opacity-40"
          >
            {loading ? "Scanning…" : "Scan →"}
          </button>
        </div>
      </div>
      {error && <p className="rounded-[12px] border border-crit/40 bg-surface p-4 text-crit">{error}</p>}
    </div>
  );
}
