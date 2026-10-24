// Runs the real extractor + planner on the fixtures and reports timing and validity.
// Run: npx tsx --env-file=.env.local scripts/try-extract.mts [model ...]
import { readFileSync } from "node:fs";
import { format } from "date-fns";
import { extractAnnouncement } from "../lib/ai/extract";
import { buildPlan } from "../lib/plan";

const models = process.argv.slice(2).length ? process.argv.slice(2) : [process.env.LLM_MODEL!];
const fixtures = ["scholarship", "job", "not-application"];
const today = format(new Date(), "yyyy-MM-dd");

for (const model of models) {
  process.env.LLM_MODEL = model;
  console.log(`\n=== ${model}`);
  for (const name of fixtures) {
    const text = readFileSync(new URL(`./fixtures/${name}.txt`, import.meta.url), "utf8");
    const started = Date.now();
    try {
      const x = await extractAnnouncement(text, today);
      const secs = ((Date.now() - started) / 1000).toFixed(1);
      if (!x.isApplication) {
        console.log(`${name}: rejected as not an application (${secs}s) — ${x.notApplicationReason}`);
        continue;
      }
      const plan = buildPlan(x.checklist, x.deadline, today);
      console.log(
        `${name}: OK ${secs}s · "${x.title}" · ${x.type} · deadline ${x.deadline} · ${x.keyDetails.length} details · ${x.guidance.length} guidance · ${x.checklist.length} items · ${plan.status === "open" ? `${plan.daysLeft}d left${plan.tight ? " (tight)" : ""}` : "closed"}`,
      );
      if (process.env.VERBOSE) console.log(JSON.stringify({ x, plan }, null, 2));
    } catch (err) {
      console.log(`${name}: FAILED after ${((Date.now() - started) / 1000).toFixed(1)}s — ${(err as Error).message}`);
    }
  }
}
