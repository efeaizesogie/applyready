"use client";

import { useState } from "react";
import type { Extraction, Importance } from "@/lib/ai/schema";
import { sortForDisplay, type Plan } from "@/lib/plan";

type ScanResult = { today: string; extraction: Extraction; plan: Extract<Plan, { status: "open" }> };

const TAG: Record<Importance, string> = {
  critical: "text-crit border-crit/50",
  important: "text-imp border-imp/50",
  nice: "text-nice border-nice/50",
};
const LABEL: Record<Importance, string> = { critical: "Critical", important: "Important", nice: "Nice to have" };

// Temporary slice-1 view: proves extraction + planning end to end before the dashboard exists.
export function ScanPreview() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function scan() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.message ?? "Something went wrong.");
      else setResult(data);
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
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

      {result && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{result.extraction.title}</h2>
              <p className="text-sm text-muted">
                {[result.extraction.organization, result.extraction.type, result.extraction.deadlineText].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="text-right">
              {result.plan.daysLeft === null ? (
                <p className="text-sm text-muted">No fixed deadline found</p>
              ) : (
                <p className="text-3xl font-semibold">
                  <span className="text-accent">{result.plan.daysLeft}</span> days
                </p>
              )}
              {result.plan.tight && <p className="text-xs text-imp">Tight deadline</p>}
            </div>
          </div>

          <section className="rounded-[12px] border border-line bg-surface">
            <h3 className="border-b border-line px-4 py-3 text-sm font-medium">Key details</h3>
            {result.extraction.keyDetails.map((d) => (
              <div key={d.label} className="flex gap-3 border-t border-line px-4 py-2 first:border-t-0">
                <span className={`h-fit rounded border px-2 text-xs ${TAG[d.importance]}`}>{LABEL[d.importance]}</span>
                <span className="text-sm">
                  <b className="font-medium">{d.label}:</b> <span className="text-muted">{d.value}</span>
                </span>
              </div>
            ))}
          </section>

          <section className="rounded-[12px] border border-line bg-surface">
            <h3 className="border-b border-line px-4 py-3 text-sm font-medium">Checklist</h3>
            {sortForDisplay(result.plan.items).map((i) => (
              <div key={i.position} className="flex items-start justify-between gap-3 border-t border-line px-4 py-2 first:border-t-0">
                <div>
                  <p className="text-sm">{i.title}</p>
                  {i.bestBy && <p className="text-xs text-muted">Best by {i.bestBy}</p>}
                </div>
                <span className={`rounded border px-2 text-xs ${TAG[i.importance]}`}>{LABEL[i.importance]}</span>
              </div>
            ))}
          </section>

          {result.extraction.guidance.length > 0 && (
            <section className="rounded-[12px] border border-line bg-surface">
              <h3 className="border-b border-line px-4 py-3 text-sm font-medium">Writing guidance</h3>
              {result.extraction.guidance.map((g) => (
                <div key={g.piece} className="border-t border-line px-4 py-3 first:border-t-0">
                  <p className="text-sm font-medium">
                    {g.piece}
                    {g.wordLimit && <span className="text-muted"> · {g.wordLimit}</span>}
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-muted">
                    {g.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
