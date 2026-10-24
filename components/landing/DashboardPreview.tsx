import type { Importance } from "@/lib/ai/schema";
import { ImportanceTag } from "@/components/ui/Tag";

// Static example for the landing page — sample data, not a real application.
const ITEMS: { title: string; when: string; level: Importance; done?: boolean; late?: boolean }[] = [
  { title: "Draft statement of purpose", when: "Best by Oct 22 · overdue", level: "critical", late: true },
  { title: "Request official transcript", when: "Best by Oct 27", level: "critical" },
  { title: "Two academic reference letters", when: "Best by Oct 29", level: "critical" },
  { title: "Tailor CV to the 3 key criteria", when: "Best by Oct 31", level: "important", done: true },
  { title: "Copy of passport data page", when: "Best by Nov 2", level: "nice", done: true },
];

export function DashboardPreview() {
  return (
    <div className="rounded-t-[14px] border border-b-0 border-line bg-surface p-2.5 pb-0" aria-label="Example dashboard">
      <div className="rounded-t-[10px] border border-b-0 border-line bg-bg text-left">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.06em] text-faint">Example</p>
            <p className="text-lg font-semibold tracking-[-0.02em]">Global Futures Scholarship</p>
            <p className="text-xs text-muted">Scholarship · Masters · Deadline Nov 5</p>
          </div>
          <p className="text-3xl font-semibold tracking-[-0.03em]">
            <span className="text-accent">12</span> days
          </p>
        </div>
        <div className="px-5 pt-3">
          <div className="h-1 overflow-hidden rounded-full bg-raised">
            <div className="h-full w-2/5 rounded-full bg-accent" />
          </div>
        </div>
        <ul className="px-2 py-2">
          {ITEMS.map((i) => (
            <li key={i.title} className="grid grid-cols-[20px_1fr_auto] items-start gap-3 rounded-[6px] px-3 py-2.5">
              <span className={`mt-0.5 size-4 rounded border-[1.5px] ${i.done ? "border-accent bg-accent" : "border-faint"}`} />
              <span>
                <span className={`block text-sm font-medium ${i.done ? "text-faint line-through" : "text-ink"}`}>{i.title}</span>
                <span className={`block text-xs ${i.late && !i.done ? "text-crit" : "text-faint"}`}>{i.when}</span>
              </span>
              <ImportanceTag level={i.level} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
