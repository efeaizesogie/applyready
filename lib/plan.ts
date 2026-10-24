import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import type { ExtractedItem, Importance } from "./ai/schema";

export type PlannedItem = {
  title: string;
  detail: string | null;
  importance: Importance;
  bestBy: string | null; // YYYY-MM-DD
  position: number; // order of work
};

export type Plan =
  | { status: "closed"; deadline: string }
  | {
      status: "open";
      deadline: string | null;
      daysLeft: number | null;
      tight: boolean;
      items: PlannedItem[];
    };

const IMPORTANCE_RANK: Record<Importance, number> = { critical: 0, important: 1, nice: 2 };

const iso = (d: Date) => format(d, "yyyy-MM-dd");

/** Display order: most important first, then earliest best-by. */
export function sortForDisplay<T extends { importance: Importance; bestBy: string | null; position: number }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) =>
      IMPORTANCE_RANK[a.importance] - IMPORTANCE_RANK[b.importance] ||
      (a.bestBy ?? "9999").localeCompare(b.bestBy ?? "9999") ||
      a.position - b.position,
  );
}

/**
 * Works backward from the deadline: the last item is due the day before it
 * (a buffer for submitting), and items are spaced evenly across the time left,
 * in working order. Tasks overlap in real life (you draft the essay while
 * referees write), so an item is only pushed later when it needs more lead
 * time (`effortDays`) than its slot allows. If one can't fit at all, the plan
 * is flagged tight. The AI decides what and how long; this decides when,
 * because calendar maths is where models slip.
 */
export function buildPlan(checklist: ExtractedItem[], deadline: string | null, today: string): Plan {
  const todayDate = parseISO(today);

  if (!deadline) {
    return {
      status: "open",
      deadline: null,
      daysLeft: null,
      tight: false,
      items: checklist.map((c, i) => ({ title: c.title, detail: c.detail, importance: c.importance, bestBy: null, position: i })),
    };
  }

  const deadlineDate = parseISO(deadline);
  const daysLeft = differenceInCalendarDays(deadlineDate, todayDate);
  if (daysLeft < 0) return { status: "closed", deadline };

  const lastDay = daysLeft >= 1 ? addDays(deadlineDate, -1) : deadlineDate;
  const available = differenceInCalendarDays(lastDay, todayDate);

  const n = checklist.length;
  let tight = false;
  let previous = 0;
  const bestBy = checklist.map((c, i) => {
    const slot = Math.round((available * (i + 1)) / n);
    const lead = Math.max(1, c.effortDays);
    if (lead > available) tight = true;
    const day = Math.min(available, Math.max(slot, lead, previous));
    previous = day;
    return iso(addDays(todayDate, day));
  });

  return {
    status: "open",
    deadline,
    daysLeft,
    tight,
    items: checklist.map((c, i) => ({
      title: c.title,
      detail: c.detail,
      importance: c.importance,
      bestBy: bestBy[i],
      position: i,
    })),
  };
}

export function isOverdue(bestBy: string | null, done: boolean, today: string) {
  return !done && bestBy !== null && bestBy < today;
}
