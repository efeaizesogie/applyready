"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import type { ChecklistItem } from "@/lib/db";
import { isOverdue, sortForDisplay } from "@/lib/plan";
import { ImportanceTag, SectionHeader } from "@/components/ui/Tag";

const prettyDate = (d: string) => format(parseISO(d), "MMM d");

export function Checklist({ items: initial, today }: { items: ChecklistItem[]; today: string }) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const done = items.filter((i) => i.done).length;
  const overdue = items.filter((i) => isOverdue(i.bestBy, i.done, today)).length;

  async function toggle(id: string) {
    const next = !items.find((i) => i.id === id)!.done;
    setError(null);
    setItems((all) => all.map((i) => (i.id === id ? { ...i, done: next } : i))); // optimistic
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: next }),
    }).catch(() => null);
    if (!res?.ok) {
      setItems((all) => all.map((i) => (i.id === id ? { ...i, done: !next } : i)));
      setError("Couldn't save that change — check your connection and try again.");
    }
  }

  return (
    <>
      <div className="mt-5">
        <div className="h-1 overflow-hidden rounded-full bg-raised">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-muted">
          <span>
            {done} of {items.length} done
          </span>
          {overdue > 0 && <span className="text-crit">{overdue} overdue</span>}
        </div>
      </div>

      <section className="mt-5 rounded-[12px] border border-line bg-surface">
        <SectionHeader title="Checklist" count={items.length} hint="Ranked by importance · tick when done" />
        {error && <p className="border-b border-line px-4 py-2 text-sm text-crit">{error}</p>}
        <ul>
          {sortForDisplay(items).map((item) => {
            const late = isOverdue(item.bestBy, item.done, today);
            return (
              <li key={item.id} className="border-t border-line first:border-t-0">
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-pressed={item.done}
                  className="grid w-full grid-cols-[20px_1fr_auto] items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent-soft"
                >
                  <span
                    className={`mt-0.5 grid size-4 place-items-center rounded border-[1.5px] ${item.done ? "border-accent bg-accent" : "border-faint"}`}
                  >
                    {item.done && (
                      <svg viewBox="0 0 12 12" className="size-2.5 text-on-accent" aria-hidden>
                        <path d="M2 6.5 5 9l5-6" fill="none" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    )}
                  </span>
                  <span>
                    <span className={`block text-sm font-medium ${item.done ? "text-faint line-through" : "text-ink"}`}>{item.title}</span>
                    {item.detail && !item.done && <span className="mt-0.5 block text-[13px] leading-snug text-muted">{item.detail}</span>}
                    {item.bestBy && (
                      <span className={`mt-1 block text-xs ${late ? "font-medium text-crit" : "text-faint"}`}>
                        Best by {prettyDate(item.bestBy)}
                        {late && " · overdue"}
                      </span>
                    )}
                  </span>
                  <ImportanceTag level={item.importance} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
