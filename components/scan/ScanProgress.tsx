export type StageState = "pending" | "active" | "done";
export type Stage = { label: string; state: StageState };

export function ScanProgress({ stages }: { stages: Stage[] }) {
  return (
    <ol className="space-y-3 px-3 py-4" aria-live="polite">
      {stages.map((s) => (
        <li key={s.label} className="flex items-center gap-3 text-sm">
          <span className="grid size-5 place-items-center">
            {s.state === "done" ? (
              <svg viewBox="0 0 16 16" className="size-4 text-ok" aria-hidden>
                <circle cx="8" cy="8" r="7" fill="currentColor" opacity=".18" />
                <path d="M4.5 8.2 7 10.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            ) : s.state === "active" ? (
              <span className="size-4 animate-spin rounded-full border-2 border-line border-t-accent" aria-hidden />
            ) : (
              <span className="size-2 rounded-full bg-line" aria-hidden />
            )}
          </span>
          <span className={s.state === "pending" ? "text-faint" : s.state === "active" ? "text-ink" : "text-muted"}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}
