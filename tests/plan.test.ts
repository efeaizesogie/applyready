import { describe, expect, it } from "vitest";
import { buildPlan, isOverdue, sortForDisplay } from "@/lib/plan";
import type { ExtractedItem } from "@/lib/ai/schema";

const item = (title: string, effortDays: number, importance: ExtractedItem["importance"] = "important"): ExtractedItem => ({
  title,
  detail: null,
  importance,
  effortDays,
});

const checklist = [item("Request transcript", 5, "critical"), item("Draft SOP", 7, "critical"), item("Final review and submit", 1)];

describe("buildPlan", () => {
  it("spaces items evenly up to the day before the deadline when there is room", () => {
    const plan = buildPlan(checklist, "2026-11-30", "2026-10-24");
    expect(plan.status).toBe("open");
    if (plan.status !== "open") return;
    expect(plan.daysLeft).toBe(37);
    expect(plan.tight).toBe(false);
    expect(plan.items.map((i) => i.bestBy)).toEqual(["2026-11-05", "2026-11-17", "2026-11-29"]);
  });

  it("pushes an item later when it needs more lead time than its slot", () => {
    const plan = buildPlan([item("Ask referees", 20), item("Draft SOP", 3), item("Submit", 1)], "2026-11-30", "2026-10-24");
    if (plan.status !== "open") throw new Error("expected open");
    expect(plan.tight).toBe(false);
    // slot 1 would be day 12, but referees need 20 days; the next item can't come before it
    expect(plan.items.map((i) => i.bestBy)).toEqual(["2026-11-13", "2026-11-17", "2026-11-29"]);
  });

  it("does not call a long plan tight just because tasks add up past the deadline", () => {
    const many = Array.from({ length: 10 }, (_, i) => item(`Task ${i}`, 7));
    const plan = buildPlan(many, "2026-11-30", "2026-10-24");
    if (plan.status !== "open") throw new Error("expected open");
    expect(plan.tight).toBe(false);
  });

  it("compresses and flags tight when the work does not fit", () => {
    const plan = buildPlan(checklist, "2026-10-30", "2026-10-24");
    if (plan.status !== "open") throw new Error("expected open");
    expect(plan.tight).toBe(true);
    const dates = plan.items.map((i) => i.bestBy!);
    expect(dates[0] >= "2026-10-24").toBe(true);
    expect(dates.at(-1)).toBe("2026-10-29");
    expect([...dates].sort()).toEqual(dates); // still in working order
  });

  it("leaves dates empty when there is no fixed deadline", () => {
    const plan = buildPlan(checklist, null, "2026-10-24");
    if (plan.status !== "open") throw new Error("expected open");
    expect(plan.daysLeft).toBeNull();
    expect(plan.items.every((i) => i.bestBy === null)).toBe(true);
  });

  it("closes when the deadline has passed", () => {
    expect(buildPlan(checklist, "2026-10-01", "2026-10-24")).toEqual({ status: "closed", deadline: "2026-10-01" });
  });

  it("puts everything on the deadline when it is today", () => {
    const plan = buildPlan(checklist, "2026-10-24", "2026-10-24");
    if (plan.status !== "open") throw new Error("expected open");
    expect(plan.tight).toBe(true);
    expect(plan.items.every((i) => i.bestBy === "2026-10-24")).toBe(true);
  });
});

describe("display helpers", () => {
  it("sorts by importance, then best-by", () => {
    const plan = buildPlan([item("b", 2, "nice"), item("a", 2, "critical"), item("c", 2, "critical")], "2026-11-30", "2026-10-24");
    if (plan.status !== "open") throw new Error("expected open");
    expect(sortForDisplay(plan.items).map((i) => i.title)).toEqual(["a", "c", "b"]);
  });

  it("flags overdue only for unticked past items", () => {
    expect(isOverdue("2026-10-20", false, "2026-10-24")).toBe(true);
    expect(isOverdue("2026-10-20", true, "2026-10-24")).toBe(false);
    expect(isOverdue(null, false, "2026-10-24")).toBe(false);
  });
});
