import type { Importance } from "@/lib/ai/schema";

const STYLE: Record<Importance, string> = {
  critical: "text-crit border-crit/50",
  important: "text-imp border-imp/50",
  nice: "text-nice border-nice/50",
};

export const IMPORTANCE_LABEL: Record<Importance, string> = { critical: "Critical", important: "Important", nice: "Nice to have" };

export function ImportanceTag({ level }: { level: Importance }) {
  return (
    <span className={`shrink-0 whitespace-nowrap rounded border px-2 py-px text-[11px] ${STYLE[level]}`}>
      {IMPORTANCE_LABEL[level]}
    </span>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-line px-2.5 py-px text-xs text-muted">{children}</span>;
}
