"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanProgress, type Stage } from "@/components/scan/ScanProgress";

const URL_ONLY = /^https?:\/\/\S+$/i;
const READ_STAGES = ["Reading requirements", "Finding the deadline", "Building your plan"];

export function PasteBox({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [stages, setStages] = useState<Stage[] | null>(null);
  const [notice, setNotice] = useState<{ tone: "warn" | "crit"; title: string; body?: string } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const isUrl = URL_ONLY.test(input.trim());

  function setStage(label: string, state: Stage["state"]) {
    setStages((all) => all?.map((s) => (s.label === label ? { ...s, state } : s)) ?? null);
  }

  function fail(n: { tone: "warn" | "crit"; title: string; body?: string }, clearInput = false) {
    if (timer.current) clearInterval(timer.current);
    setStages(null);
    setNotice(n);
    if (clearInput) setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function scan() {
    const value = input.trim();
    setNotice(null);
    setStages([...(isUrl ? ["Fetching the page"] : []), ...READ_STAGES].map((label) => ({ label, state: "pending" })));

    let text = value;
    let sourceUrl: string | null = null;

    if (isUrl) {
      setStage("Fetching the page", "active");
      const res = await fetch("/api/fetch-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      }).catch(() => null);
      const data = await res?.json().catch(() => null);
      if (!data || data.blocked || !res?.ok) {
        return fail(
          {
            tone: "warn",
            title: "We couldn't read that link. Paste the announcement text instead.",
            body: data?.reason ? `${data.reason}.` : undefined,
          },
          true,
        );
      }
      text = data.text;
      sourceUrl = value;
      setStage("Fetching the page", "done");
    }

    // The reading stages share one AI call; they advance on a timer and all complete when it returns.
    let i = 0;
    setStage(READ_STAGES[0], "active");
    timer.current = setInterval(() => {
      if (i < READ_STAGES.length - 1) {
        setStage(READ_STAGES[i], "done");
        i++;
        setStage(READ_STAGES[i], "active");
      }
    }, 2500);

    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sourceUrl }),
      signal: AbortSignal.timeout(90_000),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);

    if (!res?.ok || !data?.id) {
      const closed = data?.error === "deadline_passed";
      const notApp = data?.error === "not_application";
      return fail({
        tone: closed || notApp ? "warn" : "crit",
        title: data?.message ?? "Something went wrong — try again.",
        body: notApp ? data.reason ?? "Paste a scholarship, job, admission or grant announcement." : undefined,
      });
    }

    if (timer.current) clearInterval(timer.current);
    setStages((all) => all?.map((s) => ({ ...s, state: "done" })) ?? null);
    router.push(`/a/${data.id}`);
  }

  const busy = stages !== null;

  return (
    <div className={`w-full text-left ${compact ? "" : "mx-auto max-w-2xl"}`}>
      <div className={`rounded-[12px] border border-line bg-surface ${compact ? "p-1.5" : "p-2 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"}`}>
        {busy ? (
          <ScanProgress stages={stages} />
        ) : (
          <>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && input.trim()) scan();
              }}
              placeholder={compact ? "Paste a link or text…" : "Paste a link or the full announcement text…"}
              aria-label="Announcement link or text"
              rows={compact ? 2 : 3}
              className={`w-full resize-y bg-transparent text-ink outline-none placeholder:text-faint ${compact ? "max-h-48 min-h-14 px-2.5 py-2 text-[13px]" : "max-h-72 min-h-20 px-3 py-2.5 text-[15px]"}`}
            />
            <div className="flex items-center justify-between gap-3 pl-3">
              <span className="text-xs text-faint">{isUrl ? (compact ? "Link detected" : "Link detected — we'll read the page") : compact ? "" : "Scholarships · jobs · admissions · grants"}</span>
              <button
                type="button"
                onClick={scan}
                disabled={!isUrl && input.trim().length < 40}
                className={`rounded-[6px] bg-accent font-medium text-on-accent transition-opacity disabled:opacity-40 ${compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}`}
              >
                Scan →
              </button>
            </div>
          </>
        )}
      </div>
      {notice && (
        <div
          role="alert"
          className={`mt-3 rounded-[12px] border bg-surface px-4 py-3 text-sm ${notice.tone === "crit" ? "border-crit/40" : "border-imp/40"}`}
        >
          <p className={`font-medium ${notice.tone === "crit" ? "text-crit" : "text-imp"}`}>{notice.title}</p>
          {notice.body && <p className="mt-0.5 text-muted">{notice.body}</p>}
        </div>
      )}
    </div>
  );
}
